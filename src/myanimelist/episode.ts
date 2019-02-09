/**
 * @module myanimelist
 */

import {SkipButton} from "../common/components/anime";
import {EpisodePage} from "../common/pages";
import MalAnimePage from "./anime";
import MyAnimeList from "./index";

export default class MalEpisodePage extends EpisodePage<MyAnimeList> {
    public buildAnimePage(): MalAnimePage {
        return new MalAnimePage(this.service);
    }

    public async getEpisodeIndex(): Promise<number | undefined> {
        const match = location.pathname.match(/\/anime\/(\d+)\/([^\/]+)\/episode\/(\d+)?(?:\/)?$/);
        if (!match) return undefined;
        return parseInt(match[3], 10) - 1;
    }

    public async injectEmbed(embed: Element): Promise<void> {
        let target: Element | null;

        if (this.service.isMobileLayout()) {
            target = document.querySelector('h3[data-id="forum"');
            const parent = target && target.parentNode;
            if (target && parent) target = parent.insertBefore(document.createElement("div"), target);
            else target = document.querySelector("div.Detail");
        } else {
            target = document.querySelector("div.contents-video-embed");

            if (!target) target = document.querySelector('td[style^="padding-left"]>div>div:last-child');
        }

        if (!target) return;

        while (target.lastChild)
            target.removeChild(target.lastChild);

        target.appendChild(embed);
        this.injected(embed);
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

        location.assign(epIndex.toString());
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
        if (epIndex === undefined)
            return;

        location.assign(epIndex.toString());
    }
}
