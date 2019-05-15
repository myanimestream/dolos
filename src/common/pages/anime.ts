/**
 * @module common/pages
 */

import {AnimeStatusBar, RemoteAnimeSearchDialog, SearchDialogOpenCommand} from "dolos/components/anime";
import {
    AnimeInfo,
    GrobberErrorType,
    GrobberResponseError,
    GrobberSearchResult,
    remoteGrobberClient,
} from "dolos/grobber";
import {cacheInMemory} from "dolos/memory";
import {AnimeSubscriptionInfo, Config, StoredAnimeInfo, SubscriptionError} from "dolos/models";
import {Identifier, ReadObservable, store} from "dolos/store";
import {wrapSentryLogger} from "dolos/utils";
import {createElement} from "react";
import {BehaviorSubject, combineLatest, concat, defer, from, NEVER, Observable, of, Subject, throwError} from "rxjs";
import {catchError, concatAll, distinctUntilChanged, first, map, pluck, switchMap, tap} from "rxjs/operators";
import {EpisodePage} from ".";
import Service from "../service";
import ServicePage from "../service-page";
import _ = chrome.i18n.getMessage;

/**
 * AnimePage reflects a page that is dedicated to a specific Anime.
 */
export abstract class AnimePage<T extends Service> extends ServicePage<T> {
    private _episodesWatched$?: BehaviorSubject<number | undefined>;
    private readonly _animeSearchDialogOpen$: Subject<SearchDialogOpenCommand>;

    // used to make sure the warning is only shown once
    // this feels very dirty but it works...
    private readonly lowConfidenceWarningShown: Set<string>;

    constructor(service: T) {
        super(service);

        this._animeSearchDialogOpen$ = new Subject();

        this.lowConfidenceWarningShown = new Set();
    }

    public getAnimeIdentifier$(): Observable<string> {
        return defer(() => this.getAnimeIdentifier()).pipe(
            map(value => {
                if (value === undefined) {
                    throw new Error("No anime identifier returned!");
                }

                return value;
            }),
        );
    }

    /**
     * Get a unique identifier for this anime.
     */
    public abstract async getAnimeIdentifier(): Promise<string | undefined>;

    public getSearchQuery$(): Observable<string> {
        return concat(defer(() => this.getAnimeSearchQuery()), NEVER).pipe(
            map(value => {
                if (value === undefined) {
                    throw new Error("No search query returned!");
                }

                return value;
            }),
        );
    }

    /**
     * @deprecated use [[getSearchQuery$]]
     *
     * Get the search query to be used for Grobber's search endpoint.
     * @return `undefined` if there is no search query.
     */
    public abstract async getAnimeSearchQuery(): Promise<string | undefined>;

    public getID$(): Observable<Identifier> {
        return this.state.getID$(this.getAnimeIdentifier$());
    }

    public getStoredAnimeInfo$(): ReadObservable<StoredAnimeInfo> {
        return store.getStoredAnimeInfo$(this.getID$());
    }

    /**
     * @deprecated use [[getStoredAnimeInfo$]]
     *
     * Get the information stored in the browser storage.
     *
     * @throws if [[AnimePage.getAnimeIdentifier]] didn't return an identifier
     */
    public async getStoredAnimeInfo(): Promise<StoredAnimeInfo> {
        return this.getStoredAnimeInfo$().pipe(first()).toPromise();
    }

    /**
     * Update the stored anime info with the given update.
     */
    public async updateStoredAnimeInfo(update: Partial<StoredAnimeInfo>): Promise<void> {
        const id = await this.getID$().pipe(first()).toPromise();
        await store.updateStoredAnimeInfo$(id, update);
    }

    public getAnimeUID$(forceSearch?: boolean): Observable<string> {
        const searchResultUID$ = combineLatest([this.getSearchQuery$(), this.state.config$]).pipe(
            switchMap(([query, config]) => this.searchAnimeForTitle(query, config)),
            map((result: GrobberSearchResult<AnimeInfo> | undefined) => {
                if (result === undefined)
                    throw new Error("Couldn't get Anime from Grobber");
                else
                    return result.item.uid;
            }),
            tap(uid => this.updateStoredAnimeInfo({uid})),
        );

        if (forceSearch)
            return searchResultUID$;
        else
            return this.getStoredAnimeInfo$().pipe(
                pluck("uid"),
                switchMap((uid: string | undefined) => uid === undefined ? searchResultUID$ : of(uid)),
            );
    }

