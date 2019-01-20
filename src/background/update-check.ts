import {hasNewEpisode$} from "dolos/background/observables";
import {AnimeInfo, GrobberClient} from "dolos/grobber";
import AsyncLock from "dolos/lock";
import Store from "dolos/store";

export interface NewEpisodeEvent {
    anime: AnimeInfo;
    previousEpisodes: number;
}

async function checkAnimeUpdate() {
    const activeUIDs = await Store.getSubscribedAnimeUIDs();

    console.log(Object.keys(activeUIDs), activeUIDs.ownKeys());

    console.log("checking", activeUIDs.ownKeys().length, "animes!"); // rem
    console.log(GrobberClient);
    const animeInfos = await Promise.all((activeUIDs.ownKeys().map(GrobberClient.getAnimeInfo)));

    for (const anime of animeInfos) {
        const uid = anime.uid;
        const previousAnime = activeUIDs[uid];
        if (!previousAnime) {
            console.warn("Couldn't find matching anime for", anime);
            continue;
        }

        if (anime.episodes != previousAnime.episodes) {
            const event = {
                anime,
                previousEpisodes: previousAnime.episodes,
            };
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