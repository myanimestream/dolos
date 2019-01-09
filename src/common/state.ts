import axios from "axios";
import {Config, StoredAnimeInfo} from "../models";
import Store from "../store";
import {ElementMemory} from "./memory";
import {
    animeFromResp,
    AnimeInfo,
    Episode,
    episodeFromResp,
    GrobberRequestError,
    GrobberResponseError,
    SearchResult
} from "./models";
import Service from "./service";
import ServicePage from "./service-page";

export default class State<T extends Service> extends ElementMemory {
    serviceId: string;
    page?: ServicePage<T>;

    constructor(service_id: string) {
        super();
        this.serviceId = service_id;
        this.page = null;
    }

    // noinspection JSMethodCanBeStatic
    get config(): Promise<Config> {
        return Store.getConfig();
    }

    async reload() {
        this.resetState();
        const page = this.page;
        if (page) {
            await page.reload();
        }
    }

    resetState() {
        this.removeInjected();
        this.resetMemory();
    }

    async loadPage(page?: ServicePage<T>) {
        if (this.page) {
            try {
                const override = await this.page.transitionTo(page);
                if (override) page = override;
            } catch (e) {
                console.error("Couldn't transition from page", this.page, "to", page);
                throw e;
            }
        } else if (page) {
            try {
                await page.load();
            } catch (e) {
                console.error("Couldn't load page", page);
                throw e;
            }
        }

        this.page = page;
    }


    async request(endpoint: string, params?: Object): Promise<any> {
        const config = await this.config;
        const requestConfig = {params};

        try {
            const resp = await axios.get(config.grobberUrl + endpoint, requestConfig);
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
        const config = await this.config;

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

    async getStoredAnimeInfo(identifier: string): Promise<StoredAnimeInfo> {
        return Store.getStoredAnimeInfo(this.serviceId, identifier);
    }

    async getAnimeInfo(uid: string): Promise<AnimeInfo> {
        const memoryKey = `anime-cache.${uid}`;
        const cachedAnime = this.memory[memoryKey];
        if (cachedAnime) return cachedAnime;

        const resp = await this.request("/anime/", {uid});
        const anime = animeFromResp(resp);
        this.remember(memoryKey, anime);
        return anime;
    }

    async getEpisode(uid: string, index: number): Promise<Episode> {
        const resp = await this.request("/anime/episode/", {uid, episode: index});
        const episode = episodeFromResp(resp);
        this.remember(`anime-cache.${uid}`, episode.anime);
        return episode;
    }
}

export interface HasState<T extends Service = any> {
    state: State<T>
}

export function cacheInStateMemory(keyName?: string) {
    return function (target: Object & HasState, propertyKey: string, descriptor: PropertyDescriptor) {
        keyName = keyName || `${target.constructor.name}-${propertyKey}`;
        const func = descriptor.value;
        let returnPromise;

        descriptor.value = function () {
            const memory = this.state.memory;

            let value;
            if (keyName in memory) {
                value = memory[keyName];
            } else {
                value = func.apply(this);
                returnPromise = !!value.then;

                Promise.resolve(value)
                    .then(val => this.state.remember(keyName, val))
                    .catch(console.error);
            }

            if (returnPromise) return Promise.resolve(value);
            else return value;
        };
    };
}