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

    /**
     * How high does the [[SearchResult.certainty]]
     * value have to be for a [[SearchResult]] to be listed
     * in the search results
     */
    minCertaintyForSearchResult: number;

    /**
     * How low does the [[SearchResult.certainty]] value
     * have to be for Dolos to show a warning Snackbar
     * prompting the user to manually check?
     */
    maxCertaintyForWarning: number;
}

export const DEFAULT_CONFIG: Config = {
    grobberUrl: "https://mas.dokkeral.com",

    autoplay: true,
    autoNext: true,

    language: Language.ENGLISH,
    dubbed: false,

    updateAnimeProgress: true,

    minCertaintyForSearchResult: .4,

    maxCertaintyForWarning: .7,

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