import {AnimeSubscriptionInfo, AnimeSubscriptions, Config, DEFAULT_CONFIG, StoredAnimeInfo} from "dolos/models";
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
 * Convert the name of the medium to an identifier.
 *
 * @param name - Name of the medium
 */
export function buildMediumIdentifier(name: string): string {
    let identifier = "";
    for (let i = 0; i < name.length; i++) {
        // apparently this godawful concatenation is faster than
        // joining an array of strings in JS.
        identifier += name.charCodeAt(i).toString(16);
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
 * A superset of the area adapter specialised for Dolos.
 */
export class DolosStore extends AreaAdapter {
    /**
     * Load the [[Config]] from the storage.
     */
    public getConfig$(): Observable<Config> {
        return this.getItem$<Config>("config").pipe(
            applyDefaults(DEFAULT_CONFIG),
        );
    }

    /**
     * Get an observable emitting language identifiers from [[buildLanguageIdentifier]]
     * based on the current config values.
     */
    public getLanguageID$(): Observable<string> {
        return this.getConfig$().pipe(
            map(config => buildLanguageIdentifier(config.language, config.dubbed)),
        );
    }

    public getID$(serviceID: string, mediumID$: Observable<string>, languageID$?: Observable<string>): Observable<Identifier> {
        languageID$ = languageID$ || this.getLanguageID$();

        return combineLatest([languageID$, mediumID$]).pipe(
            map(([languageID, mediumID]) => [serviceID, languageID, mediumID]),
        );
    }

    /**
     * Get a [[StoredAnimeInfo]] from the storage.
     */
    public getStoredAnimeInfo$(id$: Observable<Identifier>): Observable<StoredAnimeInfo> {
        return id$.pipe(
            switchMap(([serviceID, languageID, mediumID]) =>
                this.getItem$([`${serviceID}::anime`, languageID, mediumID])),
            applyDefaults({}),
        );
    }

    /**
     * Get the stored [[SubscribedAnimes]] object.
     */
    public getAnimeSubscriptions$(): Observable<AnimeSubscriptions> {
        return this.getItem$("subscriptions::anime").pipe(
            applyDefaults({}),
        );
    }

    /**
     * Get the stored [[SubscribedAnimes]] object.
     */
    public getAnimeSubscriptionInfo$(id$: Observable<Identifier>): Observable<AnimeSubscriptionInfo | undefined> {
        return id$.pipe(
            switchMap(id => this.getAnimeSubscriptions$().pipe(
                map(subscriptions => subscriptions[id.join("::")]),
            )),
        );
    }
}
