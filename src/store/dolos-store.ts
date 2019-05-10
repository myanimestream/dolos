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
import {distinctUntilChanged, map, switchMap} from "rxjs/operators";
import {AreaAdapter} from "./area-adapter";
import {applyDefaults, ItemSetter} from "./item";

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
export class Identifier {
    public readonly serviceID: string;
    public readonly languageID: string;
    public readonly mediumID: string;

    constructor(identifier: string | Identifier);
    constructor(serviceID: string, languageID: string, mediumID: string);
    constructor(...args: any[]) {
        if (args.length === 1) {
            const identifier = args[0];

            if (identifier instanceof Identifier)
                args = identifier.asTuple();
            else
                args = identifier.split("::");
        }

        if (args.length !== 3)
            throw new Error("Invalid identifier");

        this.serviceID = args[0];
        this.languageID = args[1];
        this.mediumID = args[2];
    }

    public asTuple(): [string, string, string] {
        return [this.serviceID, this.languageID, this.mediumID];
    }

    public asString(): string {
        return `${this.serviceID}::${this.languageID}::${this.mediumID}`;
    }
}

/**
 * Observable that emits read-only values.
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
     * Get the stored [[SubscribedAnimes]] object.
     */
    public getAnimeSubscriptions$(): ReadObservable<AnimeSubscriptions> {
        return this.getItem$(K_SUBS_A).pipe(
            applyDefaults({}),
        );
    }

    /**
     * Get the stored [[SubscribedAnimes]] object.
     */
    public getAnimeSubscriptionInfo$(id$: Observable<Identifier>): ItemObservable<AnimeSubscriptionInfo> {
        return id$.pipe(
            switchMap(id => this.getAnimeSubscriptions$().pipe(
                map(subscriptions => subscriptions[id.asString()]),
                distinctUntilChanged(),
            )),
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

    public getAnimeSubscriptionSetter(id: Identifier | AnimeSubscriptionInfo): ItemSetter<AnimeSubscriptionInfo> {
        if (!(id instanceof Identifier)) id = new Identifier(id.identifier);

        return this.getItemSetter([K_SUBS_A, id.asString()]);
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
