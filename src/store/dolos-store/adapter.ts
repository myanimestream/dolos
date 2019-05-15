/**
 * @module store
 */

/** @ignore */

import {AnimeInfo} from "dolos/grobber";
import {AnimeSubscriptionInfo, AnimeSubscriptions, Config, DEFAULT_CONFIG, StoredAnimeInfo} from "dolos/models";
import {applyDefaults, AreaAdapter, ItemObservable, MutItem} from "dolos/store";
import {combineLatest, Observable} from "rxjs";
import {distinctUntilChanged, map, switchMap} from "rxjs/operators";
import {buildLanguageIdentifier, Identifier, safeIdentifier} from "./identifier";

/**
 * Observable which emits read-only values.
 */
export type ReadObservable<T> = Observable<Readonly<T>>;

const K_CONF = "config";
const K_SUBS_A = "subscriptions::anime";

/**
 * A superset of the area adapter specialised for Dolos.
 */
export class DolosStore extends AreaAdapter {
    /**
     * Load the [[Config]] from the storage.
     */
    public getConfig$(): ReadObservable<Config> {
        return this.getItem$<Config>(K_CONF).pipe(
            applyDefaults(DEFAULT_CONFIG),
        );
    }

    /**
     * Get a setter for the config.
     */
    public getMutConfig(): MutItem<Config> {
        return this.getMutItem<Config>(K_CONF);
    }

    /**
     * Get an observable emitting language identifiers from
     * [[buildLanguageIdentifier]] based on the current config values.
     */
    public getLanguageID$(): Observable<string> {
        return this.getConfig$().pipe(
            map(config => buildLanguageIdentifier(config.language, config.dubbed)),
            distinctUntilChanged(),
        );
    }

    /**
     * Get an observable for an identifier.
     *
     * The medium id is converted to a safe identifier using [[safeIdentifier]].
     */
    public getID$(serviceID: string,
                  mediumID$: Observable<string>,
                  languageID$?: Observable<string>): Observable<Identifier> {
        languageID$ = languageID$ || this.getLanguageID$();

        const safeMediumID$ = mediumID$.pipe(map(mediumID => safeIdentifier(mediumID)));

        return combineLatest([languageID$, safeMediumID$]).pipe(
            map(([languageID, mediumID]) => new Identifier(serviceID, languageID, mediumID)),
        );
    }

    /**
     * Get a [[StoredAnimeInfo]] from the storage.
     */
    public getStoredAnimeInfo$(id$: Observable<Identifier>): ReadObservable<StoredAnimeInfo> {
        return id$.pipe(
            switchMap((id) =>
                this.getItem$([`${id.serviceID}::anime`, id.languageID, id.mediumID])),
            applyDefaults({}),
        );
    }

    /**
     * Update the stored [[StoredAnimeInfo]].
     */
    public updateStoredAnimeInfo$(id: Identifier, update: Partial<StoredAnimeInfo>): Promise<void> {
        return this.updateItem([`${id.serviceID}::anime`, id.languageID, id.mediumID], update);
    }

    /**
     * Get the stored [[SubscribedAnimes]] object.
     */
    public getAnimeSubscriptions$(): ReadObservable<AnimeSubscriptions> {
        return this.getItem$(K_SUBS_A).pipe(
            applyDefaults({}),
        );
    }

    /**
     * Get an observable for a list of subscriptions with unseen episodes
     */
    public getAnimeSubsWithUnseenEps$(): Observable<AnimeSubscriptionInfo[]> {
        return this.getAnimeSubscriptions$().pipe(
            map(subs => Object.values(subs)
                .filter(sub => sub.anime.episodes - sub.episodesWatched > 0),
            ),
        );
    }

    /**
     * Get an observable for the amount of subscriptions with unseen episodes
     *
     * @see [[getAnimeSubsWithUnseenEps$]]
     */
    public countAnimeSubsWithUnseenEps$(): Observable<number> {
        return this.getAnimeSubsWithUnseenEps$().pipe(
            map(unseen => unseen.length),
            distinctUntilChanged(),
        );
    }

    /**
     * Get the stored [[SubscribedAnimes]] object.
     */
    public getAnimeSubscriptionInfo$(id$: Observable<Identifier>): ItemObservable<AnimeSubscriptionInfo> {
        return id$.pipe(
            switchMap(id => this.getItem$<AnimeSubscriptionInfo>([K_SUBS_A, id.asString()])),
        );
    }

    /**
     * Get an observable which emits whether or not the user is subscribed to
     * the given Anime.
     */
    public isSubscribedToAnime$(id$: Observable<Identifier>): Observable<boolean> {
        return this.getAnimeSubscriptionInfo$(id$).pipe(
            map(item => item !== undefined),
            distinctUntilChanged(),
        );
    }

    /**
     * Get a setter for the given subscription.
     */
    public getMutAnimeSubscription(id: Identifier | AnimeSubscriptionInfo): MutItem<AnimeSubscriptionInfo> {
        if (!(id instanceof Identifier)) id = new Identifier(id.identifier);

        return this.getMutItem([K_SUBS_A, id.asString()]);
    }

    /**
     * Subscribe to an Anime
     */
    public async subscribeAnime(id: Identifier,
                                anime: AnimeInfo,
                                animeURL: string,
                                episodesWatched: number,
                                nextEpisodeURL?: string): Promise<void> {
        const absID = id.asString();

        const sub: AnimeSubscriptionInfo = {
            anime,
            animeURL,
            episodesWatched,
            identifier: absID,
            nextEpisodeURL,
            serviceID: id.serviceID,
        };

        await this.setItem([K_SUBS_A, absID], sub);
    }

    /**
     * Unsubscribe from an Anime
     */
    public async unsubscribeAnime(id: Identifier | AnimeSubscriptionInfo): Promise<void> {
        if (!(id instanceof Identifier)) id = new Identifier(id.identifier);

        await this.setItem([K_SUBS_A, id.asString()], undefined);
    }
}
