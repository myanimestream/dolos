/**
 * @module background
 */

import {AnimeInfo, grobberClient, GrobberErrorType, GrobberResponseError} from "dolos/grobber";
import AsyncLock from "dolos/lock";
import {AnimeSubscriptionInfo, AnimeSubscriptions, SubscriptionError} from "dolos/models";
import Store from "dolos/store";
import {hasNewEpisode$} from "./observables";

/** Event emitted if there is a new episode */
export interface NewEpisodeEvent {
    subscribedAnimes: AnimeSubscriptions;
    subscription: AnimeSubscriptionInfo;
    unseenEpisodes: number;
}

/**
 * Check all Anime stored in [[Store.getAnimeSubscriptions]] for updates.
 * Emits [[NewEpisodeEvent]] through [[hasNewEpisode$]] if a new episode was found.
 */
async function checkAnimeUpdate() {
    const subscribedAnimes = await Store.getAnimeSubscriptions();

    // there's absolutely no rush, so let's do it sequentially!
    for (const animeSubscription of Object.values(subscribedAnimes)) {
        if (animeSubscription.error) continue;

        const oldAnime = animeSubscription.anime;
        const uid = oldAnime.uid;

        let newAnime: AnimeInfo;
        try {
            newAnime = await grobberClient.getAnimeInfo(uid);
        } catch (e) {
            if (e instanceof GrobberResponseError) {
                if (e.name === GrobberErrorType.UIDUnknown) {
                    animeSubscription.error = SubscriptionError.UIDUnknown;
                    continue;
                }
            }

            console.error("Couldn't get anime info", e);
            continue;
        }

        animeSubscription.anime = newAnime;

        if (newAnime.episodes > oldAnime.episodes) {
            const event: NewEpisodeEvent = {
                subscribedAnimes,
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
