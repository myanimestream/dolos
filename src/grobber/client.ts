/**
 * @module grobber
 */

import axios, {AxiosInstance, AxiosRequestConfig} from "axios";
import AsyncLock from "dolos/lock";
import {Memory} from "dolos/memory";
import Store from "dolos/store";
import {
    animeFromResp,
    AnimeInfo,
    Episode,
    episodeFromResp,
    GrobberInfo,
    GrobberMedium,
    grobberMediumFromRespData,
    GrobberRequestError,
    GrobberResponseError,
    GrobberSearchResult,
} from "./models";

/**
 * Time-to-live for cached [[GrobberClient]] objects.
 * Defaults to an hour.
 */
export let responseCacheTTL = 1000 * 60 * 60;

/**
 * Wrapper which adds a due date to the item.
 * Doesn't impose any rules itself.
 *
 * @see [[createExpiringItem]]
 */
interface ExpiringItem<T> {
    item: T;
    /**
     * Absolute timestamp at which this item is set to expire.
     * After this point the item should be deleted and no longer available.
     */
    expire: number;
}

/**
 * Create an [[ExpiringItem]].
 */
function createExpiringItem<T>(item: T, expireAt: number): ExpiringItem<T> {
    return {
        expire: expireAt,
        item,
    };
}

/**
 * Create lock keys and the memory key from the parameters.
 */
function buildKeys(params: Array<[any, any]>): [string[], string] {
    const lockKeys = params.map(([key, value]) => `${key}:${value}`);
    const memoryKey = "resp-cache." + lockKeys.join(".");

    return [lockKeys, memoryKey];
}

/**
 * Options for Grobber's search endpoint.
 */
export interface GrobberSearchOptions {
    /**
     * Page index to start search on. (Default is 0)
     */
    page?: number;
    /**
     * Amount of results to return per page.
     * Default is 20. If you need more results
     * you should use the pagination system instead
     * of increasing this number.
     */
    results?: number;
    /**
     * Whether or not to group results from different sources into
     * a group. (Default is true)
     */
    group?: boolean;
}

/** @ignore */
const defaultGrobberSearchOptions: GrobberSearchOptions = {
    group: true,
    page: 0,
    results: 20,
};

/**
 * Report returned by grobber url checks.
 */
export interface GrobberCheckReport {
    /**
     * Whether or not the Grobber base url is valid.
     */
    valid: boolean;
    /**
     * Hint as to why the grobber url is invalid.
     * This is set if [[GrobberCheckReport.valid]] is `false`
     */
    hint?: "trailing_slash" | "version_mismatch" | "no_grobber" | "grobber_error" | "test_failed";

    /**
     * Sanitised and final url used in the check.
     * This is set when [[GrobberCheckReport.valid]] is `true`.
     * Make sure to use this url instead of the input.
     */
    url?: string;
}

/**
 * Client which can interact with the Grobber API.
 *
 * @see [[GrobberClient]] for the implementation.
 */
export interface GrobberClientLike {
    /**
     * Get the grobber information.
     *
     * @param baseURL - Grobber url to get the [[GrobberInfo]] from.
     */
    getGrobberInfo(baseURL?: string): Promise<GrobberInfo>;

    /**
     * Create a [[GrobberCheckReport]] for the Grobber server.
     *
     * @param baseURL - Grobber url to get the [[GrobberInfo]] from.
     */
    checkGrobberInfo(baseURL?: string): Promise<GrobberCheckReport>;

    /**
     * Search for Animes.
     *
     * @return - List of search results, undefined` if there was an error.
     */
    searchAnime(query: string, options?: GrobberSearchOptions):
        Promise<Array<GrobberSearchResult<GrobberMedium>> | undefined>;

    /**
     * Get the Anime for a specific title.
     *
     * @return - Anime result, `undefined` if there was an error.
     */
    getAnimeForTitle(title: string, group?: boolean):
        Promise<GrobberSearchResult<AnimeInfo> | undefined>;

    /**
     * Get the Anime info for the given uid.
     *
     * @throws Same errors as [[GrobberClient.request]]
     */
    getAnimeInfo(uid: string): Promise<AnimeInfo>;

    /**
     * Get an Episode.
     *
     * @param episodeIndex - **Index**
     *
     * @throws Same errors as [[GrobberClient.request]]
     */
    getEpisode(uid: string, episodeIndex: number): Promise<Episode>;
}

/**
 * A client for interacting with the Grobber API.
 * Uses an internal cache with [[ExpiringItem]].
 *
 * The cache is realised using [[Memory]].
 */
export class GrobberClient extends Memory implements GrobberClientLike {
    public axiosClient: AxiosInstance;

    private readonly cachedRequestLock: AsyncLock;

    constructor() {
        super();

        this.axiosClient = axios.create();
        this.cachedRequestLock = new AsyncLock();
    }

    /**
     * Perform a request to the given Grobber endpoint with the given parameters.
     * The base url is read from the [[Config]].
     *
     * @throws [[GrobberResponseError]] - If Grobber returned an error response.
     * @throws [[GrobberRequestError]] - If a request was made but there was no response
     * @throws [[Error]] - When anything goes wrong while setting up the request.
     * This (probably) should't occur during normal operation.
     */
    public async request(endpoint: string, params?: { [key: string]: any }): Promise<any> {
        const config = await Store.getConfig();

        const requestConfig: AxiosRequestConfig = {
            baseURL: config.grobberUrl,
            params,
        };

        try {
            const resp = await this.axiosClient.get(endpoint, requestConfig);
            return resp.data;
        } catch (error) {
            if (error.response) {
                const data = error.response.data;
                throw new GrobberResponseError(data.name, data.msg, data.client_error);
            } else if (error.request) {
                throw new GrobberRequestError(error.request);
            } else {
                // who knows where this came from, but let's throw it back out there
                throw error;
            }
        }
    }

