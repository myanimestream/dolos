/**
 * @module common.pages
 */

import {AnimeInfo, GrobberClient, GrobberErrorType} from "dolos/grobber";
import {cacheInMemory} from "dolos/memory";
import {AnimeSubscriptionInfo, StoredAnimeInfo} from "dolos/models";
import {wrapSentryLogger} from "dolos/utils";
import * as React from "react";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {distinctUntilChanged, first, map} from "rxjs/operators";
import {AnimeStatusBar, RemoteAnimeSearchDialog, SearchDialogOpenCommand} from "../components";
import Service from "../service";
import ServicePage from "../service-page";
import EpisodePage from "./episode";
import _ = chrome.i18n.getMessage;

/**
 * AnimePage reflects a page that is dedicated to a specific Anime.
 */
export default abstract class AnimePage<T extends Service> extends ServicePage<T> {
    private _episodesWatched$?: BehaviorSubject<number | undefined>;
    private readonly _animeSearchDialogOpen$: Subject<SearchDialogOpenCommand>;

    // used to make sure the warning is only shown once
    // this feels very dirty but it works...
    private readonly _lowConfidenceWarningShown: Set<string>;

    constructor(service: T) {
        super(service);

        this._animeSearchDialogOpen$ = new Subject();

        this._lowConfidenceWarningShown = new Set();
    }

    /**
     * Get a unique identifier for this anime.
     */
    abstract async getAnimeIdentifier(): Promise<string | undefined>;

    /**
     * Get the search query to be used for Grobber's search endpoint.
     * @return `undefined` if there is no search query.
     */
    abstract async getAnimeSearchQuery(): Promise<string | undefined>;

    /**
     * Get the information stored in the browser storage.
     *
     * @throws if [[AnimePage.getAnimeIdentifier]] didn't return an identifier
     */
    async getStoredAnimeInfo(): Promise<StoredAnimeInfo> {
        const identifier = await this.getAnimeIdentifier();
        if (!identifier)
            throw new Error("No anime identifier returned!");

        return await this.state.getStoredAnimeInfo(identifier);
    }

    /**
     * Get the UID of the Anime.
     * This method will return the stored UID (if available) unless `forceSearch` is true.
     *
     * @param forceSearch - Ignore the stored UID.
     *
     * @return `undefined` if there were no results or the [[AnimePage.getAnimeSearchQuery]] was empty
     */
    async getAnimeUID(forceSearch?: boolean): Promise<string | undefined> {
        const animeInfo = await this.getStoredAnimeInfo();

        if (animeInfo.uid && !forceSearch)
            return animeInfo.uid;

        const query = await this.getAnimeSearchQuery();
        if (!query)
            return;

        const results = await GrobberClient.searchAnime(query);
        if (!results || !results.length) return;

        const searchResult = results[0];

        // only even consider showing the warning if it hasn't already been shown
        if (!this._lowConfidenceWarningShown.has(query)) {
            this._lowConfidenceWarningShown.add(query);

            const config = await this.state.config;
            if (searchResult.certainty < config.maxCertaintyForWarning) {
                const percentage = Math.floor(100 * searchResult.certainty);

                this.service.showWarningSnackbar({
                    message: _("anime__search__low_confidence_warning", [percentage]),
                    action: {
                        text: _("anime__search__low_confidence_warning__search_button"),
                        onClick: () => this.openAnimeSearchDialog(),
                    },
                    autoHideDuration: 7000,
                });
            }
        }

        const uid = searchResult.anime.uid;
        animeInfo.uid = uid;

        return uid;
    }

    /**
     * Set the UID associated with the [[AnimePage.getAnimeIdentifier]] identifier
     * and update the subscription if subscribed.
     * **This will cause the [[AnimePage]] to be reloaded!**
     */
    async setAnimeUID(uid: string | AnimeInfo) {
        let anime: AnimeInfo;

        if (typeof uid === "string") {
            anime = await GrobberClient.getAnimeInfo(uid);
        } else {
            anime = uid;
            uid = anime.uid;
        }

        const [animeInfo, subscription] = await Promise.all([
            this.getStoredAnimeInfo(),
            this.getSubscription()
        ]);
        animeInfo.uid = uid;

        if (subscription)
            subscription.anime = anime;

        if (this.state.page)
        // this handles the case of a page "abusing" the AnimePage
        // such as the EpisodePage
            await this.state.page.reload();
        else
            await this.reload();
    }

