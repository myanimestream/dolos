import axios from "axios";
import {Config, StoredAnimeInfo} from "../models";
import Store from "../store";
import {Episode, episodeFromResp, GrobberResponseError, SearchResult} from "./models";
import ServicePage from "./service-page";

export default class State {
    serviceId: string;
    page?: ServicePage;

    memory: { [key: string]: any };
    injectedElements: Element[];

    constructor(service_id: string) {
        this.serviceId = service_id;
        this.page = null;

        this.memory = {};
        this.injectedElements = [];
    }

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

    async loadPage(page?: ServicePage) {
        if (this.page) await this.page.unload();
        this.page = page;

        if (page) page.load().catch(reason => console.error("Something went wrong while loading service page", reason, page));
    }


    async request(endpoint: string, params?: Object): Promise<any> {
        const config = await this.config;
        const requestConfig = {params};
        const resp = await axios.get(config.grobberUrl + endpoint, requestConfig);

        const data = resp.data;
        if (!data.success) throw new GrobberResponseError(data.msg, data.code, data.name);

        return data;
    }

    async searchAnime(query: string): Promise<SearchResult[] | null> {
        const config = await this.config;

        let resp;
        try {
            resp = await this.request("/anime/search/", {anime: query, language: config.language, dubbed: config.dubbed});
        } catch (e) {
            console.error("Couldn't search for anime", e);
            return null;
        }

        return resp.anime;
    }

    async getAnimeInfo(identifier: string): Promise<StoredAnimeInfo> {
        return Store.getStoredAnimeInfo(this.serviceId, identifier);
    }

    async getEpisode(uid: string, index: number): Promise<Episode | null> {
        let resp;
        try {
            resp = await this.request("/anime/episode/", {uid, episode: index});
        } catch (e) {
            console.error("Couldn't fetch episode data", e);
            return null;
        }

        return episodeFromResp(resp);
    }
}