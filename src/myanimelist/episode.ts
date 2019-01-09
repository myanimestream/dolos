import {SkipButton} from "../common/components";
import {EpisodePage} from "../common/pages";
import MalAnimePage from "./anime";
import MyAnimeList from "./index";

export default class MalEpisodePage extends EpisodePage<MyAnimeList> {
    buildAnimePage(): MalAnimePage {
        return new MalAnimePage(this.service);
    }

    async getEpisodeIndex(): Promise<number | null> {
        const match = location.pathname.match(/\/anime\/(\d+)\/([^\/]+)\/episode\/(\d+)?(?:\/)?$/);
        if (!match) return null;
        return parseInt(match[3]) - 1;
    }

    async injectEmbed(embed: Element): Promise<any> {
        let target: Element;

        if (this.service.isMobileLayout()) {
            target = document.querySelector(`h3[data-id="forum"`);
            if (target) target = target.parentNode.insertBefore(document.createElement("div"), target);
            else target = document.querySelector("div.Detail");
        } else {
            target = document.querySelector("div.contents-video-embed");

            if (!target) target = document.querySelector(`td[style^="padding-left"]>div>div:last-child`);
        }

        while (target.lastChild)
            target.removeChild(target.lastChild);

        target.appendChild(embed);
        this.injected(embed);
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