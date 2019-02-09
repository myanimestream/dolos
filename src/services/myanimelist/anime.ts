/**
 * @module services/myanimelist
 */

import axios from "axios";
import {AnimePage} from "dolos/common/pages";
import {cacheInMemory} from "dolos/memory";
import {waitUntilExists} from "dolos/utils";
import MyAnimeList from ".";

interface MALAnime {
    title: string;
    episodeNum: number;
    inOwnlist: boolean;
    status: string;
    score: number;
    completedEpisodeNum: number;
}

function malAnimeFromData(data: any): MALAnime {
    return {
        completedEpisodeNum: parseInt(data.completed_episode_num, 10) || 0,
        episodeNum: parseInt(data.episode_num, 10),
        inOwnlist: data.in_ownlist,
        score: parseInt(data.score, 10),
        status: data.status,
        title: data.title,
    };
}

export default class MalAnimePage extends AnimePage<MyAnimeList> {
    @cacheInMemory("malAnimeID")
    public getMALAnimeID(): number | undefined {
        const match = location.pathname.match(/\/anime\/(\d+)/);
        if (!match) return undefined;
        return parseInt(match[1], 10);
    }

    @cacheInMemory("malAnime")
    public async getMALAnime(): Promise<MALAnime | null> {
        try {
            const resp = await axios.get("https://myanimelist.net/ownlist/get_list_item", {
                params: {
                    id: await this.getMALAnimeID(),
                    list: "anime",
                },
            });

            return malAnimeFromData(resp.data);
        } catch (e) {
            console.warn("Couldn't get mal anime info", e);
            return null;
        }
    }

    @cacheInMemory("animeIdentifier")
    public async getAnimeIdentifier(): Promise<string | undefined> {
        const match = location.pathname.match(/\/anime\/(\d+)\/([^\/]+)/);
        if (!match) return undefined;
        return match[2];
    }

    @cacheInMemory("animeSearchQuery")
    public async getAnimeSearchQuery(): Promise<string | undefined> {
        const el = document.querySelector("meta[property=\"og:title\"]");
        if (!el) return undefined;

        const title = el.getAttribute("content");
        if (!title) return undefined;

        const match = title.match(/(.+?)(?: Episode \d+)?$/);
        if (!match) return undefined;

        return match[1];
    }

    public async canSetEpisodesWatched(): Promise<boolean> {
        return !!await this.service.getUsername();
    }

    public async getAnimeURL(): Promise<string | undefined> {
        const [animeID, animeSlug] = await Promise.all([this.getMALAnimeID(), this.getAnimeIdentifier()]);
        if (!(animeID && animeSlug)) return undefined;

        return `https://myanimelist.net/anime/${animeID}/${animeSlug}`;
    }

    public async getEpisodeURL(episode: number): Promise<string> {
        const [animeId, slug] = await Promise.all([this.getMALAnimeID(), this.getAnimeIdentifier()]);
        return new URL(`/anime/${animeId}/${slug}/episode/${episode + 1}`, location.origin).toString();
    }

    public async showEpisode(episodeIndex: number): Promise<boolean> {
        location.assign(await this.getEpisodeURL(episodeIndex));
        return true;
    }

    @cacheInMemory("episodesWatched")
    public async _getEpisodesWatched(): Promise<number | undefined> {
        if (this.service.isMobileLayout()) {
            const anime = await this.getMALAnime();

            return anime ? anime.completedEpisodeNum : undefined;
        }

        const el = document.querySelector("#myinfo_watchedeps");
        if (!el) return undefined;

        const value = el.getAttribute("value");
        if (!value) return undefined;

        const epsWatched = parseInt(value, 10);
        if (epsWatched || epsWatched === 0) return epsWatched;
        else if (isNaN(epsWatched)) return 0;
        else return undefined;
    }

    @cacheInMemory("totalEpisodes")
    public async getEpisodeCount(): Promise<number | undefined> {
        if (this.service.isMobileLayout()) {
            const anime = await this.getMALAnime();

            return anime ? anime.episodeNum : undefined;
        }

        const el = document.querySelector("span#curEps");
        if (!el) return undefined;

        const eps = parseInt(el.innerHTML, 10);
        return isNaN(eps) ? undefined : eps;
    }

    public async injectAnimeStatusBar(element: Element) {
        if (this.service.isMobileLayout()) {
            element.setAttribute("style", "margin-top: 8px;" +
                "display: flex;" +
                "justify-content: center;");

            const statusUnit = document.querySelector("div.status-unit");
            if (statusUnit)
                statusUnit.insertAdjacentElement("afterend", element);
        } else {
            element.setAttribute("style", "margin-top: 8px;");

            // this is such a hack, but it works and I certainly won't complain about it
            // wait for the actual a element and style it
            // (because evil MAL applies its own styles to a tags [which are ugly btw])
            waitUntilExists("a", element).then(el =>
                el.setAttribute("style", "color: #fff !important;" +
                    "text-decoration: none !important"),
            );

            const title = document.querySelector("div div h2");
            if (!title) throw new Error("Couldn't find title element");

            const sidebar = title.parentElement;
            if (!sidebar) throw new Error("Couldn't find sidebar");

            const thumbnail = sidebar.querySelector("div:first-child");
            if (!thumbnail) throw new Error("Couldn't find thumbnail element");

            thumbnail.insertAdjacentElement("afterend", element);
        }

        this.injected(element);
    }

    protected async _setEpisodesWatched(progress: number): Promise<boolean> {
        const episodeCount = await this.getEpisodeCount();
        if (episodeCount === undefined)
            return false;

        // 1: watching, 2: completed
        const status = !isNaN(episodeCount) && progress >= episodeCount ? 2 : 1;

        const data = {
            anime_id: this.getMALAnimeID(),
            csrf_token: this.service.getCSRFToken(),
            num_watched_episodes: progress,
            status,
        };

        // brute-force our way through this. First try to edit it
        // and if it doesn't work (probably because entry doesn't exist yet) add a new one

        const strategies = ["edit", "add"].map(strat => async () => {
            const resp = await axios.post(
                `https://myanimelist.net/ownlist/anime/${strat}.json`, JSON.stringify(data),
                {headers: {"Content-Type": "application/x-www-form-urlencoded"}},
            );

            if (resp.data !== null) console.warn("unknown response after setting progress", resp.data);
        });

        let lastException;
        for (const strategy of strategies) {
            try {
                await strategy();
                return true;
            } catch (e) {
                lastException = e;
            }
        }

        console.error("Couldn't set anime progress", lastException);
        return false;
    }
}
