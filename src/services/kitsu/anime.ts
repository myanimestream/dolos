/**
 * @module kitsu
 */

import {cacheInStateMemory} from "dolos/common";
import {AnimePage} from "dolos/common/pages";
import {lockMethod} from "dolos/lock";
import {cacheInMemory} from "dolos/memory";
import {retryUntil, waitUntilExists} from "dolos/utils";
import Kitsu from ".";
import {
    getAccessToken,
    getAnime,
    getProgress,
    KitsuAnimeInfo,
    kitsuAPIRequest,
    setProgress,
    transitionTo,
} from "./utils";

export default class KitsuAnimePage extends AnimePage<Kitsu> {
    @cacheInMemory("animeIdentifier")
    public async getAnimeIdentifier(): Promise<string | undefined> {
        const match = location.pathname.match(/\/anime\/([^\/]+)(?:\/)?/);
        if (!match) return undefined;
        return match[1];
    }

    @lockMethod()
    @cacheInMemory("animeSearchQuery")
    public async getAnimeSearchQuery(): Promise<string | undefined> {
        return (await waitUntilExists("meta[property=\"og:title\"]")).getAttribute("content") || undefined;
    }

    @lockMethod()
    @cacheInStateMemory("accessToken")
    public async getAccessToken(): Promise<string | undefined> {
        return await retryUntil(getAccessToken, {interval: 500, timeout: 2500, catchErrors: true});
    }

    @lockMethod()
    @cacheInMemory("animeId")
    public async getAnimeId(): Promise<string | undefined> {
        const resp = await kitsuAPIRequest("GET", "/anime", undefined, {
            params: {
                "fields[anime]": "id",
                "filter[slug]": await this.getAnimeIdentifier(),
            },
        }, true);
        if (!resp) return undefined;

        const results = resp.data;
        if (!results) return undefined;

        return results[0].id;
    }

    public async getAnimeURL(): Promise<string | undefined> {
        const animeID = await this.getAnimeIdentifier();
        if (!animeID) return undefined;

        return `https://kitsu.io/anime/${animeID}`;
    }

    @lockMethod()
    @cacheInMemory("kitsuAnime")
    public async getKitsuAnimeInfo(): Promise<KitsuAnimeInfo | undefined> {
        return await retryUntil(getAnime, {interval: 500, timeout: 2500, catchErrors: true});
    }

    @lockMethod()
    @cacheInStateMemory("userId")
    public async getUserId(): Promise<string | null> {
        const token = await this.getAccessToken();
        if (!token) return null;

        const resp = await kitsuAPIRequest("GET", "/users", `Bearer ${token}`, {
            params: {
                "fields[users]": "id",
                "filter[self]": "true",
            },
        }, true);

        return resp && resp.data[0].id;
    }

    @lockMethod()
    @cacheInMemory("libraryEntryId")
    public async getLibraryEntryId(): Promise<string | null> {
        const [animeId, userId] = await Promise.all([this.getAnimeId(), this.getUserId()]);
        if (!(animeId && userId)) return null;

        const resp = await kitsuAPIRequest("GET", "/library-entries", undefined, {
            params: {
                "fields[anime]": "id",
                "filter[animeId]": animeId,
                "filter[userId]": userId,
            },
        }, true);

        return resp && resp.data[0].id;
    }

    public async canSetEpisodesWatched(): Promise<boolean> {
        // is the user logged-in?
        return !!await this.getUserId();
    }

    public async getEpisodeURL(episode: number): Promise<string> {
        const slug = await this.getAnimeIdentifier();
        return new URL(`/anime/${slug}/episodes/${episode + 1}`, location.origin).toString();
    }

    public async showEpisode(episodeIndex: number): Promise<boolean> {
        transitionTo("anime.show.episodes.show", episodeIndex + 1);
        return true;
    }

    @lockMethod()
    @cacheInMemory("episodesWatched")
    public async _getEpisodesWatched(): Promise<number | undefined> {
        const [animeId, userId] = await Promise.all([this.getAnimeId(), this.getUserId()]);
        if (!(animeId && userId)) return undefined;

        return await getProgress(animeId, userId);
    }

    @cacheInMemory("episodeCount")
    public async getEpisodeCount(): Promise<number | undefined> {
        const anime = await this.getKitsuAnimeInfo();
        if (anime) {
            const epCount = anime.episodeCount;
            if (epCount !== null) return epCount;
        }

        return undefined;
    }

    public async injectAnimeStatusBar(element: Element) {
        element.setAttribute("style", "margin-top: 16px");

        (await waitUntilExists("span.media-poster"))
            .insertAdjacentElement("afterend", element);

        this.injected(element);
    }

    protected async _setEpisodesWatched(progress: number): Promise<boolean> {
        const [animeId, userId] = await Promise.all([this.getAnimeId(), this.getUserId()]);
        if (!(animeId && userId)) return false;

        return await setProgress(animeId, userId, progress);
    }
}