    /**
     * Get the [[AnimeInfo]] for this page.
     */
    @cacheInMemory("anime")
    async getAnime(): Promise<AnimeInfo | undefined> {
        let uid = await this.getAnimeUID();
        if (!uid) return;

        try {
            return await GrobberClient.getAnimeInfo(uid);
        } catch (e) {
            if (e.name === GrobberErrorType.UIDUnknown) {
                console.warn("Grobber didn't recognise uid, updating...");
                uid = await this.getAnimeUID(true);
                if (!uid)
                    return;

                try {
                    return await GrobberClient.getAnimeInfo(uid);
                } catch (e) {
                    console.error("didn't work rip", e);
                }
            }

            return;
        }
    }

    /**
     * Check whether the user is subscribed to the Anime
     *
     * @see [[AnimePage.getSubscribed$]]
     */
    async isSubscribed(): Promise<boolean | undefined> {
        const subscribed$ = await this.getSubscribed$();
        if (!subscribed$) return;
        // should behave like a behaviour subject so the value should return right away.
        return await subscribed$.pipe(first()).toPromise();
    }

    /** Observable denoting whether the user is subscribed to the Anime */
    async getSubscribed$(): Promise<Observable<boolean> | undefined> {
        const identifier = await this.getAnimeIdentifier();
        if (!identifier) return;

        return await this.state.getSubscribed$(identifier);
    }

    /**
     * Get the [[AnimeSubscriptionInfo]] for the Anime
     * @returns undefined if the user isn't subscribed to the Anime.
     */
    async getSubscription(): Promise<AnimeSubscriptionInfo | undefined> {
        const animeID = await this.getAnimeIdentifier();
        if (!animeID) return;

        return await this.state.getSubscription(animeID);
    }

    /**
     * Observable denoting whether it is possible (read: allowed) to subscribe to the Anime.
     */
    async canSubscribeAnime$(): Promise<Observable<boolean>> {
        const [epsWatched$, totalEpisodes] = await Promise.all([
            this.getEpisodesWatched$(),
            this.getEpisodeCount()
        ]);

        // only allow subscriptions when the user hasn't finished the anime or we're unsure whether they have
        return epsWatched$.pipe(
            map(epsWatched => totalEpisodes === undefined || epsWatched === undefined || epsWatched < totalEpisodes),
            distinctUntilChanged(),
        );
    }

    /**
     * Check whether the user may subscribe to the Anime.
     *
     * @see [[AnimePage.canSubscribeAnime$]]
     */
    async canSubscribeAnime(): Promise<boolean> {
        const canSubscribeAnime$ = await this.canSubscribeAnime$();
        return await canSubscribeAnime$.pipe(first()).toPromise();
    }

    /**
     * Subscribe to the Anime.
     * @returns Whether the subscription was successful
     */
    async subscribeAnime(): Promise<boolean> {
        let [identifier, animeURL, episodesWatched, anime] = await Promise.all([
            this.getAnimeIdentifier(), this.getAnimeURL(), this.getEpisodesWatched(), this.getAnime()
        ]);


        if (!(identifier && animeURL && anime)) {
            return false;
        }

        episodesWatched = episodesWatched || 0;
        const nextEpisodeURL = await this.getEpisodeURL(episodesWatched);

        await this.state.subscribeAnime(identifier, animeURL, nextEpisodeURL, episodesWatched, anime);
        return true;
    }

    /**
     * Subscribe to the Anime.
     * @returns Whether the action was successful.
     */
    async updateSubscription(episodesWatched?: number | PromiseLike<number>): Promise<void> {
        const [animeID, epsWatched, totalEpisodes] = await Promise.all([
            this.getAnimeIdentifier(),
            (episodesWatched === undefined) ? this.getEpisodesWatched() : Promise.resolve(episodesWatched),
            this.getEpisodeCount(),
        ]);

        if (!(animeID && epsWatched !== undefined))
            return;

        if (epsWatched === totalEpisodes) {
            await this.unsubscribeAnime();
            return;
        }

        const nextEpURL = await this.getEpisodeURL(epsWatched);

        await this.state.updateAnimeSubscription(animeID, nextEpURL, epsWatched);
    }

    /**
     * Unsubscribe from the Anime.
     * @returns Whether the action was successful.
     */
    async unsubscribeAnime(): Promise<boolean> {
        const identifier = await this.getAnimeIdentifier();
        if (!identifier) return false;

        await this.state.unsubscribeAnime(identifier);
        return true;
    }

