import {SkipButton} from "../common/components";
import {EpisodePage} from "../common/pages";
import ServicePage from "../common/service-page";
import {waitUntilExists} from "../utils";
import KitsuAnimePage from "./anime";
import Kitsu from "./index";
import {transitionTo} from "./utils";

export default class KitsuEpisodePage extends EpisodePage<Kitsu> {
    buildAnimePage(): KitsuAnimePage {
        return new KitsuAnimePage(this.service);
    }

    async transitionTo(page?: ServicePage<Kitsu>) {
        if (page instanceof KitsuAnimePage) {
            this.state.resetMemory("episode");
            this.state.removeInjected("episode");
            return;
        }

        await super.transitionTo(page);
    }

    async getEpisodeIndex(): Promise<number | null> {
        return this.state.memory.episodeIndex;
    }

    async injectEmbed(embed: Element): Promise<any> {
        (await waitUntilExists(".media-container .unit-summary"))
            .insertAdjacentElement("afterend", embed);
        this.state.injected(embed, "episode");
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