    /**
     * @deprecated use [[getAnimeUID$]]
     *
     * Get the UID of the Anime.
     * This method will return the stored UID (if available) unless `forceSearch` is true.
     *
     * @param forceSearch - Ignore the stored UID.
     *
     * @return `undefined` if there were no results or the [[AnimePage.getAnimeSearchQuery]] was empty
     */
    public async getAnimeUID(forceSearch?: boolean): Promise<string | undefined> {
        return await this.getAnimeUID$().pipe(first()).toPromise();
    }

    /**
     * Set the UID associated with the [[AnimePage.getAnimeIdentifier]] identifier
     * and update the subscription if subscribed.
     * **This will cause the current [[ServicePage]] to be reloaded!**
     */
    public async setAnimeUID(uid: string | AnimeInfo) {
        let anime: AnimeInfo;

        if (typeof uid === "string") {
            anime = await remoteGrobberClient.getAnimeInfo(uid);
        } else {
            anime = uid;
            uid = anime.uid;
        }

        const [animeInfo, subscription] = await Promise.all([
            this.getStoredAnimeInfo(),
            this.getSubscription(),
        ]);
        animeInfo.uid = uid;

        if (subscription) {
            const subSetter = store.getMutAnimeSubscription(subscription);
            await subSetter.set(anime, "anime");
        }

        // this handles the case of a page "abusing" the AnimePage
        // such as the EpisodePage
        if (this.state.page)
            await this.state.page.reload();
        else
            await this.reload();
    }

    public getAnime$(): Observable<AnimeInfo> {
        return this.getAnimeUID$().pipe(
            switchMap(uid => remoteGrobberClient.getAnimeInfo(uid)),
            catchError(err => {
                if (err instanceof GrobberResponseError && err.name === GrobberErrorType.UIDUnknown) {
                    return this.getAnimeUID$(true).pipe(
                        switchMap(uid => remoteGrobberClient.getAnimeInfo(uid)),
                    );
                } else {
                    return throwError(err);
                }
            }),
        );
    }

    /**
     * Get the [[AnimeInfo]] for this page.
     */
    @cacheInMemory("anime")
    public async getAnime(): Promise<AnimeInfo | undefined> {
        let uid = await this.getAnimeUID();
        if (!uid) return undefined;

        try {
            return await remoteGrobberClient.getAnimeInfo(uid);
        } catch (e) {
            if (e.name === GrobberErrorType.UIDUnknown) {
                console.warn("Grobber didn't recognise uid, updating...");
                uid = await this.getAnimeUID(true);
                if (!uid)
                    return undefined;

                try {
                    return await remoteGrobberClient.getAnimeInfo(uid);
                } catch (e) {
                    console.error("didn't work rip", e);
                }
            }

            return undefined;
        }
    }

    /**
     * @deprecated use [[isSubscribed$]]
     *
     * Check whether the user is subscribed to the Anime
     *
     * @see [[AnimePage.isSubscribed$]]
     */
    public async isSubscribed(): Promise<boolean | undefined> {
        return await this.isSubscribed$().pipe(first()).toPromise();
    }

    /**
     * Observable denoting whether the user is subscribed to the Anime
     */
    public isSubscribed$(): Observable<boolean> {
        return store.isSubscribedToAnime$(this.getID$());
    }

    public getSubscriptionInfo$(): ReadObservable<AnimeSubscriptionInfo | undefined> {
        return store.getAnimeSubscriptionInfo$(this.getID$());
    }

    /**
     * @deprecated use [[getSubscriptionInfo$]] instead.
     *
     * Get the [[AnimeSubscriptionInfo]] for the Anime
     * @returns undefined if the user isn't subscribed to the Anime.
     */
    public async getSubscription(): Promise<AnimeSubscriptionInfo | undefined> {
        return await this.getSubscriptionInfo$().pipe(first()).toPromise();
    }

