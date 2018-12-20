import * as React from "react";
import {kitsuTheme} from "../../theme";
import {reactRenderWithTeme} from "../../utils";
import {Embed, SkipButton} from "../components";
import {Episode, GrobberErrorType} from "../models";
import ServicePage from "../service-page";


export default abstract class EpisodePage extends ServicePage {
    abstract async getEpisodeIndex(): Promise<number | null>;

    abstract async injectEmbed(embed: Element);

    abstract async nextEpisodeButton(): Promise<SkipButton | null>;

    abstract async showNextEpisode(): Promise<any>;

    abstract async prevEpisodeButton(): Promise<SkipButton | null>;

    abstract async showPrevEpisode(): Promise<any>;

    async getEpisode(): Promise<Episode | null> {
        let [uid, epIndex] = await Promise.all([this.service.getAnimeUID(), this.getEpisodeIndex()]);
        if (!uid || (!epIndex && epIndex !== 0)) return null;

        try {
            return await this.state.getEpisode(uid, epIndex);
        } catch (e) {
            if (e.name === GrobberErrorType.UidUnknown) {
                console.warn("Grobber didn't recognise uid, updating...");
                uid = await this.service.getAnimeUID(true);

                try {
                    return await this.state.getEpisode(uid, epIndex);
                } catch (e) {
                    console.error("didn't work rip", e);
                }
            }

            return null;
        }
    }

    async buildEmbed(): Promise<Element> {
        const el = document.createElement("div");
        reactRenderWithTeme(React.createElement(Embed, {episodePage: this}), kitsuTheme, el);

        return el;
    }

    async onEpisodeEnd() {
        await this.showNextEpisode();
    }

    async load() {
        await this.injectEmbed(await this.buildEmbed());
    }
}