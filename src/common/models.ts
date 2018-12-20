import {Language} from "../models";

export enum GrobberErrorType {
    UidUnknown = "UIDUnknown"
}

export class GrobberResponseError extends Error {
    name: GrobberErrorType;
    code: number;

    constructor(msg: string, code: number, name: GrobberErrorType) {
        super(msg);
        this.code = code;
        this.name = name;
    }
}

export interface SearchResult {
    anime: AnimeInfo;
    certainty: number;
}

export interface AnimeInfo {
    title: string;
    uid: string;
    episodes: number;
    language: Language;
    dubbed: boolean;
}

export function animeFromResp(resp: any): AnimeInfo {
    return resp.anime as AnimeInfo;
}

export interface Episode {
    anime: AnimeInfo;
    embed: string;
    stream?: EpisodeStream;
    source_urls: string[];
    streams: number;
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

export function streamFromResponse(resp: any): Episode {
    const stream = resp.stream;
    stream.episode = episodeFromResp(resp);
    return stream;
}