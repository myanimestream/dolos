import axios from "axios";
import {cacheInMemory} from "../common/memory";
import {AnimePage} from "../common/pages";
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
    async getMALAnimeId(): Promise<number> {
        const match = location.pathname.match(/\/anime\/(\d+)/);
        return parseInt(match[1]);
    }

    @cacheInMemory("malAnime")
    async getMALAnime(): Promise<MALAnime | null> {
        try {
            const resp = await axios.get("/ownlist/get_list_item", {
                params: {
                    id: await this.getMALAnimeId(),
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
    async getAnimeIdentifier(): Promise<string | null> {
        const match = location.pathname.match(/\/anime\/(\d+)\/([^\/]+)/);
        if (!match) return null;
        return match[2];
    }

    @cacheInMemory("animeSearchQuery")
    async getAnimeSearchQuery(): Promise<string | null> {
        const title = document.querySelector("meta[property=\"og:title\"]")
            .getAttribute("content");

        return title.match(/(.+?)(?: Episode \d+)?$/)[1];
    }

    async canSetEpisodesWatched(): Promise<boolean> {
        return !!await this.service.getUsername();
    }

    async _setEpisodesWatched(progress: number) {
        const episodeCount = await this.getEpisodeCount();
        // 1: watching, 2: completed
        const status = !isNaN(episodeCount) && progress >= episodeCount ? 2 : 1;

        const data = {
            csrf_token: this.service.getCSRFToken(),
            anime_id: this.getMALAnimeId(),
            status,
            num_watched_episodes: progress
        };

        // brute-force our way through this. First try to edit it
        // and if it doesn't work (probably because entry doesn't exist yet) add a new one

        const strategies = ["edit", "add"].map(strat => async () => {
            const resp = await axios.post(
                `/ownlist/anime/${strat}.json`, JSON.stringify(data),
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
        const [animeId, slug] = await Promise.all([this.getMALAnimeId(), this.getAnimeIdentifier()]);
        return new URL(`/anime/${animeId}/${slug}/episode/${episode + 1}`, location.origin).toString();
    }

    async showEpisode(episodeIndex: number) {
        location.assign(await this.getEpisodeURL(episodeIndex));
    }

    @cacheInMemory("episodesWatched")
    async getEpisodesWatched(): Promise<number | null> {
        if (this.service.isMobileLayout()) {
            const anime = await this.getMALAnime();

            return anime ? anime.completedEpisodeNum : null;
        }

        const el = document.querySelector("#myinfo_watchedeps");
        if (!el) return null;

        const epsWatched = parseInt(el.getAttribute("value"));
        if (epsWatched || epsWatched === 0) return epsWatched;
        else if (isNaN(epsWatched)) return 0;
        else return null;
    }

    @cacheInMemory("totalEpisodes")
    async getEpisodeCount(): Promise<number | null> {
        if (this.service.isMobileLayout()) {
            const anime = await this.getMALAnime();

            return anime ? anime.episodeNum : null;
        }

        const eps = parseInt(document.querySelector("span#curEps").innerHTML);
        return isNaN(eps) ? null : eps;
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

            const sidebar = document.querySelector("div div h2").parentElement;
            const thumbnail = sidebar.querySelector("div:first-child");
            thumbnail.insertAdjacentElement("afterend", element);
        }

        this.injected(element);
    }
}