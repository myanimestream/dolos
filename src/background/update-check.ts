/**
 * @module background
 */

import {AnimeInfo, grobberClient, GrobberErrorType, GrobberResponseError} from "dolos/grobber";
import AsyncLock from "dolos/lock";
import {AnimeSubscriptionInfo, SubscriptionError} from "dolos/models";
import {store} from "dolos/store";
import {first} from "rxjs/operators";
import {hasNewEpisode$} from "./observables";

/** Event emitted if there is a new episode */
export interface NewEpisodeEvent {
    subscription: AnimeSubscriptionInfo;
    unseenEpisodes: number;
}

/**
 * Check all Anime stored in [[Store.getAnimeSubscriptions]] for updates.
 * Emits [[NewEpisodeEvent]] through [[hasNewEpisode$]] if a new episode was found.
 */
async function checkAnimeUpdate() {
    const animeSubscriptions: Array<Readonly<AnimeSubscriptionInfo>> = Object.values(
        await store.getAnimeSubscriptions$()
            .pipe(first())
            .toPromise());

    // there's absolutely no rush, so let's do it sequentially!
    for (const animeSubscription of animeSubscriptions) {
        if (animeSubscription.error) continue;

        const subSetter = store.getMutAnimeSubscription(animeSubscription);

        const oldAnime = animeSubscription.anime;
        const uid = oldAnime.uid;

        let newAnime: AnimeInfo;
        try {
            newAnime = await grobberClient.getAnimeInfo(uid);
        } catch (e) {
            if (e instanceof GrobberResponseError) {
                if (e.name === GrobberErrorType.UIDUnknown) {
                    await subSetter.set(SubscriptionError.UIDUnknown, "error");
                    continue;
                }
            }

            console.error("Couldn't get anime info", e);
            continue;
        }

        await subSetter.set(newAnime, "anime");

        if (newAnime.episodes > oldAnime.episodes) {
            const event: NewEpisodeEvent = {
                subscription: animeSubscription,
                unseenEpisodes: newAnime.episodes - animeSubscription.episodesWatched,
            };

            hasNewEpisode$.next(event);
        }
    }
}

const updateLock = new AsyncLock();

/**
 * Check for updates for subscribed Media.
 * There can only be one check running at a given time.
 *
 * Performs:
 * - [[checkAnimeUpdate]]
 */
export function performUpdateCheck() {
    // don't check if there's already one ongoing
    if (updateLock.isLocked()) return;

    updateLock.withLock(async () => {
        await checkAnimeUpdate();
    }).catch(console.error);
}
