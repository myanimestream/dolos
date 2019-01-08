import {cacheInStateMemory} from "../common";
import {AnimePage} from "../common/pages";
import ServicePage from "../common/service-page";
import {waitUntilExists} from "../utils";
import KitsuEpisodePage from "./episode";
import Kitsu from "./index";
import {
    getAccessToken,
    getAnime,
    getProgress,
    KitsuAnimeInfo,
    kitsuAPIRequest,
    setProgress,
    transitionTo
} from "./utils";

export default class KitsuAnimePage extends AnimePage<Kitsu> {
    async transitionTo(page?: ServicePage<Kitsu>) {
        if (page instanceof KitsuAnimePage) return;

        if (page instanceof KitsuEpisodePage) {
            page.animePage = this;
            await page.load();
            return;
        }

        await super.transitionTo(page);
    }

    async getAnimeIdentifier(): Promise<string | null> {
        return this.state.memory.animeIdentifier;
    }

    @cacheInStateMemory("animeSearchQuery")
    async getAnimeSearchQuery(): Promise<string | null> {
        return (await waitUntilExists("meta[property=\"og:title\"]")).getAttribute("content");
    }

    @cacheInStateMemory("accessToken")
    async getAccessToken(): Promise<string | null> {
        return await getAccessToken();
    }

    @cacheInStateMemory("animeId")
    async getAnimeId(): Promise<string | null> {
        const resp = await kitsuAPIRequest("GET", "/anime", null, {
            params: {
                "fields[anime]": "id",
                "filter[slug]": await this.getAnimeIdentifier()
            }
        }, true);
        if (!resp) return null;

        const results = resp.data;
        if (!results) return null;

        return results[0].id;
    }

    @cacheInStateMemory("kitsuAnime")
    async getKitsuAnimeInfo(): Promise<KitsuAnimeInfo | null> {
        return await getAnime();
    }

    @cacheInStateMemory("userId")
    async getUserId(): Promise<string | null> {
        const token = await this.getAccessToken();
        if (!token) return null;

        const resp = await kitsuAPIRequest("GET", "/users", `Bearer ${token}`, {
            params: {
                "fields[users]": "id",
                "filter[self]": "true"
            }
        }, true);

        return resp && resp.data[0].id;
    }

    @cacheInStateMemory("libraryEntryId")
    async getLibraryEntryId(): Promise<string | null> {
        const [animeId, userId] = await Promise.all([this.getAnimeId(), this.getUserId()]);
        if (!(animeId && userId)) return null;

        const resp = await kitsuAPIRequest("GET", "/library-entries", null, {
            params: {
                "fields[anime]": "id",
                "filter[userId]": userId,
                "filter[animeId]": animeId
            }
        }, true);

        return resp && resp.data[0].id;
    }

    async canSetEpisodesWatched(): Promise<boolean> {
        // is the user logged-in?
        return !!await this.getUserId()
    }

    async _setEpisodesWatched(progress: number): Promise<boolean> {
        const [animeId, userId] = await Promise.all([this.getAnimeId(), this.getUserId()]);
        if (!(animeId && userId)) return false;

        return await setProgress(animeId, userId, progress);
    }

    async getEpisodeURL(episode: number): Promise<string> {
        const slug = await this.getAnimeIdentifier();
        return new URL(`/anime/${slug}/episodes/${episode + 1}`, location.origin).toString();
    }

    async showEpisode(episodeIndex: number) {
        transitionTo("anime.show.episodes.show", episodeIndex + 1);
    }

    @cacheInStateMemory("episodesWatched", "episode")
    async getEpisodesWatched(): Promise<number | null> {
        const [animeId, userId] = await Promise.all([this.getAnimeId(), this.getUserId()]);
        if (!(animeId && userId)) return null;

        return await getProgress(animeId, userId);
    }

    @cacheInStateMemory("episodeCount")
    async getEpisodeCount(): Promise<number | null> {
        const anime = await getAnime();
        return anime ? anime.episodeCount : null;
    }

    async injectContinueWatchingButton(element: Element) {
        element.setAttribute("style", "margin-top: 16px");

        (await waitUntilExists("span.media-poster"))
            .insertAdjacentElement("afterend", element);

        this.state.injected(element);
    }
}