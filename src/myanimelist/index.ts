import {Service} from "../common";
import {SkipButton} from "../common/components";
import {EpisodePage} from "../common/pages";

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