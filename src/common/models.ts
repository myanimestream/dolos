import Language from "../language";

export class GrobberResponseError extends Error {
    code: number;

    constructor(msg: string, code: number) {
        super(msg);
        this.code = code;
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