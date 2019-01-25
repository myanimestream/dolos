/**
 * @module models
 */

/** @ignore */
import {AnimeInfo} from "dolos/grobber";

export enum Language {
    ENGLISH = "en",
    GERMAN = "de",
}


export interface Config {
    grobberUrl: string;

    autoplay: boolean;
    autoNext: boolean;

    language: Language;
    dubbed: boolean;

    updateAnimeProgress: boolean;

    minCertaintyForSearchResult: number;
}

export const DEFAULT_CONFIG: Config = {
    grobberUrl: "https://mas.dokkeral.com",

    autoplay: true,
    autoNext: true,

    language: Language.ENGLISH,
    dubbed: false,

    updateAnimeProgress: true,

    minCertaintyForSearchResult: .4,
};

export interface StoredServiceAnimes {
    [language: string]: { [id: string]: StoredAnimeInfo };
}

export interface StoredAnimeInfo {
    uid?: string;
}

export interface AnimeSubscriptionInfo {
    serviceID: string;
    identifier: string;
    episodesWatched: number;
    animeURL: string;
    nextEpisodeURL: string;
    anime: AnimeInfo;
}

export interface SubscribedAnimes {
    [identifer: string]: AnimeSubscriptionInfo;
}