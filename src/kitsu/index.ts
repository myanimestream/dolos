import {SkipButton} from "../common/Player";
import {AnimePage} from "../page";
import {transitionTo} from "./inject";
import UrlObserver from "./url-observer";

function waitUntilExists(selector: string): Promise<Element> {
    return new Promise(res => {
        const check = (observer: MutationObserver) => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                res(el);
            }
        };

        const o = new MutationObserver((_, observer) => check(observer));
        o.observe(document.body, {childList: true, subtree: true});

        check(o);
    });
}


class Kitsu extends AnimePage {
    urlObserver: UrlObserver;

    _animeIdentifier?: string;
    _episodeIndex?: number;

    constructor(...args) {
        super("kitsu", ...args);

        this.urlObserver = new UrlObserver(250, (_, url) => this.route(new URL(url)));
    }

    async load() {
        this.insertNoReferrerPolicy();
        this.urlObserver.start();
    }

    async route(url: URL) {
        this.state.removeInjected();

        let match;
        console.log(url.pathname);

        match = url.pathname.match(/\/anime\/(.+)\/episodes\/(\d+)/);
        if (match) {
            this._animeIdentifier = match[1];
            this._episodeIndex = parseInt(match[2]) - 1;
            await this.showEpisode();
        }
    }

    async injectPlayer(player: Element) {
        (await waitUntilExists(".media-container .unit-summary"))
            .insertAdjacentElement("afterend", player);
        this.state.injected(player);
    }

    async getAnimeIdentifier(): Promise<string | null> {
        return this._animeIdentifier;
    }

    async getAnimeSearchQuery(): Promise<string | null> {
        return (await waitUntilExists("meta[property=\"og:title\"]")).getAttribute("content");
    }

    async getEpisodeIndex(): Promise<number | null> {
        return this._episodeIndex;
    }

    async nextEpisodeButton(): Promise<SkipButton | null> {
        const epIndex = await this.getEpisodeIndex();
        if (!epIndex || epIndex === 0)
            return null;

        return {
            href: (epIndex + 2).toString(),
            onClick: () => this.showNextEpisode(epIndex + 2)
        };
    }

    async showNextEpisode(epIndex?: number): Promise<any> {
        epIndex = epIndex || await this.getEpisodeIndex() + 2;
        transitionTo("anime.show.episodes.show", epIndex);
    }

    async prevEpisodeButton(): Promise<SkipButton | null> {
        const epIndex = await this.getEpisodeIndex();
        if (!epIndex || epIndex === 0)
            return null;

        return {
            href: epIndex.toString(),
            onClick: () => this.showPrevEpisode(epIndex)
        };
    }

    async showPrevEpisode(epIndex?: number): Promise<any> {
        epIndex = epIndex || await this.getEpisodeIndex();
        transitionTo("anime.show.episodes.show", epIndex);
    }
}

(new Kitsu()).load();