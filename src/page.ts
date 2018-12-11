import axios from "axios";
import * as React from "react";
import * as ReactDOM from "react-dom";
import Player, {PlayerSource, SkipButton} from "./common/Player";
import Config from "./config";
import Language from "./language";
import * as Store from "./store";

const _ = chrome.i18n.getMessage;

class GrobberResponseError extends Error {
    code: number;

    constructor(msg: string, code: number) {
        super(msg);
        this.code = code;
    }
}

interface SearchResult {
    anime: AnimeInfo;
    certainty: number;
}

interface AnimeInfo {
    title: string;
    uid: string;
    episodes: number;
    language: Language;
    dubbed: boolean;
}

function anime_from_resp(resp: any): AnimeInfo {
    return resp.anime as AnimeInfo;
}

interface Episode {
    anime: AnimeInfo;
    embed: string;
    stream?: EpisodeStream;
    streams: number;
    poster?: string;
}

function episode_from_resp(resp: any): Episode {
    const episode = resp.episode;
    episode.anime = anime_from_resp(resp);
    return episode;
}

interface EpisodeStream {
    episode: Episode;
    type: string;
    url: string;
    links: string[];
    poster?: string;
}

function episode_stream_from_resp(resp: any): Episode {
    const stream = resp.stream;
    stream.episode = episode_from_resp(resp);
    return stream;
}

class State {
    service_id: string;
    injectedElements: Element[];

    constructor(service_id: string) {
        this.service_id = service_id;
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
}

export abstract class AnimePage {
    state: State;

    protected constructor(service_id: string, state?: Partial<State>) {
        const s = new State(service_id);
        Object.assign(s, state);
        this.state = s;
    }

    abstract async route(url: URL);

    abstract async injectPlayer(player: Element);

    abstract async getAnimeSearchQuery(): Promise<string | null>;

    abstract async getAnimeIdentifier(): Promise<string | null>;

    abstract async getEpisodeIndex(): Promise<number | null>;

    abstract async nextEpisodeButton(): Promise<SkipButton | null>;

    abstract async showNextEpisode(): Promise<any>;

    abstract async prevEpisodeButton(): Promise<SkipButton | null>;

    abstract async showPrevEpisode(): Promise<any>;

    async load() {
        this.insertNoReferrerPolicy();
        await this.route(new URL(location.href));
    }

    insertNoReferrerPolicy() {
        const temp = document.createElement("template");
        temp.innerHTML = `<meta name="referrer" content="never">`;
        this.state.injected(document.head.appendChild(temp.content.firstElementChild));
    }

    async buildEpisode(episode: Episode): Promise<Element> {
        const sources: PlayerSource[] = [];
        episode.stream.links.forEach(link => sources.push({url: link}));

        const el = document.createElement("div");

        const epIndex = await this.getEpisodeIndex();

        let prevEpPromise = epIndex > 0 ? this.prevEpisodeButton() : Promise.resolve(null);
        let nextEpPromise = epIndex < episode.anime.episodes - 1 ? this.nextEpisodeButton() : Promise.resolve(null);

        const [prevEpBtn, nextEpBtn] = await Promise.all([prevEpPromise, nextEpPromise]);

        const config = await this.state.config;

        ReactDOM.render(React.createElement(Player, {
            sources,
            poster: episode.poster,
            skipPrev: prevEpBtn,
            skipNext: nextEpBtn,
            options: {
                title: _("player__video_title_format", [episode.anime.title, epIndex + 1]),
                autoplay: config.autoplay
            }
        }), el);

        return el;
    }

    async request(endpoint: string, params?: Object): Promise<any> {
        const config = await this.state.config;
        const requestConfig = {params};
        const resp = await axios.get(config.grobberUrl + endpoint, requestConfig);

        const data = resp.data;
        if (!data.success) throw new GrobberResponseError(data.msg, data.code);

        return data;
    }

    async getAnimeUID(): Promise<string | null> {
        const config = await this.state.config;

        const identifier = await this.getAnimeIdentifier();
        if (identifier) {
            const uid = await Store.getUID(this.state.service_id, identifier, config.language, config.dubbed);
            if (uid) return uid;
        }

        const query = await this.getAnimeSearchQuery();
        let resp;
        try {
            resp = await this.request("/anime/search", {anime: query, language: config.language, dubbed: config.dubbed});
        } catch (e) {
            console.trace("Couldn't search for anime", e);
            return null;
        }

        const results: SearchResult[] = resp.anime;
        if (!results) return null;

        const uid = results[0].anime.uid;
        Store.setUID(this.state.service_id, identifier, config.language, config.dubbed, uid).catch(console.trace);

        return uid;
    }

    async getEpisode(): Promise<Episode | null> {
        const [uid, epIndex] = await Promise.all([this.getAnimeUID(), this.getEpisodeIndex()]);
        if (!uid || (!epIndex && epIndex !== 0)) return null;

        let resp;

        try {
            resp = await this.request("/anime/episode", {uid, episode: epIndex});
        } catch (e) {
            console.trace("Couldn't fetch episode data", e);
            return null;
        }

        return episode_from_resp(resp);
    }


    async showEpisode() {
        const episode = await this.getEpisode();
        if (episode) await this.injectPlayer(await this.buildEpisode(episode));
    }

    async onEpisodeEnd() {
        await this.showNextEpisode();
    }
}