import * as React from "react";
import * as rxjs from "rxjs";
import {StoredAnimeInfo} from "../../models";
import {getThemeFor} from "../../theme";
import {reactRenderWithTheme} from "../../utils";
import {ContinueWatchingButton} from "../components";
import {AnimeInfo, GrobberErrorType} from "../models";
import Service from "../service";
import ServicePage from "../service-page";
import {cacheInStateMemory} from "../state";


export default abstract class AnimePage<T extends Service> extends ServicePage<T> {
    private _episodesWatched$?: rxjs.BehaviorSubject<number | null>;

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

    @cacheInStateMemory("anime", "anime")
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

    abstract async canSetEpisodesWatched(): Promise<boolean>;

    abstract async _setEpisodesWatched(progress: number): Promise<boolean>;

    abstract async getEpisodeURL(episodeIndex: number): Promise<string>;

    abstract async showEpisode(episodeIndex: number);

    abstract async getEpisodesWatched(): Promise<number | null>;

    abstract async getEpisodeCount(): Promise<number | null>;

    abstract async injectContinueWatchingButton(element: Element);

    async setEpisodesWatched(progress: number): Promise<boolean> {
        const success = await this._setEpisodesWatched(progress);
        if (success) (await this.getEpisodesWatched$()).next(progress);

        return success;
    }

    async getEpisodesWatched$(): Promise<rxjs.BehaviorSubject<number | null>> {
        if (!this._episodesWatched$) {
            const episodesWatched = await this.getEpisodesWatched();
            this._episodesWatched$ = new rxjs.BehaviorSubject(episodesWatched);
        }

        return this._episodesWatched$;
    }

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