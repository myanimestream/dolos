import * as React from "react";
import {StoredAnimeInfo} from "../../models";
import {getThemeFor} from "../../theme";
import {reactRenderWithTheme} from "../../utils";
import {ContinueWatchingButton} from "../components";
import {AnimeInfo, GrobberErrorType} from "../models";
import Service from "../service";
import ServicePage from "../service-page";


export default abstract class AnimePage<T extends Service> extends ServicePage<T> {

    constructor(service: T) {
        super(service);
    }

    abstract async getAnimeSearchQuery(): Promise<string | null>;

    abstract async getAnimeIdentifier(): Promise<string | null>;

    async getStoredAnimeInfo(): Promise<StoredAnimeInfo> {
        return await this.state.getStoredAnimeInfo(await this.getAnimeIdentifier());
    }

    async getAnimeUID(forceSearch?: boolean): Promise<string | null> {
        const animeInfo = await this.getStoredAnimeInfo();
        if (animeInfo.uid && !forceSearch)
            return animeInfo.uid;

        const query = await this.getAnimeSearchQuery();
        const results = await this.state.searchAnime(query);
        if (!results) return null;

        const uid = results[0].anime.uid;
        animeInfo.uid = uid;

        return uid;
    }

    async getAnime(): Promise<AnimeInfo | null> {
        let uid = await this.getAnimeUID();
        if (!uid) return null;

        try {
            return await this.state.getAnimeInfo(uid);
        } catch (e) {
            if (e.name === GrobberErrorType.UidUnknown) {
                console.warn("Grobber didn't recognise uid, updating...");
                uid = await this.getAnimeUID(true);

                try {
                    return await this.state.getAnimeInfo(uid);
                } catch (e) {
                    console.error("didn't work rip", e);
                }
            }

            return null;
        }
    }

    abstract async canSetAnimeProgress(): Promise<boolean>;

    abstract async setAnimeProgress(progress: number): Promise<boolean>;

    abstract async getEpisodeURL(episodeIndex: number): Promise<string>;

    abstract async showEpisode(episodeIndex: number);

    abstract async getEpisodesWatched(): Promise<number | null>;

    abstract async getEpisodeCount(): Promise<number | null>;

    abstract async injectContinueWatchingButton(element: Element);

    async showContinueWatchingButton() {
        const el = document.createElement("div");

        reactRenderWithTheme(
            React.createElement(ContinueWatchingButton, {animePage: this}),
            getThemeFor(this.state.serviceId),
            el
        );

        await this.injectContinueWatchingButton(el);
    }

    async load() {
        await this.showContinueWatchingButton();
    }
}