    /**
     * Observable denoting whether it is possible (read: allowed) to subscribe to the Anime.
     */
    public canSubscribe$(): Observable<boolean> {
        return combineLatest([
            from(this.getEpisodesWatched$()).pipe(concatAll()),
            defer(() => this.getEpisodeCount()),
        ]).pipe(
            // only allow subscriptions when the user hasn't finished the anime or we're unsure whether they have
            map(([epsWatched, totalEpisodes]) =>
                totalEpisodes === undefined || epsWatched === undefined || epsWatched < totalEpisodes),
            distinctUntilChanged(),
        );
    }

    /**
     * Subscribe to the Anime.
     * @returns Whether the subscription was successful
     */
    public async subscribeAnime(): Promise<boolean> {
        let id: Identifier;

        try {
            id = await this.getID$().pipe(first()).toPromise();
        } catch {
            return false;
        }

        const [animeURL, episodesWatched, anime] = await Promise.all([
            this.getAnimeURL(), this.getEpisodesWatched(), this.getAnime(),
        ]);

        if (!(animeURL && anime)) {
            return false;
        }

        const nextEpisodeURL = await this.getEpisodeURL(episodesWatched || 0);

        await store.subscribeAnime(id, anime, animeURL, episodesWatched || 0, nextEpisodeURL);
        return true;
    }

    /**
     * Update the subscription for this Anime.
     * @returns Whether the action was successful.
     */
    public async updateSubscription(episodesWatched?: number | PromiseLike<number>): Promise<void> {
        const [epsWatched, totalEpisodes] = await Promise.all([
            (episodesWatched === undefined) ? this.getEpisodesWatched() : Promise.resolve(episodesWatched),
            this.getEpisodeCount(),
        ]);

        if (epsWatched === undefined)
            return;

        const subscription = await this.getSubscription();
        if (!subscription) return;

        const subSetter = store.getMutAnimeSubscription(subscription);

        // unsubscribe from completed animes
        if (epsWatched === totalEpisodes) {
            await this.unsubscribeAnime();
            return;
        }

        let subscriptionUpdate: Partial<AnimeSubscriptionInfo> | undefined;

        if (subscription.error) {
            subscriptionUpdate = await this.fixSubscription(subscription);

            if (subscriptionUpdate) {
                this.service.showInfoSnackbar(_("subscriptions__fix__successful"));
            } else {
                this.service.showWarningSnackbar(_("subscriptions__fix__failed"));
            }
        }

        if (subscriptionUpdate === undefined)
            subscriptionUpdate = {};

        subscriptionUpdate.episodesWatched = epsWatched;
        subscriptionUpdate.nextEpisodeURL = await this.getEpisodeURL(epsWatched);

        await subSetter.update(subscriptionUpdate);
    }

    /**
     * Unsubscribe from the Anime.
     * @returns Whether the action was successful.
     */
    public async unsubscribeAnime(): Promise<boolean> {
        let id: Identifier;

        try {
            id = await this.getID$().pipe(first()).toPromise();
        } catch (e) {
            console.warn("Couldn't unsubscribe (couldn't get id):", e);
            // TODO create sentry warning?
            // because we shouldn't unsubscribe from an anime if we don't have the id...
            return false;
        }

        await store.unsubscribeAnime(id);
        return true;
    }

    /**
     * Get the amount of episodes the user has seen.
     *
     * @return
     * `undefined` if the user is not watching this particular Anime.
     */
    public async getEpisodesWatched(): Promise<number | undefined> {
        if (this._episodesWatched$) return this._episodesWatched$.getValue();
        else return await this._getEpisodesWatched();
    }