    /** @inheritDoc */
    public async getGrobberInfo(baseURL?: string): Promise<GrobberInfo> {
        if (!baseURL) {
            const config = await Store.getConfig();
            baseURL = config.grobberUrl;
        }

        const info: GrobberInfo = await this.request(new URL("dolos-info", baseURL).href);
        info.url = baseURL;

        return info;
    }

    /** @inheritDoc */
    public async checkGrobberInfo(baseURL?: string): Promise<GrobberCheckReport> {
        let info: GrobberInfo;

        try {
            info = await this.getGrobberInfo(baseURL);
        } catch (e) {
            if (e instanceof GrobberResponseError) {
                return {
                    hint: "grobber_error",
                    valid: false,
                };
            } else {
                return {
                    hint: "test_failed",
                    valid: false,
                };
            }
        }

        if (info.id !== "grobber") return {valid: false, hint: "no_grobber"};

        if (!info.version || !info.version.startsWith("3")) {
            return {valid: false, hint: "version_mismatch"};
        }

        return {valid: true, url: info.url};
    }

    /** @inheritDoc */
    public async searchAnime(query: string, options?: GrobberSearchOptions):
        Promise<Array<GrobberSearchResult<GrobberMedium>> | undefined> {
        const config = await Store.getConfig();

        options = {...defaultGrobberSearchOptions, ...options};

        let resp;
        try {
            resp = await this.performCachedRequest(
                "/anime/indexsearch/",
                [
                    ["query", query],
                    ["language", config.language],
                    ["dubbed", config.dubbed],
                    ["group", options.group],
                    ["page", options.page],
                    ["results", options.results],
                ],
                response => {
                    const rawSearchResults = response.anime as any[];

                    const searchResults: Array<GrobberSearchResult<GrobberMedium>> = [];

                    rawSearchResults.forEach(rawResult => {
                        const anime = grobberMediumFromRespData(rawResult.anime);

                        const memoryKey = buildKeys([["uid", anime.uid]])[1];
                        this.rememberExpiring(memoryKey, anime, responseCacheTTL);

                        searchResults.push({
                            certainty: rawResult.certainty,
                            item: anime,
                        });
                    });

                    return searchResults;
                },
            );
        } catch (e) {
            console.error("Couldn't search for anime", e);
            return undefined;
        }

        return resp;
    }

    /** @inheritDoc */
    public async getAnimeForTitle(title: string, group?: boolean): Promise<GrobberSearchResult<AnimeInfo> | undefined> {
        const config = await Store.getConfig();

        let resp;
        try {
            resp = await this.performCachedRequest(
                "/anime/search/",
                [
                    ["anime", title],
                    ["language", config.language],
                    ["dubbed", config.dubbed],
                    ["group", group !== undefined ? group : true],
                    ["results", 1],
                ],
                response => {
                    const rawSearchResults = response.anime as any[];
                    const firstRawSearchResult = rawSearchResults[0];
                    let searchResult: GrobberSearchResult<AnimeInfo> | undefined;

                    if (firstRawSearchResult) {
                        const anime = animeFromResp(firstRawSearchResult);

                        const memoryKey = buildKeys([["uid", anime.uid]])[1];
                        this.rememberExpiring(memoryKey, anime, responseCacheTTL);

                        searchResult = {
                            certainty: firstRawSearchResult.certainty || 0,
                            item: anime,
                        };
                    }

                    return searchResult;
                },
            );
        } catch (e) {
            console.error("Couldn't search for anime", e);
            return undefined;
        }

        return resp;
    }

    /** @inheritDoc */
    public async getAnimeInfo(uid: string): Promise<AnimeInfo> {
        return await this.performCachedRequest(
            "/anime/",
            [["uid", uid]],
            resp => animeFromResp(resp),
        );
    }

    /** @inheritDoc */
    public async getEpisode(uid: string, episodeIndex: number): Promise<Episode> {
        return await this.performCachedRequest(
            "/anime/episode/",
            [["uid", uid], ["episode", episodeIndex]],
            resp => {
                const episode = episodeFromResp(resp);

                this.rememberExpiring(buildKeys([["uid", uid]])[1], episode.anime, responseCacheTTL);

                return episode;
            },
        );
    }

    private rememberExpiring(key: string, item: any, ttl: number): any {
        this.remember(key, createExpiringItem(item, Date.now() + ttl));
    }

    private getExpiringItemFromMemory(key: string): any {
        const expiring = this.memory[key];

        if (expiring && expiring.expire > Date.now())
            return expiring.item;

        this.forget(key);
        return undefined;
    }

    private async performCachedRequest(endpoint: string,
                                       paramsList: Array<[string, any]>,
                                       respHandler?: (resp: any) => any): Promise<any> {
        const [lockKeys, memoryKey] = buildKeys(paramsList);

        const params = paramsList.reduce((prev, [key, value]) => {
            prev[key] = value;
            return prev;
        }, {} as { [key: string]: any });

        return await this.cachedRequestLock.withLock(async () => {
            const cached = this.getExpiringItemFromMemory(memoryKey);
            if (cached) return cached;

            const resp = await this.request(endpoint, params);
            const data = respHandler ? respHandler(resp) : resp;

            this.rememberExpiring(memoryKey, data, responseCacheTTL);
            return data;
        }, lockKeys);
    }
}
