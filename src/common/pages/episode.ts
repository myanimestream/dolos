/**
 * @module common.pages
 */

import {AnimeInfo, Episode, GrobberClient, GrobberErrorType} from "dolos/grobber";
import {cacheInMemory} from "dolos/memory";
import {getThemeFor} from "dolos/theme";
import {reactRenderWithTheme, wrapSentryLogger} from "dolos/utils";
import * as React from "react";
import * as rxjs from "rxjs";
import {EpisodeEmbed, SkipButton} from "../components";
import Service from "../service";
import ServicePage from "../service-page";
import AnimePage from "./anime";
import _ = chrome.i18n.getMessage;


export default abstract class EpisodePage<T extends Service> extends ServicePage<T> {
    episodeBookmarked$: rxjs.BehaviorSubject<boolean>;
    private epsWatchedSub: rxjs.Subscription;

    constructor(service: T) {
        super(service);

        this.episodeBookmarked$ = new rxjs.BehaviorSubject(false);
    }

    private _animePage: AnimePage<T>;

    get animePage(): AnimePage<T> {
        if (!this._animePage) this._animePage = this.buildAnimePage();

        return this._animePage;
    }

    set animePage(page: AnimePage<T>) {
        this._animePage = page;
    }

    abstract buildAnimePage(): AnimePage<T>;

    abstract async getEpisodeIndex(): Promise<number | undefined>;

    abstract async injectEmbed(embed: Element): Promise<void>;

    abstract async nextEpisodeButton(): Promise<SkipButton | undefined>;

    abstract async showNextEpisode(): Promise<void>;

    abstract async prevEpisodeButton(): Promise<SkipButton | undefined>;

    abstract async showPrevEpisode(): Promise<void>;

    async setAnimeUID(uid: string | AnimeInfo) {
        await this.animePage.setAnimeUID(uid);
        await this.reload();
    }

    @cacheInMemory("episode")
    async getEpisode(): Promise<Episode | undefined> {
        let [uid, epIndex] = await Promise.all([this.animePage.getAnimeUID(), this.getEpisodeIndex()]);
        if (!uid || (!epIndex && epIndex !== 0)) return;

        try {
            return await GrobberClient.getEpisode(uid, epIndex);
        } catch (e) {
            if (e.name === GrobberErrorType.UidUnknown) {
                console.warn("Grobber didn't recognise uid, updating...");
                uid = await this.animePage.getAnimeUID(true);
                if (uid === undefined)
                    return;

                try {
                    return await GrobberClient.getEpisode(uid, epIndex);
                } catch (e) {
                    console.error("couldn't get episode after updating uid", e);
                }
            }

            return;
        }
    }

    async buildEmbed(): Promise<Element> {
        const el = document.createElement("div");
        reactRenderWithTheme(
            wrapSentryLogger(React.createElement(EpisodeEmbed, {episodePage: this})),
            getThemeFor(this.state.serviceId),
            el
        );

        return el;
    }

    async onEpisodeEnd() {
        const [config, epIndex] = await Promise.all([
            this.state.config, this.getEpisodeIndex()]);

        if (epIndex === undefined)
            return;


        if (config.updateAnimeProgress)
            await this.markEpisodeWatched();

        if (config.autoNext) {
            const anime = await this.animePage.getAnime();
            if (anime === undefined || epIndex + 1 < anime.episodes)
                await this.showNextEpisode();
        }
    }

    async markEpisodeWatched() {
        const [epIndex, canSetProgress] = await Promise.all([this.getEpisodeIndex(), this.animePage.canSetEpisodesWatched()]);
        if (!canSetProgress) return;

        if (epIndex === undefined) {
            console.warn("Can't update anime progress, episodeIndex undefined!");
            return;
        }

        if (!await this.animePage.setEpisodesWatched(epIndex + 1))
            this.service.showErrorSnackbar(_("episode__bookmark_failed"));
    }

    async markEpisodeUnwatched() {
        const [epIndex, canSetProgress] = await Promise.all([
            this.getEpisodeIndex(),
            this.animePage.canSetEpisodesWatched()
        ]);

        if (!canSetProgress) return;

        if (!(epIndex || epIndex === 0)) {
            console.warn("Can't update anime progress, episodeIndex null!");
            return;
        }

        if (await this.animePage.setEpisodesWatched(epIndex)) this.episodeBookmarked$.next(false);
        else this.service.showErrorSnackbar(_("episode__bookmark_failed"));
    }

    async _load() {
        const [epIndex, epsWatched$] = await Promise.all([this.getEpisodeIndex(), this.animePage.getEpisodesWatched$()]);
        this.epsWatchedSub = epsWatched$.subscribe(epsWatched => {
            if (epsWatched !== undefined && epIndex !== undefined)
                this.episodeBookmarked$.next(epsWatched >= epIndex + 1);
        });

        await this.injectEmbed(await this.buildEmbed());

        await this.animePage.load();
    }

    async _unload() {
        if (this.epsWatchedSub) this.epsWatchedSub.unsubscribe();
        await this.animePage.unload();
        await super._unload()
    }

    async transitionTo(page?: ServicePage<T>): Promise<ServicePage<T> | void> {
        if (page instanceof AnimePage) {
            this.resetPage();
            return await this.animePage.transitionTo(page);
        } else if (page instanceof EpisodePage) {
            page.animePage = this.animePage;
            this.resetPage();
            await page.load();
            return;
        }

        await super.transitionTo(page);
    }
}