import axios from "axios";
import {Config, StoredAnimeInfo} from "../models";
import Store from "../store";
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

export default class State<T extends Service> {
    serviceId: string;
    page?: ServicePage<T>;

    memory: { [key: string]: any };
    injectedElements: Element[];

    constructor(service_id: string) {
        this.serviceId = service_id;
        this.page = null;

        this.memory = {};
        this.injectedElements = [];
    }

    // noinspection JSMethodCanBeStatic
    get config(): Promise<Config> {
        return Store.getConfig();
    }

    injected(el: Element) {
        this.injectedElements.push(el);
    }

    removeInjected() {
        this.injectedElements.forEach(el => el.remove());
        this.injectedElements = [];
    }

    async reload() {
        this.removeInjected();
        this.memory = {};
        await this.loadPage(null);
    }

    async loadPage(page?: ServicePage<T>) {
        if (this.page) await this.page.unload();
        this.page = page;

        if (page) page.load().catch(reason => console.error("Something went wrong while loading service page", reason, page));
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

    async searchAnime(query: string): Promise<SearchResult[] | null> {
        const config = await this.config;

        let resp;
        try {
            resp = await this.request("/anime/search/", {
                anime: query,
                language: config.language,
                dubbed: config.dubbed
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
        const resp = await this.request("/anime/", {uid});
        return animeFromResp(resp);
    }

    async getEpisode(uid: string, index: number): Promise<Episode> {
        const resp = await this.request("/anime/episode/", {uid, episode: index});
        return episodeFromResp(resp);
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
                    .then(val => memory[keyName] = val)
                    .catch(console.error);
            }

            if (returnPromise) return Promise.resolve(value);
            else return value;
        };
    };
}