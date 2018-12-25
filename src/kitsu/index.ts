import axios, {AxiosRequestConfig} from "axios";
import {cacheInStateMemory, Service} from "../common";
import {SkipButton} from "../common/components";
import {EpisodePage} from "../common/pages";
import {waitUntilExists} from "../utils";
import UrlObserver from "./url-observer";
import {getAccessToken, setProgress, transitionTo} from "./utils";

class KitsuEpisodePage extends EpisodePage {
    async getEpisodeIndex(): Promise<number | null> {
        return this.state.memory.episodeIndex;
    }

    async injectEmbed(embed: Element): Promise<any> {
        (await waitUntilExists(".media-container .unit-summary"))
            .insertAdjacentElement("afterend", embed);
        this.state.injected(embed);
    }

    async nextEpisodeButton(): Promise<SkipButton | null> {
        const epIndex = await this.getEpisodeIndex();
        if (!epIndex && epIndex !== 0)
            return null;

        return {
            href: (epIndex + 2).toString(),
            onClick: () => this.showNextEpisode(epIndex + 2)
        };
    }

    async showNextEpisode(epIndex?: number): Promise<any> {
        epIndex = (epIndex || epIndex === 0) ? epIndex : await this.getEpisodeIndex() + 2;
        transitionTo("anime.show.episodes.show", epIndex);
    }

    async prevEpisodeButton(): Promise<SkipButton | null> {
        const epIndex = await this.getEpisodeIndex();
        if (!epIndex && epIndex !== 0)
            return null;

        return {
            href: epIndex.toString(),
            onClick: () => this.showPrevEpisode(epIndex)
        };
    }

    async showPrevEpisode(epIndex?: number): Promise<any> {
        epIndex = (epIndex || epIndex === 0) ? epIndex : await this.getEpisodeIndex();
        transitionTo("anime.show.episodes.show", epIndex);
    }

    static async kitsuAPIRequest(method: string, endpoint: string, auth?: string, config?: AxiosRequestConfig, silent?: boolean): Promise<any | null> {
        config = config || {};
        config.method = method;
        config.url = "/api/edge" + endpoint;
        config.headers = {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
        };

        if (auth) {
            config.headers["Authorization"] = auth;
        }

        try {
            return (await axios.request(config)).data
        } catch (e) {
            if (silent) {
                console.error("Silent error in Kitsu API request: ", e);
                return null;
            } else throw e;
        }
    }

    @cacheInStateMemory("accessToken")
    async getAccessToken(): Promise<string | null> {
        return await getAccessToken();
    }

    @cacheInStateMemory("animeId")
    async getAnimeId(): Promise<string | null> {
        const resp = await KitsuEpisodePage.kitsuAPIRequest("GET", "/anime", null, {
            params: {
                "fields[anime]": "id",
                "filter[slug]": await this.service.getAnimeIdentifier()
            }
        }, true);

        return resp && resp.data[0].id;
    }

    @cacheInStateMemory("userId")
    async getUserId(): Promise<string | null> {
        const token = await this.getAccessToken();
        if (!token) return null;

        const resp = await KitsuEpisodePage.kitsuAPIRequest("GET", "/users", `Bearer ${token}`, {
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

        const resp = await KitsuEpisodePage.kitsuAPIRequest("GET", "/library-entries", null, {
            params: {
                "fields[anime]": "id",
                "filter[userId]": userId,
                "filter[animeId]": animeId
            }
        }, true);

        return resp && resp.data[0].id;
    }

    async canSetAnimeProgress(): Promise<boolean> {
        // is the user logged-in?
        return !!await this.getUserId()
    }

    async setAnimeProgress(progress: number): Promise<boolean> {
        const [animeId, userId, token] = await Promise.all([
            this.getAnimeId(), this.getUserId(), this.getAccessToken()
        ]);

        if (!(animeId && userId && token)) return false;

        await setProgress(animeId, userId, progress);
    }
}


class Kitsu extends Service {
    urlObserver: UrlObserver;

    constructor() {
        super("kitsu", KitsuEpisodePage);
        this.urlObserver = new UrlObserver(250, (_, url) => this.route(new URL(url)));
    }

    async load() {
        await super.load(true);
        this.urlObserver.start();
    }

    async route(url: URL) {
        await this.state.reload();

        let match;

        match = url.pathname.match(/\/anime\/(.+)\/episodes\/(\d+)/);
        if (match) {
            this.state.memory.animeIdentifier = match[1];
            this.state.memory.episodeIndex = parseInt(match[2]) - 1;
            await this.showEpisodePage();
        }
    }

    async getAnimeIdentifier(): Promise<string | null> {
        return this.state.memory.animeIdentifier;
    }

    async getAnimeSearchQuery(): Promise<string | null> {
        return (await waitUntilExists("meta[property=\"og:title\"]")).getAttribute("content");
    }


}

(new Kitsu()).load();