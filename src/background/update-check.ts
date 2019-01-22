/**
 * @module background
 */

import {hasNewEpisode$} from "dolos/background/observables";
import {AnimeInfo, GrobberClient} from "dolos/grobber";
import AsyncLock from "dolos/lock";
import Store from "dolos/store";

export interface NewEpisodeEvent {
    anime: AnimeInfo;
    previousEpisodes: number | null;
}

async function checkAnimeUpdate() {
    const activeUIDs = await Store.getSubscribedAnimeUIDs();
    activeUIDs["a-tobeheroine-masteranime-en"] = null;
    activeUIDs["a-boogiepopwawarawanai_28_2019_29_-nineanime-en"] = null;

    console.log("checking", activeUIDs.ownKeys().length, "animes!"); // rem
    // @ts-ignore
    const animeInfos = await Promise.all((activeUIDs.ownKeys().map((uid: string) => GrobberClient.getAnimeInfo(uid))));

    for (const anime of animeInfos) {
        const uid = anime.uid;
        const previousAnime = activeUIDs[uid];

        if (previousAnime === undefined) {
            console.warn("Couldn't find matching anime for", anime);
            continue;
        }

        if (!previousAnime || anime.episodes != previousAnime.episodes) {
            activeUIDs[uid] = anime;

            const event = {
                anime,
                previousEpisodes: previousAnime && previousAnime.episodes,
            };

            console.log(event);
            hasNewEpisode$.next(event);
        }
    }

    console.log("done"); // rem
}

const updateLock = new AsyncLock();

export function performUpdateCheck() {
    updateLock.withLock(async () => {
        console.log("HEEEY UPDATE TIME"); // rem
        await checkAnimeUpdate();
    }).catch(console.error);
}