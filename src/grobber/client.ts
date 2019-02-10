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
    AnimeSearchResult,
    Episode,
    episodeFromResp,
    GrobberRequestError,
    GrobberResponseError,
} from "./models";

/**
 * Time-to-live for cached [[Client]] objects.
 * Defaults to an hour.
 */
export let responseCacheTTL = 1000 * 60 * 60;

/**
 * Wrapper which adds a due date.
 */
interface ExpiringItem<T> {
    item: T;
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
 * A client for interacting with the Grobber API.
 * Uses an internal cache with [[ExpiringItem]].
 */
export class Client extends Memory {
    public axiosClient: AxiosInstance;

    private readonly animeInfoLock: AsyncLock;

    constructor() {
        super();

        this.animeInfoLock = new AsyncLock();

        this.axiosClient = axios.create();
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

    /**
     * Search for Anime.
     * Results are stored in the cache.
     *
     * @param results - Defaults to 1 and may go up to 20 (Hard limit by Grobber)
     *
     * @return - List of [[AnimeSearchResult]]. Length will not exceed the provided `results`.
     *
     * @throws Same errors as [[Client.request]]
     */
    public async searchAnime(query: string, results?: number): Promise<AnimeSearchResult[] | null> {
        const config = await Store.getConfig();

        let resp;
        try {
            resp = await this.performAnimeRequest(
                "/anime/search/",
                [
                    ["anime", query],
                    ["language", config.language],
                    ["dubbed", config.dubbed],
                    ["results", results || 1],
                ],
                response => {
                    const searchResults = response.anime as AnimeSearchResult[];
                    searchResults.forEach(searchResult => {
                        const anime = animeFromResp(searchResult);

                        const memoryKey = buildKeys([["uid", anime.uid]])[1];
                        this.rememberExpiring(memoryKey, anime, responseCacheTTL);
                    });

                    return searchResults;
                },
            );
        } catch (e) {
            console.error("Couldn't search for anime", e);
            return null;
        }

        return resp;
    }

    /**
     * Get the Anime info for the given uid.
     *
     * @throws Same errors as [[Client.request]]
     */
    public async getAnimeInfo(uid: string): Promise<AnimeInfo> {
        return await this.performAnimeRequest(
            "/anime/",
            [["uid", uid]],
            resp => animeFromResp(resp),
        );
    }

    /**
     * Get an Episode.
     *
     * @param episodeIndex - **Index**
     *
     * @throws Same errors as [[Client.request]]
     */
    public async getEpisode(uid: string, episodeIndex: number): Promise<Episode> {
        return await this.performAnimeRequest(
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

        return null;
    }

    private async performAnimeRequest(endpoint: string,
                                      paramsList: Array<[string, any]>,
                                      respHandler?: (resp: any) => any): Promise<any> {
        const [lockKeys, memoryKey] = buildKeys(paramsList);

        const params = paramsList.reduce((prev, [key, value]) => {
            // @ts-ignore
            prev[key] = value;
            return prev;
        }, {});

        return await this.animeInfoLock.withLock(async () => {
            const cached = this.getExpiringItemFromMemory(memoryKey);
            if (cached) return cached;

            const resp = await this.request(endpoint, params);
            const data = respHandler ? respHandler(resp) : resp;

            this.rememberExpiring(memoryKey, data, responseCacheTTL);
            return data;
        }, lockKeys);
    }
}

export const STATIC_CLIENT = new Client();
