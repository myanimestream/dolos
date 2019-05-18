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
import {captureException} from "dolos/logging";
import {cacheInMemory} from "dolos/memory";
import {AnimeSubscriptionInfo, Config, StoredAnimeInfo, SubscriptionError} from "dolos/models";
import {wrapSentryLogger} from "dolos/SentryLogger";
import {Identifier, ReadObservable, store} from "dolos/store";
import {createElement} from "react";
import {
    combineLatest,
    defer,
    EMPTY,
    from,
    merge,
    Observable,
    ObservableInput,
    of,
    Subject,
    throwError,
    zip,
} from "rxjs";
import {
    catchError,
    distinctUntilChanged,
    exhaustMap,
    filter,
    first,
    map,
    mapTo,
    pluck,
    share,
    switchMap,
    take,
    takeUntil,
    tap,
    withLatestFrom,
} from "rxjs/operators";
import {EpisodePage} from ".";
import {Service} from "../service";
import {ServicePage} from "../service-page";
import _ = chrome.i18n.getMessage;

/**
 * AnimePage reflects a page that is dedicated to a specific Anime.
 */
export abstract class AnimePage<T extends Service> extends ServicePage<T> {
    private readonly _episodesWatched$: Subject<number | undefined>;
    private readonly _animeSearchDialogOpen$: Subject<SearchDialogOpenCommand>;

    // used to make sure the warning is only shown once
    // this feels very dirty but it works...
    private readonly lowConfidenceWarningShown: Set<string>;

    constructor(service: T) {
        super(service);

        this._episodesWatched$ = new Subject();
        this._animeSearchDialogOpen$ = new Subject();
        this.lowConfidenceWarningShown = new Set();
    }

    /**
     * Get a unique identifier for this anime.
     */
    public abstract async getAnimeIdentifier(): Promise<string | undefined>;

    /**
     * Get the search query to be used for Grobber's search endpoint.
     * @return `undefined` if there is no search query.
     */
    public abstract async getAnimeSearchQuery(): Promise<string | undefined>;

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
     * Get the URL of the provided episode for this Anime.
     */
    public abstract async getEpisodeURL(episodeIndex: number): Promise<string | undefined>;

    /**
     * Navigate the user to the episode with the given index.
     *
     * @returns whether the operation was succesful.
     */
    public abstract async showEpisode(episodeIndex: number): Promise<boolean>;

    /**
     * Inject the anime status bar into the document.
     *
     * @param statusBar - Element to inject.
     */
    public abstract async injectAnimeStatusBar(statusBar: Element): Promise<void>;

    /** Return the URL of this Anime. */
    public abstract async getAnimeURL(): Promise<string | undefined>;

    /**
     * Get an observable for the Identifier of the anime.
     */
    public getID$(): Observable<Identifier> {
        const id$ = defer(() => this.getAnimeIdentifier()).pipe(
            map(id => {
                if (id === undefined)
                    throw new Error("No anime identifier received");

                return id;
            }),
        );

        return this.state.getAnimeID$(id$);
    }

    /**
     * Get the information stored for the Anime.
     */
    public getStoredInfo$(): ReadObservable<StoredAnimeInfo> {
        return store.getStoredAnimeInfo$(this.getID$());
    }

    /**
     * Force the uid to be updated.
     */
    public forceUpdateUID(): Promise<string> {
        return defer(() => this.getAnimeSearchQuery()).pipe(
            map(query => {
                if (query === undefined)
                    throw new Error("No anime search query");

                return query;
            }),
            withLatestFrom(this.state.config$),
            switchMap(([query, config]) => this.searchAnimeForTitle(query, config)),
            pluck("item", "uid"),
            first(),
            tap(uid => this.updateStoredInfo({uid})),
        ).toPromise();
    }

    /**
     * Get the uid of the current anime.
     */
    public getUID$(): Observable<string> {
        return this.getStoredInfo$().pipe(
            pluck("uid"),
            switchMap(uid => {
                if (uid === undefined)
                    return this.forceUpdateUID();
                return of(uid);
            }),
        );
    }

