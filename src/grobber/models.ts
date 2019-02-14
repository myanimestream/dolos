/* tslint:disable:max-classes-per-file */

/**
 * @module grobber
 */

/**
 * When a request was made but there was no response.
 */
export class GrobberRequestError extends Error {
    public request: XMLHttpRequest;

    constructor(request: XMLHttpRequest) {
        super(`Grobber Request Error: ${request.statusText}`);
        this.request = request;
    }
}

/**
 * Grobber error types returned under the key `name`.
 */
export enum GrobberErrorType {
    /**
     * The provided UID was not recognised by Grobber.
     * This means you should drop the uid and
     * perform a search for a new one.
     */
    UIDUnknown = "UIDUnknown",
}

/**
 * Represents an error returned by Grobber.
 */
export class GrobberResponseError extends Error {
    public name: GrobberErrorType;
    /** Indicates that the error had nothing to do with Grobber */
    public clientError: boolean;

    constructor(name: GrobberErrorType, msg: string, clientError: boolean) {
        super(msg);
        this.name = name;
        this.clientError = clientError;
    }
}

/**
 * Grobber info returned by the /dolos-info endpoint
 */
export interface GrobberInfo {
    id: string;
    version: string;
}

/**
 * Supported languages of Grobber
 */
export enum Language {
    ENGLISH = "en",
    GERMAN = "de",
}

/**
 * A search result from the anime search endpoint.
 */
export interface AnimeSearchResult {
    anime: AnimeInfo;
    certainty: number;
}

/**
 * Grobber anime model
 */
export interface AnimeInfo {
    uid: string;
    title: string;
    thumbnail: string;
    episodes: number;
    language: Language;
    dubbed: boolean;
}

/**
 * Create an [[AnimeInfo]] object from a Grobber JSON response.
 */
export function animeFromResp(resp: any): AnimeInfo {
    return resp.anime as AnimeInfo;
}

/**
 * Grobber Episode model.
 * Contains the [[AnimeInfo]] it belongs to.
 */
export interface Episode {
    anime: AnimeInfo;
    embeds: string[];
    stream?: EpisodeStream;
    poster?: string;
}

/**
 * Create an [[Episode]] object from a Grobber JSON response.
 */
export function episodeFromResp(resp: any): Episode {
    const episode = resp.episode;
    episode.anime = animeFromResp(resp);
    return episode;
}

export interface EpisodeStream {
    episode: Episode;
    type: string;
    url: string;
    links: string[];
    poster?: string;
}

/**
 * Create an [[EpisodeStream]] object from a Grobber JSON response.
 */
export function streamFromResponse(resp: any): EpisodeStream {
    const stream = resp.stream;
    stream.episode = episodeFromResp(resp);
    return stream;
}
