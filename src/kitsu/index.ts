/**
 * Service for [kitsu.io](https://kitsu.io).
 *
 * @module kitsu
 * @preferred
 */

/** @ignore */

import {Service} from "../common";
import "../logging";
import KitsuAnimePage from "./anime";
import KitsuEpisodePage from "./episode";
import UrlObserver from "./url-observer";

export default class Kitsu extends Service {
    public urlObserver: UrlObserver;

    constructor() {
        super("kitsu", KitsuAnimePage, KitsuEpisodePage);
        this.urlObserver = new UrlObserver(250, (_, url) => this.route(new URL(url)));
    }

    public async load() {
        await super.load(true);
        this.urlObserver.start();
    }

    public async route(url: URL) {
        let match;

        match = url.pathname.match(/^\/anime\/([^\/]+)(?:\/episodes\/(\d+))?/);

        if (match) {
            if (match[2]) {
                await this.showEpisodePage({episodeIndex: parseInt(match[2], 10) - 1});
            } else {
                await this.showAnimePage({animeIdentifier: match[1]});
            }

            return;
        }

        await this.state.loadPage();
    }
}

(new Kitsu()).load();
