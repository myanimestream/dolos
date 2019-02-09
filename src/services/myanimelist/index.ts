/**
 * Service for [myanimelist.net](https://myanimelist.net).
 *
 * @module services/myanimelist
 * @preferred
 */

/** @ignore */

import {cacheInStateMemory, Service} from "dolos/common";
import {evaluateCode} from "dolos/inject";
import "dolos/logging";
import MalAnimePage from "./anime";
import MalEpisodePage from "./episode";

export default class MyAnimeList extends Service {
    constructor() {
        super("mal", MalAnimePage, MalEpisodePage);
    }

    public async route(url: URL) {
        let match;

        match = url.pathname.match(/^\/anime\/(\d+)\/([^\/]+)(?:\/episode\/(\d+))?/);
        if (match) {
            if (match[3]) {
                await this.showEpisodePage({episodeIndex: parseInt(match[3], 10) - 1});
            } else {
                await this.showAnimePage({
                    animeIdentifier: match[2],
                    malAnimeID: parseInt(match[1], 10),
                });
            }

            return;
        }

        await this.state.loadPage();
    }

    @cacheInStateMemory("username")
    public async getUsername(): Promise<string | null> {
        return await evaluateCode("MAL.USER_NAME") || null;
    }

    @cacheInStateMemory("csrfToken")
    public getCSRFToken(): string {
        const el = document.querySelector('meta[name="csrf_token"]');
        if (!el) throw new Error("CSRF_TOKEN holder not found");

        const token = el.getAttribute("content");
        if (!token) throw new Error("token not found");

        return token;
    }

    @cacheInStateMemory("isMobileLayout")
    public isMobileLayout(): boolean {
        return !!document.querySelector("a.footer-desktop-button");
    }
}

new MyAnimeList().load();