    /**
     * Set the UID associated with the [[AnimePage.getAnimeIdentifier]] identifier
     * and update the subscription if subscribed.
     * **This will cause the current [[ServicePage]] to be reloaded!**
     */
    public setAnimeUID(uidOrInfo: string | AnimeInfo): Promise<void> {
        const info$ = (
            typeof uidOrInfo === "string" ?
                defer(() => remoteGrobberClient.getAnimeInfo(uidOrInfo)) :
                of(uidOrInfo)
        ).pipe(share());

        const updateStoredInfo$ = info$.pipe(
            switchMap(info => this.updateStoredInfo({uid: info.uid})),
        );

        const updateSubInfo$ = zip(info$, this.getSubscriptionInfo$()).pipe(
            switchMap(([info, subscription]) => {
                if (subscription) {
                    return store.getMutAnimeSubscription(subscription)
                        .set(info, "anime");
                } else {
                    return EMPTY;
                }
            }),
        );

        return zip(updateStoredInfo$, updateSubInfo$).pipe(
            switchMap(() => {
                // this handles the case of a page "abusing" the AnimePage
                // such as the EpisodePage
                if (this.state.page)
                    return this.state.page.reload();
                else
                    return this.reload();
            }),
        ).toPromise();
    }

    /**
     * Get the [[AnimeInfo]] for the anime.
     */
    public getInfo$(): Observable<AnimeInfo> {
        return this.getUID$().pipe(
            switchMap(uid => remoteGrobberClient.getAnimeInfo(uid)),
            catchError(err => {
                if (err instanceof GrobberResponseError && err.name === GrobberErrorType.UIDUnknown) {
                    return from(this.forceUpdateUID()).pipe(
                        switchMap(uid => remoteGrobberClient.getAnimeInfo(uid)),
                    );
                } else {
                    return throwError(err);
                }
            }),
        );
    }

    /**
     * Observable denoting whether the user is subscribed to the Anime
     */
    public isSubscribed$(): Observable<boolean> {
        return store.isSubscribedToAnime$(this.getID$());
    }

    /**
     * Get the subscription info for the anime.
     */
    public getSubscriptionInfo$(): ReadObservable<AnimeSubscriptionInfo | undefined> {
        return store.getAnimeSubscriptionInfo$(this.getID$());
    }

