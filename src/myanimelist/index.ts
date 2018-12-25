import axios from "axios";
import {cacheInStateMemory, Service} from "../common";
import {SkipButton} from "../common/components";
import {EpisodePage} from "../common/pages";
import {evaluateCode} from "../inject";

class MalEpisodePage extends EpisodePage {
    async getEpisodeIndex(): Promise<number | null> {
        return this.state.memory.episodeIndex;
    }

    async injectEmbed(embed: Element): Promise<any> {
        const target = document.querySelector(`td[style^="padding-left"]>div>div:last-child`);
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

    @cacheInStateMemory("animeId")
    getMALAnimeId(): number {
        return parseInt(document.querySelector(`#myinfo_anime_id`).getAttribute("value"));
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
            anime_id: this.getMALAnimeId(),
            num_watched_episodes: progress
        };

        try {
            const resp = await axios.post("/ownlist/anime/edit.json", JSON.stringify(data), {headers: {"Content-Type": "application/x-www-form-urlencoded"}});
            if (resp.data !== null) {
                console.warn("unknown response after setting progress", resp.data);
            }

            return true;
        } catch (e) {
            console.error("Couldn't set anime progress", e);
            return false;
        }
    }
}


class MyAnimeList extends Service {
    constructor() {
        super("mal", MalEpisodePage);
    }

    async route(url: URL) {
        await this.state.reload();

        let match;

        match = url.pathname.match(/\/anime\/(.+)\/episode\/(\d+)/);
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
        const title = document.querySelector("meta[property=\"og:title\"]")
            .getAttribute("content");

        return title.match(/(.+) Episode \d+/)[1];
    }


}

(new MyAnimeList()).load();