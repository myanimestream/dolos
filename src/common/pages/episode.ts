/**
 * @module common/pages
 */

import {EpisodeEmbed, SkipButton} from "dolos/components/anime";
import {Episode, GrobberErrorType, remoteGrobberClient} from "dolos/grobber";
import {cacheInMemory} from "dolos/memory";
import {wrapSentryLogger} from "dolos/utils";
import * as React from "react";
import * as rxjs from "rxjs";
import {AnimePage} from ".";
import Service from "../service";
import ServicePage from "../service-page";
import _ = chrome.i18n.getMessage;

/**
 * The methods required for [[EpisodePage.animePage]].
 *
 * Incidentally this is a subset of [[AnimePage]] and is used as such.
 */
export type EpisodeAnimePage = Pick<AnimePage<Service>,
    | "getAnimeUID"
    | "setAnimeUID"
    | "getAnime"
    | "getEpisodesWatched$"
    | "canSetEpisodesWatched"
    | "setEpisodesWatched"
    | "openAnimeSearchDialog">;

/**
 * Possible values for [[EpisodePage.animePage]].
 */
export type EpisodeAnimePageLike<T extends Service> =
    | EpisodeAnimePage
    | AnimePage<T>
    | EpisodeAnimePage & ServicePage<T>;

/**
 * A page that will show the [[EpisodeEmbed]].
 *
 * Because often episodes are displayed in a page that is a slightly modified
 * version of the anime overview page the [[EpisodePage]] will reuse the [[AnimePage]]
 * when transitioning.
 *
 * Supported transitions:
 * - [[EpisodePage]] -> [[EpisodePage]]: [[EpisodePage.animePage]] is passed
 * - [[EpisodePage]] -> [[AnimePage]]: Uses [[EpisodePage.animePage.transitionTo]] to handle the transition.
 */
export abstract class EpisodePage<T extends Service> extends ServicePage<T> {

    get animePage(): EpisodeAnimePageLike<T> {
        if (!this._animePage) {
            let animePage: EpisodeAnimePageLike<T>;

            const registeredAnimePage = this.getBackgroundPage("anime");
            if (registeredAnimePage instanceof AnimePage) {
                animePage = registeredAnimePage;
            } else {
                animePage = this.buildAnimePage();
                this.animePage = animePage;
            }

            this._animePage = animePage;
        }

        return this._animePage;
    }

    set animePage(page: EpisodeAnimePageLike<T>) {
        if (page instanceof AnimePage)
            this.registerBackgroundPage(page, "anime");

        this._animePage = page;
    }

    public episodeBookmarked$: rxjs.BehaviorSubject<boolean>;
    private epsWatchedSub?: rxjs.Subscription;

    private _animePage?: EpisodeAnimePageLike<T>;

    constructor(service: T) {
        super(service);

        this.episodeBookmarked$ = new rxjs.BehaviorSubject(false as boolean);
    }

    public abstract buildAnimePage(): EpisodeAnimePageLike<T>;

    public abstract async getEpisodeIndex(): Promise<number | undefined>;

    public abstract async injectEmbed(embed: Element): Promise<void>;

    public abstract async nextEpisodeButton(): Promise<SkipButton | undefined>;

    public abstract async showNextEpisode(): Promise<void>;

    public abstract async prevEpisodeButton(): Promise<SkipButton | undefined>;

    public abstract async showPrevEpisode(): Promise<void>;

    @cacheInMemory("episode")
    public async getEpisode(): Promise<Episode | undefined> {
        const [uid, epIndex] = await Promise.all([this.animePage.getAnimeUID(), this.getEpisodeIndex()]);
        if (!uid || (!epIndex && epIndex !== 0)) return undefined;

        try {
            return await remoteGrobberClient.getEpisode(uid, epIndex);
        } catch (e) {
            if (e.name === GrobberErrorType.UIDUnknown) {
                console.warn("Grobber didn't recognise uid, updating...");
                const newUID = await this.animePage.getAnimeUID(true);
                if (newUID === undefined)
                    return undefined;

                try {
                    return await remoteGrobberClient.getEpisode(newUID, epIndex);
                } catch (e) {
                    console.error("couldn't get episode after updating uid", e);
                }
            }

            return undefined;
        }
    }

    public async buildEmbed(): Promise<Element> {
        return this.state.renderWithTheme(
            wrapSentryLogger(React.createElement(EpisodeEmbed, {episodePage: this})),
        );
    }

    public async onEpisodeEnd() {
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

    public async markEpisodeWatched() {
        const [epIndex, canSetProgress] = await Promise.all([
            this.getEpisodeIndex(),
            this.animePage.canSetEpisodesWatched(),
        ]);
        if (!canSetProgress) return;

        if (epIndex === undefined) {
            console.warn("Can't update anime progress, episodeIndex undefined!");
            return;
        }

        if (!await this.animePage.setEpisodesWatched(epIndex + 1))
            this.service.showErrorSnackbar(_("episode__bookmark_failed"));
    }

    public async markEpisodeUnwatched() {
        const [epIndex, canSetProgress] = await Promise.all([
            this.getEpisodeIndex(),
            this.animePage.canSetEpisodesWatched(),
        ]);

        if (!canSetProgress) return;

        if (!(epIndex || epIndex === 0)) {
            console.warn("Can't update anime progress, episodeIndex null!");
            return;
        }

        if (await this.animePage.setEpisodesWatched(epIndex)) this.episodeBookmarked$.next(false);
        else this.service.showErrorSnackbar(_("episode__bookmark_failed"));
    }

    public async _load() {
        const loadAnimePage = async () => {
            if (this.animePage instanceof ServicePage)
                await this.animePage.load();
        };

        const setupEpisodePage = async () => {
            const [epIndex, epsWatched$] = await Promise.all([
                this.getEpisodeIndex(),
                this.animePage.getEpisodesWatched$(),
            ]);

            this.epsWatchedSub = epsWatched$.subscribe(epsWatched => {
                if (epsWatched !== undefined && epIndex !== undefined)
                    this.episodeBookmarked$.next(epsWatched >= epIndex + 1);
            });
        };

        const loadEpisodePage = async () => {
            const embed = await this.buildEmbed();
            await this.injectEmbed(embed);
        };

        await Promise.all([
            loadAnimePage(),
            setupEpisodePage(),
            loadEpisodePage(),
        ]);
    }

    public async _unload() {
        if (this.epsWatchedSub) this.epsWatchedSub.unsubscribe();

        await super._unload();
    }

    public async transitionTo(page?: ServicePage<T>): Promise<ServicePage<T> | undefined> {
        if (page instanceof AnimePage) {
            const animePage = this.getBackgroundPage("anime");
            if (animePage) {
                this.resetPage();
                return await animePage.transitionTo(page);
            }
        } else if (page instanceof EpisodePage) {
            page.animePage = this.animePage;
            this.resetPage();
            await page.load();
            return undefined;
        }

        return await super.transitionTo(page);
    }
}
