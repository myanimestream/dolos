import {Service} from "../common";
import "../logging";
import KitsuAnimePage from "./anime";
import KitsuEpisodePage from "./episode";
import UrlObserver from "./url-observer";


export default class Kitsu extends Service {
    urlObserver: UrlObserver;

    constructor() {
        super("kitsu", KitsuAnimePage, KitsuEpisodePage);
        this.urlObserver = new UrlObserver(250, (_, url) => this.route(new URL(url)));
    }

    async load() {
        await super.load(true);
        this.urlObserver.start();
    }

    async route(url: URL) {
        await this.state.reload();

        let match;

        match = url.pathname.match(/\/anime\/([^\/]+)(?:\/[^\/]+)?(?:\/)?$/);
        if (match) {
            this.state.memory.animeIdentifier = match[1];
            await this.showAnimePage();
        }

        match = url.pathname.match(/\/anime\/([^\/]+)\/episodes\/(\d+)(?:\/)?$/);
        if (match) {
            this.state.memory.animeIdentifier = match[1];
            this.state.memory.episodeIndex = parseInt(match[2]) - 1;
            await this.showEpisodePage();
        }
    }
}

(new Kitsu()).load();