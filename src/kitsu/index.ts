import {Service} from "../common";
import {SkipButton} from "../common/components";
import {EpisodePage} from "../common/pages";
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

class KitsuEpisodePage extends EpisodePage {
    async getEpisodeIndex(): Promise<number | null> {
        return this.state.memory.episodeIndex;
    }

    async injectEmbed(embed: Element): Promise<any> {
        (await waitUntilExists(".media-container .unit-summary"))
            .insertAdjacentElement("afterend", embed);
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
        transitionTo("anime.show.episodes.show", epIndex);
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
        transitionTo("anime.show.episodes.show", epIndex);
    }
}


class Kitsu extends Service {
    urlObserver: UrlObserver;

    constructor() {
        super("kitsu", KitsuEpisodePage);
        this.urlObserver = new UrlObserver(250, (_, url) => this.route(new URL(url)));
    }

    async load() {
        await super.load(true);
        this.urlObserver.start();
    }

    async route(url: URL) {
        await this.state.reload();

        let match;
        console.log(url.pathname);

        match = url.pathname.match(/\/anime\/(.+)\/episodes\/(\d+)/);
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
        return (await waitUntilExists("meta[property=\"og:title\"]")).getAttribute("content");
    }


}

(new Kitsu()).load();