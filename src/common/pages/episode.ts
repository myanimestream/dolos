import * as React from "react";
import * as rxjs from "rxjs";
import {getThemeFor} from "../../theme";
import {reactRenderWithTheme, wrapSentryLogger} from "../../utils";
import {Embed, SkipButton} from "../components";
import {Episode, GrobberErrorType} from "../models";
import Service from "../service";
import ServicePage from "../service-page";


export default abstract class EpisodePage<T extends Service> extends ServicePage<T> {
    episodeBookmarked$: rxjs.BehaviorSubject<boolean>;

    constructor(service: T) {
        super(service);
        this.episodeBookmarked$ = new rxjs.BehaviorSubject(false);
    }

    abstract async canSetAnimeProgress(): Promise<boolean>;

    abstract async setAnimeProgress(progress: number): Promise<boolean>;

    abstract async getEpisodesWatched(): Promise<number | null>;

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
        reactRenderWithTheme(
            wrapSentryLogger(React.createElement(Embed, {episodePage: this})),
            getThemeFor(this.state.serviceId),
            el
        );

        return el;
    }

    async onEpisodeEnd() {
        const config = await this.state.config;

        if (config.updateAnimeProgress)
            await this.markEpisodeWatched();

        await this.showNextEpisode();
    }

    async markEpisodeWatched() {
        const [epIndex, canSetProgress] = await Promise.all([this.getEpisodeIndex(), this.canSetAnimeProgress()]);
        if (!canSetProgress) return;

        if (!(epIndex || epIndex === 0)) {
            console.warn("Can't update anime progress, episodeIndex null!");
            return;
        }

        if (await this.setAnimeProgress(epIndex + 1))
            this.episodeBookmarked$.next(true);
        else {
            //TODO show warning to user!
        }
    }

    async markEpisodeUnwatched() {
        const [epIndex, canSetProgress] = await Promise.all([this.getEpisodeIndex(), this.canSetAnimeProgress()]);
        if (!canSetProgress) return;

        if (!(epIndex || epIndex === 0)) {
            console.warn("Can't update anime progress, episodeIndex null!");
            return;
        }

        if (await this.setAnimeProgress(epIndex))
            this.episodeBookmarked$.next(false);
    }

    async load() {
        const [epIndex, epsWatched] = await Promise.all([this.getEpisodeIndex(), this.getEpisodesWatched()]);
        if (epsWatched >= epIndex + 1)
            this.episodeBookmarked$.next(true);

        await this.injectEmbed(await this.buildEmbed());
    }
}