    /**
     * Get an observable for the amount of episodes the user has watched.
     *
     * @see [[AnimePage.getEpisodesWatched]]
     */
    public async getEpisodesWatched$(): Promise<BehaviorSubject<number | undefined>> {
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
    public abstract async getEpisodeCount(): Promise<number | undefined>;

    /**
     * Sanity check whether it should be possible to set the "progress" of an Anime.
     */
    public abstract async canSetEpisodesWatched(): Promise<boolean>;

    /**
     * Set the amount of episodes watched.
     *
     * @returns whether the action was successful.
     */
    public async setEpisodesWatched(progress: number): Promise<boolean> {
        const success = await this._setEpisodesWatched(progress);
        if (success) {
            if (this._episodesWatched$)
                this._episodesWatched$.next(progress);

            await this.updateSubscription(progress);
        }

        return success;
    }

    public async buildAnimeStatusBar(): Promise<Element> {
        return this.state.renderWithTheme(
            wrapSentryLogger(createElement(AnimeStatusBar, {animePage: this})),
        );
    }

    /**
     * Open the anime search dialog.
     */
    public async openAnimeSearchDialog(onClose?: (anime?: AnimeInfo) => void): Promise<void> {
        if (!onClose)
            onClose = async (anime?: AnimeInfo) => {
                if (anime) await this.setAnimeUID(anime.uid);
            };

        this._animeSearchDialogOpen$.next({
            onClose,
            open: true,
        });
    }

    /** Return the URL of this Anime. */
    public abstract async getAnimeURL(): Promise<string | undefined>;

    public async _load() {
        const [statusBar, searchDialog] = await Promise.all([
            this.buildAnimeStatusBar(),
            this.buildAnimeSearchDialog(),
        ]);

        await Promise.all([
            this.injectAnimeStatusBar(statusBar),
            this.injectAnimeSearchDialog(searchDialog),
        ]);

        // update the subscription to make sure it reflects the current state
        if (await this.isSubscribed())
            await this.updateSubscription();
    }

    /**
     * Get the URL of the provided episode for this Anime.
     */
    public abstract async getEpisodeURL(episodeIndex: number): Promise<string | undefined>;

    /**
     * Navigate the user to the episode with the given index.
     */
    public abstract async showEpisode(episodeIndex: number): Promise<boolean>;

    public abstract async injectAnimeStatusBar(statusBar: Element): Promise<void>;

    public async buildAnimeSearchDialog(): Promise<Element> {
        return this.state.renderWithTheme(
            createElement(RemoteAnimeSearchDialog, {
                animePage: this,
                open$: this._animeSearchDialogOpen$,
            }),
        );
    }

    public async injectAnimeSearchDialog(searchDialog: Element): Promise<void> {
        document.body.appendChild(searchDialog);
        this.injected(searchDialog);
    }

    public async transitionTo(page?: ServicePage<T>): Promise<ServicePage<T> | undefined> {
        if (page instanceof AnimePage) {
            const [thisID, otherID] = await Promise.all([
                this.getAnimeIdentifier(),
                page.getAnimeIdentifier(),
            ]);
            // no need to do anything if we're still on the same page.
            if (thisID === otherID) return this;
        } else if (page instanceof EpisodePage) {
            page.animePage = this;
            await page.load();
            return undefined;
        }

        return await super.transitionTo(page);
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

    private async fixSubscription(subscription: AnimeSubscriptionInfo):
        Promise<Partial<AnimeSubscriptionInfo> | undefined> {
        let subFix: Partial<AnimeSubscriptionInfo> | undefined;

        switch (subscription.error) {
            case undefined:
                // if there's no error just return the subscription as is
                subFix = {};
                break;

            case SubscriptionError.UIDUnknown:
                const anime = await this.getAnime();
                if (anime !== undefined) {
                    subFix = {anime};
                }

                break;
        }

        if (subFix)
            subFix.error = undefined;

        return subFix;
    }

    private async searchAnimeForTitle(query: string, config: Config):
        Promise<GrobberSearchResult<AnimeInfo> | undefined> {
        const searchResult = await remoteGrobberClient.getAnimeForTitle(query);
        if (!searchResult) return undefined;

        // only even consider showing the warning if it hasn't already been shown
        if (!this.lowConfidenceWarningShown.has(query)) {
            this.lowConfidenceWarningShown.add(query);

            if (searchResult.certainty < config.maxCertaintyForWarning) {
                const percentage = Math.floor(100 * searchResult.certainty);

                this.service.showWarningSnackbar({
                    action: {
                        onClick: () => this.openAnimeSearchDialog(),
                        text: _("anime__search__low_confidence_warning__search_button"),
                    },
                    autoHideDuration: 7000,
                    message: _("anime__search__low_confidence_warning", [percentage]),
                });
            }
        }

        return searchResult;
    }
}
