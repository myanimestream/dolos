import axios from "axios";
import {Config, StoredAnimeInfo} from "../models";
import Store from "../store";
import Memory from "./memory";
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

export default class State<T extends Service> extends Memory {
    serviceId: string;
    page?: ServicePage<T>;

    injectedElements: { [key: string]: Element[] };

    constructor(service_id: string) {
        super();
        this.serviceId = service_id;
        this.page = null;

        this.injectedElements = {};
    }

    // noinspection JSMethodCanBeStatic
    get config(): Promise<Config> {
        return Store.getConfig();
    }

    injected(el: Element, ns?: string) {
        const elements = this.injectedElements[ns];

        if (elements) elements.push(el);
        else this.injectedElements[ns] = [el];
    }

    removeInjected(ns?: string) {
        if (ns) {
            const elements = this.injectedElements[ns];
            if (elements) {
                elements.forEach(el => el.remove());
                this.injectedElements[ns] = [];
            }
        } else {
            Object.values(this.injectedElements)
                .forEach(elements =>
                    elements.forEach(el => el.remove())
                );

            this.injectedElements = {};
        }
    }

    async reload() {
        this.resetPage();
    }

    resetPage() {
        this.removeInjected();
        this.resetMemory();
        this.page = null;
    }

    async loadPage(page?: ServicePage<T>) {
        if (this.page) {
            await this.page.transitionTo(page);
        } else if (page) {
            await page.load();
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

export function cacheInStateMemory(keyName?: string, ...namespaces: string[]) {
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
                    .then(val => this.state.remember(keyName, val, ...namespaces))
                    .catch(console.error);
            }

            if (returnPromise) return Promise.resolve(value);
            else return value;
        };
    };
}