/**
 * @module grobber
 */

import {Language} from "../models";

export class GrobberRequestError extends Error {
    request: XMLHttpRequest;

    constructor(request: XMLHttpRequest) {
        super(`Grobber Request Error: ${request.statusText}`);
        this.request = request;
    }
}

export enum GrobberErrorType {
    UidUnknown = "UIDUnknown"
}

export class GrobberResponseError extends Error {
    name: GrobberErrorType;
    /** Indicates that the error had nothing to do with Grobber */
    clientError: boolean;

    constructor(name: GrobberErrorType, msg: string, clientError: boolean) {
        super(msg);
        this.name = name;
        this.clientError = clientError
    }
}

export interface SearchResult {
    anime: AnimeInfo;
    certainty: number;
}

export interface AnimeInfo {
    uid: string;
    title: string;
    thumbnail: string;
    episodes: number;
    language: Language;
    dubbed: boolean;
}

export function animeFromResp(resp: any): AnimeInfo {
    return resp.anime as AnimeInfo;
}

export interface Episode {
    anime: AnimeInfo;
    embeds: string[];
    stream?: EpisodeStream;
    poster?: string;
}

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

export function streamFromResponse(resp: any): EpisodeStream {
    const stream = resp.stream;
    stream.episode = episodeFromResp(resp);
    return stream;
}