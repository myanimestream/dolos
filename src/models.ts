/**
 * Some general models mostly for [[store]].
 *
 * @module models
 */

/** @ignore */

// using dolos/grobber/models instead of dolos/grobber because
// there seems to be a bug which causes Language to be undefined
// otherwise.
import {AnimeInfo, Language} from "dolos/grobber/models";

export interface Config {
    grobberUrl: string;
    debugMode: boolean;

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

    embedProviders: {
        blocked: string[];
        order: string[];
    };
}

/**
 * Default config values that are used if there is no
 * corresponding value.
 */
export const DEFAULT_CONFIG: Config = {
    debugMode: false,
    grobberUrl: "https://mas.dokkeral.com",

    autoNext: true,
    autoplay: true,

    dubbed: false,
    language: Language.ENGLISH,

    updateAnimeProgress: true,

    minCertaintyForSearchResult: .4,

    maxCertaintyForWarning: .8,

    embedProviders: {
        blocked: ["mcloud", "mp4upload"],
        order: [],
    },
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
    /**
     * Url of the next episode the user hasn't watched.
     * This is undefined if the next episode url
     * couldn't be determined.
     */
    nextEpisodeURL?: string;
    anime: AnimeInfo;
}

/**
 * Keeps track of Animes the user has subscribed to.
 */
export interface SubscribedAnimes {
    [identifer: string]: AnimeSubscriptionInfo;
}
