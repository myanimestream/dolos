/**
 * @module services/kitsu
 */

import {EpisodePage} from "dolos/common/pages";
import {SkipButton} from "dolos/components/anime";
import {cacheInMemory} from "dolos/memory";
import {waitUntilExists} from "dolos/utils";
import Kitsu from ".";
import KitsuAnimePage from "./anime";
import {transitionTo} from "./utils";

export default class KitsuEpisodePage extends EpisodePage<Kitsu> {
    public buildAnimePage(): KitsuAnimePage {
        return new KitsuAnimePage(this.service);
    }

    @cacheInMemory("episodeIndex")
    public async getEpisodeIndex(): Promise<number | undefined> {
        const match = location.pathname.match(/\/anime\/([^\/]+)\/episodes\/(\d+)?(?:\/)?/);
        if (!match) return undefined;
        return parseInt(match[2], 10) - 1;
    }

    public async injectEmbed(embed: Element): Promise<any> {
        (await waitUntilExists(".media-container .unit-summary"))
            .insertAdjacentElement("afterend", embed);
        this.injected(embed, "episode");
    }

    public async nextEpisodeButton(): Promise<SkipButton | undefined> {
        const epIndex = await this.getEpisodeIndex();
        if (!epIndex && epIndex !== 0)
            return undefined;

        return {
            href: (epIndex + 2).toString(),
            onClick: () => this.showNextEpisode(epIndex + 2),
        };
    }

    public async showNextEpisode(epIndex?: number): Promise<void> {
        if (epIndex === undefined) {
            const currEpIdx = await this.getEpisodeIndex();
            if (currEpIdx === undefined)
                throw new Error("Couldn't get next episode index");

            epIndex = currEpIdx + 2;
        }

        transitionTo("anime.show.episodes.show", epIndex);
    }

    public async prevEpisodeButton(): Promise<SkipButton | undefined> {
        const epIndex = await this.getEpisodeIndex();
        if (!epIndex && epIndex !== 0)
            return undefined;

        return {
            href: epIndex.toString(),
            onClick: () => this.showPrevEpisode(epIndex),
        };
    }

    public async showPrevEpisode(epIndex?: number): Promise<void> {
        epIndex = (epIndex || epIndex === 0) ? epIndex : await this.getEpisodeIndex();
        transitionTo("anime.show.episodes.show", epIndex);
    }
}
