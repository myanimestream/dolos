/**
 * Store tools specialised for Dolos.
 *
 * @module store
 */

/** @ignore */

import {AnimeInfo} from "dolos/grobber";
import {AnimeSubscriptionInfo, AnimeSubscriptions, Config, DEFAULT_CONFIG, StoredAnimeInfo} from "dolos/models";
import {ItemObservable} from "dolos/store/root";
import {combineLatest, Observable} from "rxjs";
import {map, switchMap} from "rxjs/operators";
import {AreaAdapter} from "./area-adapter";
import {applyDefaults} from "./item";

/**
 * Create a string identifying the given translation configuration.
 *
 * @param language - Language
 * @param dubbed - Dubbed
 */
export function buildLanguageIdentifier(language: string, dubbed: boolean): string {
    return `${language}_${dubbed ? "dub" : "sub"}`;
}

/**
 * Convert a string to a safe identifier.
 *
 * A safe identifier, in this context, is just a string without any special
 * characters such as stop-characters or punctuation. Just alphanumeric text.
 *
 * @param text - Text to convert
 */
export function safeIdentifier(text: string): string {
    let identifier = "";
    for (let i = 0; i < text.length; i++) {
        // apparently this godawful concatenation is faster than
        // joining an array of strings in JS.
        identifier += text.charCodeAt(i).toString(16);
    }

    return identifier;
}

/**
 * Identifier which uniquely identifies a piece of media.
 * It's made up of the service id, the language id and the medium id
 * (in that order).
 */
export type Identifier = [string, string, string];

/**
 * Observable that emits read-only values.
 */
export type ReadObservable<T> = Observable<Readonly<T>>;

/**
 * A superset of the area adapter specialised for Dolos.
 */
export class DolosStore extends AreaAdapter {
    /**
     * Load the [[Config]] from the storage.
     */
    public getConfig$(): ReadObservable<Config> {
        return this.getItem$<Config>("config").pipe(
            applyDefaults(DEFAULT_CONFIG),
        );
    }

    /**
     * Get an observable emitting language identifiers from
     * [[buildLanguageIdentifier]] based on the current config values.
     */
    public getLanguageID$(): Observable<string> {
        return this.getConfig$().pipe(
            map(config => buildLanguageIdentifier(config.language, config.dubbed)),
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
            map(([languageID, mediumID]) => [serviceID, languageID, mediumID]),
        );
    }

    /**
     * Get a [[StoredAnimeInfo]] from the storage.
     */
    public getStoredAnimeInfo$(id$: Observable<Identifier>): ReadObservable<StoredAnimeInfo> {
        return id$.pipe(
            switchMap(([serviceID, languageID, mediumID]) =>
                this.getItem$([`${serviceID}::anime`, languageID, mediumID])),
            applyDefaults({}),
        );
    }

    /**
     * Get the stored [[SubscribedAnimes]] object.
     */
    public getAnimeSubscriptions$(): ReadObservable<AnimeSubscriptions> {
        return this.getItem$("subscriptions::anime").pipe(
            applyDefaults({}),
        );
    }

    /**
     * Get the stored [[SubscribedAnimes]] object.
     */
    public getAnimeSubscriptionInfo$(id$: Observable<Identifier>): ItemObservable<AnimeSubscriptionInfo> {
        return id$.pipe(
            switchMap(id => this.getAnimeSubscriptions$().pipe(
                map(subscriptions => subscriptions[id.join("::")]),
            )),
        );
    }

    /**
     * Get an observable which emits whether or not the user is subscribed to
     * the given Anime.
     */
    public getIsSubscribedToAnime$(id$: Observable<Identifier>): Observable<boolean> {
        return this.getAnimeSubscriptionInfo$(id$).pipe(map(item => item !== undefined));
    }

    /**
     * Subscribe to an Anime
     */
    public async subscribeAnime(id: Identifier,
                                anime: AnimeInfo,
                                animeURL: string,
                                episodesWatched: number,
                                nextEpisodeURL?: string): Promise<void> {
        const absID = id.join("::");

        const sub: AnimeSubscriptionInfo = {
            anime,
            animeURL,
            episodesWatched,
            identifier: absID,
            nextEpisodeURL,
            serviceID: id[0],
        };

        await this.setItem(["subscriptions::anime", absID], sub);
    }

    /**
     * Unsubscribe from an Anime
     */
    public async unsubscribeAnime(id: Identifier): Promise<void> {
        await this.setItem(["subscriptions::anime", id.join("::")], undefined);
    }
}
