import {cacheInStateMemory, Service} from "../common";
import {evaluateCode} from "../inject";
import "../logging";
import MalAnimePage from "./anime";
import MalEpisodePage from "./episode";


export default class MyAnimeList extends Service {
    constructor() {
        super("mal", MalAnimePage, MalEpisodePage);
    }

    async route(url: URL) {
        let match;

        match = url.pathname.match(/\/anime\/(\d+)\/([^\/]+)(?:\/episode\/(\d+))?/);
        if (match) {
            if (match[3]) {
                await this.showEpisodePage({episodeIndex: parseInt(match[3]) - 1});
            } else {
                await this.showAnimePage({
                    malAnimeID: parseInt(match[1]),
                    animeIdentifier: match[2],
                });
            }

            return;
        }

        await this.state.loadPage(null);
    }

    @cacheInStateMemory("username")
    async getUsername(): Promise<string | null> {
        return await evaluateCode("MAL.USER_NAME") || null;
    }

    @cacheInStateMemory("csrfToken")
    getCSRFToken(): string {
        return document.querySelector(`meta[name="csrf_token"]`).getAttribute("content");
    }

    @cacheInStateMemory("isMobileLayout")
    isMobileLayout(): boolean {
        return !!document.querySelector("a.footer-desktop-button");
    }
}

(new MyAnimeList()).load();