import axios, {AxiosRequestConfig} from "axios";
import {evaluateCode, formatCode, injectCode} from "../inject";

export async function kitsuAPIRequest(method: string, endpoint: string, auth?: string, config?: AxiosRequestConfig, silent?: boolean): Promise<any | null> {
    config = config || {};
    config.method = method;
    config.url = "/api/edge" + endpoint;
    config.headers = {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
    };

    if (auth) {
        config.headers["Authorization"] = auth;
    }

    try {
        return (await axios.request(config)).data
    } catch (e) {
        if (silent) {
            console.error("Silent error in Kitsu API request:", endpoint, e);
            return null;
        } else throw e;
    }
}


const EMBER_BASE = `
const getApp = ${(
    () => {
        const {Namespace, Application} = window["Ember"];
        return Namespace.NAMESPACES.find(namespace => (namespace instanceof Application));
    }
).toString()};

const getContainer = () => getApp().__container__;
const getQueryCache = () => getContainer().lookup("service:query-cache");
`;

export function transitionTo(view: string, ...args: any[]) {
    injectCode(EMBER_BASE +
        `getContainer().lookup("router:main").transitionTo("${view}", ${args.map(arg =>
            JSON.stringify(arg)
        )});`, {deleteAfter: true}
    );
}

export async function getAccessToken(): Promise<string | null> {
    return await evaluateCode(EMBER_BASE + `return getContainer().lookup("session:main").content.authenticated.access_token || null;`);
}


const SET_PROGRESS = `
return await new Promise(${(
    // @ts-ignore
    res => getQueryCache()
        .query("library-entry", {filter: {animeId: "{{animeId}}", userId: "{{userId}}"}})
        .then(records => {
            const entry = records.firstObject;
            entry.set("progress", "{{progress}}");
            return entry.save();
        })
        .then(() => res(true))
        .catch(reason => res(reason))
).toString()});
`;

export async function setProgress(animeId: string, userId: string, progress: number): Promise<boolean> {
    const result = await evaluateCode(EMBER_BASE + formatCode(SET_PROGRESS, {animeId, userId, progress}));
    if (result !== true) {
        console.error("couldn't update progress", result);
        return false;
    }

    return true;
}

const GET_PROGRESS = `
return await new Promise(${(
    // @ts-ignore
    res => getQueryCache()
        .query("library-entry", {filter: {animeId: "{{animeId}}", userId: "{{userId}}"}})
        .then(records => {
            const entry = records.firstObject;
            res(entry.progress);
        })
        .catch(reason => res(reason))
).toString()});
`;

export async function getProgress(animeId: string, userId: string): Promise<number | null> {
    const result = await evaluateCode(EMBER_BASE + formatCode(GET_PROGRESS, {animeId, userId}));
    if (isNaN(result)) return null;
    else return result;
}

export interface KitsuAnimeInfo {
    abbreviatedTitles: string[];
    ageRating: string;
    ageRatingGuide: string;
    averageRating: number;
    canonicalTitle: string;
    categories: string[];
    coverImage: string;
    coverImageTopOffset: number;
    endDate: string;
    episodeCount: number;
    episodeLength: number;
    favoritesCount: number;
    nsfw: boolean;
    popularityRank: number;
    posterImage: any;
    ratingFrequencies: any;
    ratingRank: number;
    slug: string;
    startDate: string;
    status: string;
    streamingLinks: string[];
    subtype: string;
    synopsis: string;
    tba: string;
    titles: any;
    youtubeVideoId: string;
}

export async function getAnime(): Promise<KitsuAnimeInfo | null> {
    try {
        const result = await evaluateCode(EMBER_BASE + `getContainer().lookup("controller:anime/show").media || null`);
        return result as KitsuAnimeInfo;
    } catch (e) {
        console.warn("Couldn't get anime info from kitsu", e);
        return null;
    }
}