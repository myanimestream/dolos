import axios from "axios";
import {AnimePage} from "../common/pages";
import {cacheInMemory} from "../memory";
import {waitUntilExists} from "../utils";
import MyAnimeList from "./index";

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
        title: data["title"],
        episodeNum: parseInt(data["episode_num"]),
        inOwnlist: data["in_ownlist"],
        status: data["status"],
        score: parseInt(data["score"]),
        completedEpisodeNum: parseInt(data["completed_episode_num"]) || 0,
    };
}

export default class MalAnimePage extends AnimePage<MyAnimeList> {
    @cacheInMemory("malAnimeID")
    getMALAnimeID(): number | undefined {
        const match = location.pathname.match(/\/anime\/(\d+)/);
        if (!match) return;
        return parseInt(match[1]);
    }

    @cacheInMemory("malAnime")
    async getMALAnime(): Promise<MALAnime | null> {
        try {
            const resp = await axios.get("https://myanimelist.net/ownlist/get_list_item", {
                params: {
                    id: await this.getMALAnimeID(),
                    list: "anime"
                }
            });

            return malAnimeFromData(resp.data);
        } catch (e) {
            console.warn("Couldn't get mal anime info", e);
            return null;
        }
    }

    @cacheInMemory("animeIdentifier")
    async getAnimeIdentifier(): Promise<string | undefined> {
        const match = location.pathname.match(/\/anime\/(\d+)\/([^\/]+)/);
        if (!match) return;
        return match[2];
    }

    @cacheInMemory("animeSearchQuery")
    async getAnimeSearchQuery(): Promise<string | undefined> {
        const el = document.querySelector("meta[property=\"og:title\"]");
        if (!el) return;

        const title = el.getAttribute("content");
        if (!title) return;

        const match = title.match(/(.+?)(?: Episode \d+)?$/);
        if (!match) return;

        return match[1];
    }

    async canSetEpisodesWatched(): Promise<boolean> {
        return !!await this.service.getUsername();
    }

    async _setEpisodesWatched(progress: number): Promise<boolean> {
        const episodeCount = await this.getEpisodeCount();
        if (episodeCount === undefined)
            return false;

        // 1: watching, 2: completed
        const status = !isNaN(episodeCount) && progress >= episodeCount ? 2 : 1;

        const data = {
            csrf_token: this.service.getCSRFToken(),
            anime_id: this.getMALAnimeID(),
            status,
            num_watched_episodes: progress
        };

        // brute-force our way through this. First try to edit it
        // and if it doesn't work (probably because entry doesn't exist yet) add a new one

        const strategies = ["edit", "add"].map(strat => async () => {
            const resp = await axios.post(
                `https://myanimelist.net/ownlist/anime/${strat}.json`, JSON.stringify(data),
                {headers: {"Content-Type": "application/x-www-form-urlencoded"}}
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

    async getEpisodeURL(episode: number): Promise<string> {
        const [animeId, slug] = await Promise.all([this.getMALAnimeID(), this.getAnimeIdentifier()]);
        return new URL(`/anime/${animeId}/${slug}/episode/${episode + 1}`, location.origin).toString();
    }

    async showEpisode(episodeIndex: number) {
        location.assign(await this.getEpisodeURL(episodeIndex));
    }

    @cacheInMemory("episodesWatched")
    async getEpisodesWatched(): Promise<number | undefined> {
        if (this.service.isMobileLayout()) {
            const anime = await this.getMALAnime();

            return anime ? anime.completedEpisodeNum : undefined;
        }

        const el = document.querySelector("#myinfo_watchedeps");
        if (!el) return;

        const value = el.getAttribute("value");
        if (!value) return;

        const epsWatched = parseInt(value);
        if (epsWatched || epsWatched === 0) return epsWatched;
        else if (isNaN(epsWatched)) return 0;
        else return;
    }

    @cacheInMemory("totalEpisodes")
    async getEpisodeCount(): Promise<number | undefined> {
        if (this.service.isMobileLayout()) {
            const anime = await this.getMALAnime();

            return anime ? anime.episodeNum : undefined;
        }

        const el = document.querySelector("span#curEps");
        if (!el) return;

        const eps = parseInt(el.innerHTML);
        return isNaN(eps) ? undefined : eps;
    }

    async injectContinueWatchingButton(element: Element) {
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
                    "text-decoration: none !important")
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
}