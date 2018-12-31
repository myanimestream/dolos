import axios from "axios";
import {cacheInStateMemory, Service} from "../common";
import {SkipButton} from "../common/components";
import {EpisodePage} from "../common/pages";
import {evaluateCode} from "../inject";
import "../logging";

class MalEpisodePage extends EpisodePage<MyAnimeList> {
    async getEpisodeIndex(): Promise<number | null> {
        return this.state.memory.episodeIndex;
    }

    async injectEmbed(embed: Element): Promise<any> {
        let target: Element;

        if (this.service.isMobileLayout()) {
            target = document.querySelector(`h3[data-id="forum"`);
            if (target) target = target.parentNode.insertBefore(document.createElement("div"), target);
            else target = document.querySelector("div.Detail");
        } else {
            target = document.querySelector("div.contents-video-embed");

            if (!target) target = document.querySelector(`td[style^="padding-left"]>div>div:last-child`);
        }

        while (target.lastChild)
            target.removeChild(target.lastChild);

        target.appendChild(embed);
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
        location.assign(epIndex.toString());
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
        location.assign(epIndex.toString());
    }

    @cacheInStateMemory("csrfToken")
    getCSRFToken(): string {
        return document.querySelector(`meta[name="csrf_token"]`).getAttribute("content");
    }

    @cacheInStateMemory("username")
    async getUsername(): Promise<string | null> {
        return await evaluateCode("MAL.USER_NAME") || null;
    }

    async canSetAnimeProgress(): Promise<boolean> {
        return !!await this.getUsername();
    }

    async setAnimeProgress(progress: number) {
        const data = {
            csrf_token: this.getCSRFToken(),
            anime_id: this.service.getMALAnimeId(),
            // 1: watching, 2: completed
            status: 1,
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

    async getEpisodesWatched(): Promise<number | null> {
        const el = document.querySelector("#myinfo_watchedeps");
        if (!el) return null;

        const epsWatched = parseInt(el.getAttribute("value"));
        if (epsWatched || epsWatched === 0) return epsWatched;
        else return null;
    }
}


class MyAnimeList extends Service {
    constructor() {
        super("mal", MalEpisodePage);
    }

    async route(url: URL) {
        await this.state.reload();

        let match;

        match = url.pathname.match(/\/anime\/(\d+)\/(.+)\/episode\/(\d+)/);
        if (match) {
            this.state.memory.malAnimeId = parseInt(match[1]);
            this.state.memory.animeIdentifier = match[2];
            this.state.memory.episodeIndex = parseInt(match[3]) - 1;
            await this.showEpisodePage();
        }
    }

    getMALAnimeId(): Promise<number> {
        return this.state.memory.malAnimeId;
    }

    async getAnimeIdentifier(): Promise<string | null> {
        return this.state.memory.animeIdentifier;
    }

    async getAnimeSearchQuery(): Promise<string | null> {
        const title = document.querySelector("meta[property=\"og:title\"]")
            .getAttribute("content");

        return title.match(/(.+) Episode \d+/)[1];
    }

    @cacheInStateMemory("isMobileLayout")
    isMobileLayout(): boolean {
        return !!document.querySelector("a.footer-desktop-button");
    }
}

(new MyAnimeList()).load();