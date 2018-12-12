import * as React from "react";
import * as ReactDOM from "react-dom";
import {Embed, PlayerSource, SkipButton} from "../components";
import {Episode} from "../models";
import ServicePage from "./service";
import _ = chrome.i18n.getMessage;


export default abstract class EpisodePage extends ServicePage {
    abstract async getEpisodeIndex(): Promise<number | null>;

    abstract async injectEmbed(embed: Element);

    abstract async nextEpisodeButton(): Promise<SkipButton | null>;

    abstract async showNextEpisode(): Promise<any>;

    abstract async prevEpisodeButton(): Promise<SkipButton | null>;

    abstract async showPrevEpisode(): Promise<any>;

    async getEpisode(): Promise<Episode | null> {
        const [uid, epIndex] = await Promise.all([this.service.getAnimeUID(), this.getEpisodeIndex()]);
        if (!uid || (!epIndex && epIndex !== 0)) return null;

        return await this.state.getEpisode(uid, epIndex);
    }

    async buildEpisode(episode: Episode): Promise<Element> {
        const sources: PlayerSource[] = [];
        episode.stream.links.forEach(link => sources.push({url: link}));

        const el = document.createElement("div");

        const epIndex = await this.getEpisodeIndex();

        let prevEpPromise = epIndex > 0 ? this.prevEpisodeButton() : Promise.resolve(null);
        let nextEpPromise = epIndex < episode.anime.episodes - 1 ? this.nextEpisodeButton() : Promise.resolve(null);

        const [prevEpBtn, nextEpBtn] = await Promise.all([prevEpPromise, nextEpPromise]);

        const config = await this.state.config;

        ReactDOM.render(React.createElement(Embed, {
            sources,
            poster: episode.poster,
            skipPrev: prevEpBtn,
            skipNext: nextEpBtn,
            options: {
                title: _("player__video_title_format", [episode.anime.title, epIndex + 1]),
                autoplay: config.autoplay
            }
        }), el);

        return el;
    }

    async onEpisodeEnd() {
        await this.showNextEpisode();
    }

    async load() {
        await this.injectEmbed(await this.buildEpisode(await this.getEpisode()));
    }
}