    /**
     * Get the amount of episodes the user has seen.
     *
     * @return
     * `undefined` if the user is not watching this particular Anime.
     */
    async getEpisodesWatched(): Promise<number | undefined> {
        if (this._episodesWatched$) return this._episodesWatched$.getValue();
        else return await this._getEpisodesWatched();
    }

    /**
     * Get an observable for the amount of episodes the user has watched.
     *
     * @see [[AnimePage.getEpisodesWatched]]
     */
    async getEpisodesWatched$(): Promise<BehaviorSubject<number | undefined>> {
        if (!this._episodesWatched$) {
            const episodesWatched = await this.getEpisodesWatched();
            this._episodesWatched$ = new BehaviorSubject(episodesWatched);
        }

        return this._episodesWatched$;
    }

    /**
     * Get the amount of episodes this Anime has.
     * Note that this is **not** the amount of episodes
     * available on Grobber but the amount reported by the
     * site which should ideally be the total amount.
     *
     * @see [[AnimePage.getAnime]]'s [[AnimeInfo.episodes]]
     * for the amount of available episodes.
     */
    abstract async getEpisodeCount(): Promise<number | undefined>;

    /**
     * Sanity check whether it should be possible to set the "progress" of an Anime.
     */
    abstract async canSetEpisodesWatched(): Promise<boolean>;

    /**
     * Set the amount of episodes watched.
     *
     * @returns whether the action was successful.
     */
    async setEpisodesWatched(progress: number): Promise<boolean> {
        const success = await this._setEpisodesWatched(progress);
        if (success) {
            if (this._episodesWatched$)
                this._episodesWatched$.next(progress);

            await this.updateSubscription(progress);
        }

        return success;
    }

    async buildAnimeStatusBar(): Promise<Element> {
        return this.state.renderWithTheme(
            wrapSentryLogger(React.createElement(AnimeStatusBar, {animePage: this}))
        );
    }

    /**
     * Open the anime search dialog.
     */
    async openAnimeSearchDialog(onClose?: (anime?: AnimeInfo) => void): Promise<void> {
        if (!onClose)
            onClose = async (anime?: AnimeInfo) => {
                if (anime) await this.setAnimeUID(anime.uid);
            };

        this._animeSearchDialogOpen$.next({
            open: true,
            onClose,
        });
    }

    /** Return the URL of this Anime. */
    abstract async getAnimeURL(): Promise<string | undefined>;

    async _load() {
        const [statusBar, searchDialog] = await Promise.all([
            this.buildAnimeStatusBar(),
            this.buildAnimeSearchDialog(),
        ]);

        await Promise.all([
            this.injectAnimeStatusBar(statusBar),
            this.injectAnimeSearchDialog(searchDialog),
        ]);

        // update the subscription to make sure it reflects the current state
        if (await this.isSubscribed()) await this.updateSubscription();
    }

    /**
     * Get the URL of the provided episode for this Anime.
     */
    abstract async getEpisodeURL(episodeIndex: number): Promise<string | undefined>;

    /**
     * Navigate the user to the episode with the given index.
     */
    abstract async showEpisode(episodeIndex: number): Promise<boolean>;

    abstract async injectAnimeStatusBar(statusBar: Element): Promise<void>;

    async buildAnimeSearchDialog(): Promise<Element> {
        return this.state.renderWithTheme(
            React.createElement(RemoteAnimeSearchDialog, {
                animePage: this,
                open$: this._animeSearchDialogOpen$
            })
        );
    }

    async injectAnimeSearchDialog(searchDialog: Element): Promise<void> {
        document.body.appendChild(searchDialog);
        this.injected(searchDialog);
    }

    async transitionTo(page?: ServicePage<T>): Promise<ServicePage<T> | void> {
        if (page instanceof AnimePage) {
            const [thisID, otherID] = await Promise.all([
                this.getAnimeIdentifier(),
                page.getAnimeIdentifier()
            ]);
            // no need to do anything if we're still on the same page.
            if (thisID === otherID) return this;
        } else if (page instanceof EpisodePage) {
            page.animePage = this;
            await page.load();
            return;
        }

        await super.transitionTo(page);
    }

    /**
     * @private
     *
     * Internal progress getter. **Do not use this method**!
     * @see [[AnimePage.getEpisodesWatched]] instead!
     */
    protected abstract async _getEpisodesWatched(): Promise<number | undefined>;

    /**
     * @private
     *
     * Internal progress setting. **Do not use this method**!
     * @see [[AnimePage.setEpisodesWatched]] instead!
     */
    protected abstract async _setEpisodesWatched(progress: number): Promise<boolean>;
}