    /**
     * Observable denoting whether it is possible (read: allowed) to subscribe to the Anime.
     */
    public canSubscribe$(): Observable<boolean> {
        return combineLatest([
            this.getEpisodesWatched$(),
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
    public subscribeAnime(): Promise<boolean> {
        type PartialInfo = [Identifier, AnimeInfo, string, number];
        type Info = [Identifier, AnimeInfo, string, number, string];

        return zip(
            this.getID$(),
            this.getInfo$(),
            defer(() => this.getAnimeURL()),
            this.getEpisodesWatched$(),
        ).pipe(
            // make sure anime info and url are present
            map(([id, info, url, episodesWatched]) => {
                if (!(info && url))
                    throw new Error("couldn't get anime and anime url");

                return [id, info, url, episodesWatched || 0] as PartialInfo;
            }),
            // get the next episode url
            exhaustMap(([id, info, url, episodesWatched]: PartialInfo) => {
                return from(this.getEpisodeURL(episodesWatched)).pipe(
                    map(nextEpisodeURL => [id, info, url, episodesWatched, nextEpisodeURL] as Info),
                );
            }),
            exhaustMap(([id, info, url, episodesWatched, nextEpisodeURL]: Info) =>
                store.subscribeAnime(id, info, url, episodesWatched, nextEpisodeURL)),
            mapTo(true),
            catchError(() => of(false)),
        ).toPromise();
    }

    /**
     * Update the subscription for this Anime.
     * @returns Whether the action was successful.
     */
    public async updateSubscription(episodesWatched?: number | ObservableInput<number>): Promise<void> {
        const episodesWatched$ = (episodesWatched === undefined) ?
            this.getEpisodesWatched$() :
            (typeof episodesWatched === "number") ?
                of(episodesWatched) :
                episodesWatched;

        return zip(
            episodesWatched$,
            defer(() => this.getEpisodeCount()),
            this.getSubscriptionInfo$(),
        ).pipe(
            first(),
            exhaustMap(async ([epsWatched, totalEpisodes, subscription]) => {
                if (epsWatched === undefined || subscription === undefined)
                    return;
                else if (epsWatched === totalEpisodes)
                    return void await this.unsubscribeAnime();

                const mutSub = store.getMutAnimeSubscription(subscription);

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

                return await mutSub.update(subscriptionUpdate);
            }),
        ).toPromise();
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
            captureException(e);
            // because we shouldn't unsubscribe from an anime if we don't have the id...
            return false;
        }

        await store.unsubscribeAnime(id);
        return true;
    }

    /**
     * Get an observable for the amount of episodes the user has watched.
     */
    public getEpisodesWatched$(): Observable<number | undefined> {
        const update$ = this._episodesWatched$;
        const initial$ = defer(() => this._getEpisodesWatched()).pipe(
            takeUntil(update$),
        );

        return merge(initial$, update$);
    }

    /**
     * Set the amount of episodes watched.
     *
     * @returns whether the action was successful.
     */
    public async setEpisodesWatched(progress: number): Promise<boolean> {
        const success = await this._setEpisodesWatched(progress);
        if (success) {
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
        this.isSubscribed$().pipe(
            take(1),
            filter(Boolean),
        ).subscribe(() => this.updateSubscription());
    }

    /**
     * Create the anime search dialog element.
     */
    public async buildAnimeSearchDialog(): Promise<Element> {
        return this.state.renderWithTheme(
            createElement(RemoteAnimeSearchDialog, {
                animePage: this,
                open$: this._animeSearchDialogOpen$,
            }),
        );
    }

    /**
     * Inject the anime search dialog into the document.
     *
     * @param searchDialog - Element to inject.
     */
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
     * @deprecated use [[getUID$]]
     *
     * Get the UID of the Anime.
     * This method will return the stored UID (if available) unless `forceSearch` is true.
     *
     * @param forceSearch - Ignore the stored UID.
     *
     * @return `undefined` if there were no results or the [[AnimePage.getAnimeSearchQuery]] was empty
     */
    public async getAnimeUID(forceSearch?: boolean): Promise<string | undefined> {
        return await this.getUID$().pipe(first()).toPromise();
    }

    /**
     * @deprecated use [[getStoredInfo$]]
     *
     * Get the information stored in the browser storage.
     *
     * @throws if [[AnimePage.getAnimeIdentifier]] didn't return an identifier
     */
    public async getStoredAnimeInfo(): Promise<Readonly<StoredAnimeInfo>> {
        return this.getStoredInfo$().pipe(first()).toPromise();
    }

    /**
     * @deprecated use [[getInfo$]]
     *
     * Get the [[AnimeInfo]] for this page.
     */
    @cacheInMemory("anime")
    public async getAnime(): Promise<AnimeInfo | undefined> {
        try {
            return await this.getInfo$().pipe(first()).toPromise();
        } catch {
            return undefined;
        }
    }

    /**
     * @deprecated use [[getEpisodesWatched$]]
     *
     * Get the amount of episodes the user has seen.
     *
     * @return
     * `undefined` if the user is not watching this particular Anime.
     */
    public async getEpisodesWatched(): Promise<number | undefined> {
        return await this._getEpisodesWatched();
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
     * @deprecated use [[getSubscriptionInfo$]] instead.
     *
     * Get the [[AnimeSubscriptionInfo]] for the Anime
     * @returns undefined if the user isn't subscribed to the Anime.
     */
    public async getSubscription(): Promise<Readonly<AnimeSubscriptionInfo> | undefined> {
        return await this.getSubscriptionInfo$().pipe(first()).toPromise();
    }

    /**
     * @private
     *
     * Internal progress getter. **Do not use this method**!
     * @see [[getEpisodesWatched]] instead!
     */
    protected abstract async _getEpisodesWatched(): Promise<number | undefined>;

    /**
     * @private
     *
     * Internal progress setting. **Do not use this method**!
     * @see [[setEpisodesWatched]] instead!
     */
    protected abstract async _setEpisodesWatched(progress: number): Promise<boolean>;

    /**
     * Update the stored anime info with the given update.
     */
    protected updateStoredInfo(update: Partial<StoredAnimeInfo>): Promise<void> {
        return this.getID$().pipe(
            first(),
            tap(id => store.updateStoredAnimeInfo$(id, update)),
            mapTo(undefined),
        ).toPromise();
    }

    /**
     * Fix the given subscription.
     *
     * @param subscription - Subscription to be fixed.
     *
     * @returns Partial subscription object which contains patches to be applied
     * to fix the subscription or `undefined` if the subscription can't be
     * fixed.
     */
    protected async fixSubscription(subscription: AnimeSubscriptionInfo):
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

    /**
     * Search for the anime for the given query.
     * Shows a low confidence warning with a "search" button if the
     * confidence is below the threshold set in the config.
     *
     * @param query - Query to search for.
     * @param config - Config.
     */
    private async searchAnimeForTitle(query: string, config: Config): Promise<GrobberSearchResult<AnimeInfo>> {
        const searchResult = await remoteGrobberClient.getAnimeForTitle(query);
        if (!searchResult) throw new Error("Couldn't find anime");

        // only even consider showing the warning if it hasn't already been shown
        if (!this.lowConfidenceWarningShown.has(query)) {
            if (searchResult.certainty < config.maxCertaintyForWarning) {
                this.lowConfidenceWarningShown.add(query);

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
