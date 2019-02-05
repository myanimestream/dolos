/**
 * Some general models mostly for [[store]].
 *
 * @module models
 */

/** @ignore */
import {AnimeInfo, Language} from "dolos/grobber";


export interface Config {
    grobberUrl: string;

    autoplay: boolean;
    autoNext: boolean;

    language: Language;
    dubbed: boolean;

    updateAnimeProgress: boolean;

    /**
     * How high does the [[AnimeSearchResult.certainty]]
     * value have to be for a [[AnimeSearchResult]] to be listed
     * in the search results
     */
    minCertaintyForSearchResult: number;

    /**
     * How low does the [[AnimeSearchResult.certainty]] value
     * have to be for Dolos to show a warning Snackbar
     * prompting the user to manually check?
     */
    maxCertaintyForWarning: number;
}

/**
 * Default config values that are used if there is no
 * corresponding value.
 */
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

/**
 * Keeps track of Animes the user has subscribed to.
 */
export interface SubscribedAnimes {
    [identifer: string]: AnimeSubscriptionInfo;
}