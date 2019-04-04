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

const defaultGrobberSearchOptions: GrobberSearchOptions = {
    group: true,
    page: 0,
    results: 20,
};

/**
 * Client which can interact with the Grobber API.
 *
 * @see [[GrobberClient]] for the implementation.
 */
export interface GrobberClientLike {
    /**
     * Get the grobber information.
     */
    getGrobberInfo(): Promise<GrobberInfo>;

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
    public async getGrobberInfo(): Promise<GrobberInfo> {
        return await this.performCachedRequest("/dolos-info", []);
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
