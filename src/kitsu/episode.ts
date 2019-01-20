import {SkipButton} from "../common/components";
import {EpisodePage} from "../common/pages";
import {cacheInMemory} from "../memory";
import {waitUntilExists} from "../utils";
import KitsuAnimePage from "./anime";
import Kitsu from "./index";
import {transitionTo} from "./utils";

export default class KitsuEpisodePage extends EpisodePage<Kitsu> {
    buildAnimePage(): KitsuAnimePage {
        return new KitsuAnimePage(this.service);
    }

    @cacheInMemory("episodeIndex")
    async getEpisodeIndex(): Promise<number | undefined> {
        const match = location.pathname.match(/\/anime\/([^\/]+)\/episodes\/(\d+)?(?:\/)?/);
        if (!match) return;
        return parseInt(match[2]) - 1;
    }

    async injectEmbed(embed: Element): Promise<any> {
        (await waitUntilExists(".media-container .unit-summary"))
            .insertAdjacentElement("afterend", embed);
        this.injected(embed, "episode");
    }

    async nextEpisodeButton(): Promise<SkipButton | undefined> {
        const epIndex = await this.getEpisodeIndex();
        if (!epIndex && epIndex !== 0)
            return;

        return {
            href: (epIndex + 2).toString(),
            onClick: () => this.showNextEpisode(epIndex + 2)
        };
    }

    async showNextEpisode(epIndex?: number): Promise<void> {
        if (epIndex === undefined) {
            const currEpIdx = await this.getEpisodeIndex();
            if (currEpIdx === undefined)
                throw new Error("Couldn't get next episode index");

            epIndex = currEpIdx + 2
        }

        transitionTo("anime.show.episodes.show", epIndex);
    }

    async prevEpisodeButton(): Promise<SkipButton | undefined> {
        const epIndex = await this.getEpisodeIndex();
        if (!epIndex && epIndex !== 0)
            return;

        return {
            href: epIndex.toString(),
            onClick: () => this.showPrevEpisode(epIndex)
        };
    }

    async showPrevEpisode(epIndex?: number): Promise<void> {
        epIndex = (epIndex || epIndex === 0) ? epIndex : await this.getEpisodeIndex();
        transitionTo("anime.show.episodes.show", epIndex);
    }
}