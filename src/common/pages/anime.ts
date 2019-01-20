import {AnimeInfo, GrobberClient, GrobberErrorType} from "dolos/grobber";
import {StoredAnimeInfo} from "dolos/models";
import {getThemeFor} from "dolos/theme";
import {reactRenderWithTheme} from "dolos/utils";
import * as React from "react";
import * as rxjs from "rxjs";
import {cacheInMemory} from "../../memory";
import {ContinueWatchingButton} from "../components";
import Service from "../service";
import ServicePage from "../service-page";
import EpisodePage from "./episode";


export default abstract class AnimePage<T extends Service> extends ServicePage<T> {
    private _episodesWatched$?: rxjs.BehaviorSubject<number | null>;

    abstract async getAnimeSearchQuery(): Promise<string | null>;

    abstract async getAnimeIdentifier(): Promise<string | null>;

    async getStoredAnimeInfo(): Promise<StoredAnimeInfo> {
        const identifier = await this.getAnimeIdentifier();
        if (!identifier)
            throw new Error("No anime identifier returned!");

        return await this.state.getStoredAnimeInfo(identifier);
    }

    async getAnimeUID(forceSearch?: boolean): Promise<string | null> {
        const animeInfo = await this.getStoredAnimeInfo();
        if (animeInfo.uid && !forceSearch)
            return animeInfo.uid;

        const query = await this.getAnimeSearchQuery();
        const results = await GrobberClient.searchAnime(query);
        if (!results) return null;

        const uid = results[0].anime.uid;
        animeInfo.uid = uid;

        return uid;
    }

    async setAnimeUID(uid: string) {
        const animeInfo = await this.getStoredAnimeInfo();
        animeInfo.uid = uid;
        await this.reload();
    }

    @cacheInMemory("anime")
    async getAnime(): Promise<AnimeInfo | null> {
        let uid = await this.getAnimeUID();
        if (!uid) return null;

        try {
            return await GrobberClient.getAnimeInfo(uid);
        } catch (e) {
            if (e.name === GrobberErrorType.UidUnknown) {
                console.warn("Grobber didn't recognise uid, updating...");
                uid = await this.getAnimeUID(true);

                try {
                    return await GrobberClient.getAnimeInfo(uid);
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

    async _load() {
        await this.showContinueWatchingButton();
    }

    async transitionTo(page?: ServicePage<T>): Promise<ServicePage<T> | void> {
        if (page instanceof AnimePage) {
            const [thisID, otherID] = await Promise.all([this.getAnimeIdentifier(), page.getAnimeIdentifier()]);
            if (thisID === otherID) return this;
        } else if (page instanceof EpisodePage) {
            page.animePage = this;
            await page.load();
            return;
        }

        await super.transitionTo(page);
    }
}