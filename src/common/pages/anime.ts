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
    private _episodesWatched$?: rxjs.BehaviorSubject<number | undefined>;

    abstract async getAnimeSearchQuery(): Promise<string | undefined>;

    abstract async getAnimeIdentifier(): Promise<string | undefined>;

    async getStoredAnimeInfo(): Promise<StoredAnimeInfo> {
        const identifier = await this.getAnimeIdentifier();
        if (!identifier)
            throw new Error("No anime identifier returned!");

        return await this.state.getStoredAnimeInfo(identifier);
    }

    async getAnimeUID(forceSearch?: boolean): Promise<string | undefined> {
        const animeInfo = await this.getStoredAnimeInfo();
        if (animeInfo.uid && !forceSearch)
            return animeInfo.uid;

        const query = await this.getAnimeSearchQuery();
        if (!query)
            return;

        const results = await GrobberClient.searchAnime(query);
        if (!results) return;

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
    async getAnime(): Promise<AnimeInfo | undefined> {
        let uid = await this.getAnimeUID();
        if (!uid) return;

        try {
            return await GrobberClient.getAnimeInfo(uid);
        } catch (e) {
            if (e.name === GrobberErrorType.UidUnknown) {
                console.warn("Grobber didn't recognise uid, updating...");
                uid = await this.getAnimeUID(true);
                if (!uid)
                    return;

                try {
                    return await GrobberClient.getAnimeInfo(uid);
                } catch (e) {
                    console.error("didn't work rip", e);
                }
            }

            return;
        }
    }

    abstract async canSetEpisodesWatched(): Promise<boolean>;

    abstract async _setEpisodesWatched(progress: number): Promise<boolean>;

    abstract async getEpisodeURL(episodeIndex: number): Promise<string>;

    abstract async showEpisode(episodeIndex: number): Promise<void>;

    abstract async getEpisodesWatched(): Promise<number | undefined>;

    abstract async getEpisodeCount(): Promise<number | undefined>;

    abstract async injectContinueWatchingButton(element: Element): Promise<void>;

    async setEpisodesWatched(progress: number): Promise<boolean> {
        const success = await this._setEpisodesWatched(progress);
        if (success) (await this.getEpisodesWatched$()).next(progress);

        return success;
    }

    async getEpisodesWatched$(): Promise<rxjs.BehaviorSubject<number | undefined>> {
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