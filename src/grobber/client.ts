import axios, {AxiosInstance, AxiosRequestConfig} from "axios";
import AsyncLock from "dolos/lock";
import {Memory} from "dolos/memory";
import Store from "dolos/store";
import {
    animeFromResp,
    AnimeInfo,
    Episode,
    episodeFromResp,
    GrobberRequestError,
    GrobberResponseError,
    SearchResult
} from "./models";


export let responseCacheTTL = 60 * 60 * 1000;

interface ExpiringItem<T> {
    item: T;
    expire: number;
}

function createExpiringItem<T>(item: T, expireAt: number): ExpiringItem<T> {
    return {
        item,
        expire: expireAt
    }

}

function buildKeys(params: [any, any][]): [string[], string] {
    const lockKeys = params.map(([key, value]) => `${key}:${value}`);
    const memoryKey = "resp-cache." + lockKeys.join(".");

    return [lockKeys, memoryKey];
}

export class Client extends Memory {
    axiosClient: AxiosInstance;

    private readonly animeInfoLock: AsyncLock;

    constructor() {
        super();

        this.animeInfoLock = new AsyncLock();

        this.axiosClient = axios.create();
    }

    async request(endpoint: string, params?: Object): Promise<any> {
        const config = await Store.getConfig();

        const requestConfig: AxiosRequestConfig = {
            params,
            baseURL: config.grobberUrl
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

    async searchAnime(query: string, results?: number): Promise<SearchResult[] | null> {
        const config = await Store.getConfig();

        let resp;
        try {
            resp = await this.request("/anime/search/", {
                anime: query,
                language: config.language,
                dubbed: config.dubbed,
                results: results || 1
            });
        } catch (e) {
            console.error("Couldn't search for anime", e);
            return null;
        }

        return resp.anime;
    }

    async getAnimeInfo(uid: string): Promise<AnimeInfo> {
        return await this.performAnimeRequest(
            "/anime/",
            [["uid", uid]],
            resp => animeFromResp(resp)
        );
    }

    async getEpisode(uid: string, episode: number): Promise<Episode> {
        return await this.performAnimeRequest(
            "/anime/episode/",
            [["uid", uid], ["episode", episode]],
            resp => {
                const episode = episodeFromResp(resp);

                this.rememberExpiring(buildKeys([["uid", uid]])[1], episode.anime, responseCacheTTL);

                return episode
            }
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

    private async performAnimeRequest(endpoint: string, paramsList: [string, any][], respHandler: (any) => any): Promise<any> {
        const [lockKeys, memoryKey] = buildKeys(paramsList);

        const params = paramsList.reduce((prev, [key, value]) => {
            prev[key] = value;
            return prev
        }, {});

        return await this.animeInfoLock.withLock(async () => {
            const cached = this.getExpiringItemFromMemory(memoryKey);
            if (cached) return cached;

            const resp = await this.request(endpoint, params);
            const data = respHandler(resp);
            this.rememberExpiring(memoryKey, data, responseCacheTTL);
            return data;
        }, lockKeys);
    }
}

export const StaticClient = new Client();