/**
 * @module common.pages
 */

import SubscriptionToggle from "dolos/common/components/SubscriptionToggle";
import {AnimeInfo, GrobberClient, GrobberErrorType} from "dolos/grobber";
import {StoredAnimeInfo} from "dolos/models";
import {getThemeFor} from "dolos/theme";
import {reactRenderWithTheme} from "dolos/utils";
import * as React from "react";
import * as rxjs from "rxjs";
import {Observable} from "rxjs";
import {cacheInMemory} from "../../memory";
import {ContinueWatchingButton} from "../components";
import Service from "../service";
import ServicePage from "../service-page";
import EpisodePage from "./episode";

/**
 * AnimePage reflects a page that is dedicated to a specific Anime.
 *
 * It displays a continue watching button.
 */
export default abstract class AnimePage<T extends Service> extends ServicePage<T> {
    private _episodesWatched$?: rxjs.BehaviorSubject<number | undefined>;

    /**
     * Get the search query to be used for Grobber's search endpoint.
     * @return `undefined` if there is no search query.
     */
    abstract async getAnimeSearchQuery(): Promise<string | undefined>;

    /**
     * Get a unique identifier for this anime.
     */
    abstract async getAnimeIdentifier(): Promise<string | undefined>;

    /**
     * Get the information stored in the browser storage.
     *
     * @throws if [[AnimePage.getAnimeIdentifier]] didn't return an identifier
     */
    async getStoredAnimeInfo(): Promise<StoredAnimeInfo> {
        const identifier = await this.getAnimeIdentifier();
        if (!identifier)
            throw new Error("No anime identifier returned!");

        return await this.state.getStoredAnimeInfo(identifier);
    }

    /**
     * Get the UID of the Anime.
     * This method will return the stored UID (if available) unless `forceSearch` is true.
     *
     * @param forceSearch - Ignore the stored UID.
     *
     * @return `undefined` if there were no results or the [[AnimePage.getAnimeSearchQuery]] was empty
     */
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

    /**
     * Set the UID associated with the [[AnimePage.getAnimeIdentifier]] identifier.
     * **This will cause the [[AnimePage]] to be reloaded!**
     */
    async setAnimeUID(uid: string) {
        const animeInfo = await this.getStoredAnimeInfo();
        animeInfo.uid = uid;
        await this.reload();
    }

    /**
     * Get the [[AnimeInfo]] for this page.
     */
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

    async getSubscribed$(): Promise<Observable<boolean> | undefined> {
        const identifier = await this.getAnimeIdentifier();
        if (!identifier) return;

        return await this.state.getSubscribed$(identifier);
    }

    async subscribeAnime(): Promise<boolean> {
        let [identifier, animeURL, episodesWatched, anime] = await Promise.all([
            this.getAnimeIdentifier(), this.getAnimeURL(), this.getEpisodesWatched(), this.getAnime()
        ]);


        if (!(identifier && animeURL && anime)) {
            return false;
        }

        episodesWatched = episodesWatched || 0;
        const nextEpisodeURL = await this.getEpisodeURL(episodesWatched);

        await this.state.subscribeAnime(identifier, animeURL, nextEpisodeURL, episodesWatched, anime);
        return true;
    }

    async unsubscribeAnime(): Promise<boolean> {
        const identifier = await this.getAnimeIdentifier();
        if (!identifier) return false;

        await this.state.unsubscribeAnime(identifier);
        return true;
    }

    /**
     * Sanity check whether it should be possible to set the "progress" of an Anime.
     */
    abstract async canSetEpisodesWatched(): Promise<boolean>;

    /**
     * @private
     *
     * Internal progress setting. **Do not use this method**!
     * @see [[AnimePage.setEpisodesWatched]] instead!
     */
    abstract async _setEpisodesWatched(progress: number): Promise<boolean>;

    abstract async getAnimeURL(): Promise<string | undefined>;

    abstract async getEpisodeURL(episodeIndex: number): Promise<string>;

    /**
     * Navigate the user to the episode with the given index.
     */
    abstract async showEpisode(episodeIndex: number): Promise<void>;

    abstract async getEpisodesWatched(): Promise<number | undefined>;

    abstract async getEpisodeCount(): Promise<number | undefined>;

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

    /**
     * Inject the continue watching button.
     */
    abstract async injectContinueWatchingButton(element: Element): Promise<void>;

    /**
     * Build and inject a continue watching button into the site.
     */
    async showContinueWatchingButton() {
        const el = document.createElement("div");

        reactRenderWithTheme(
            React.createElement(ContinueWatchingButton, {animePage: this}),
            getThemeFor(this.state.serviceId),
            el
        );

        await this.injectContinueWatchingButton(el);
    }

    /**
     * Inject the subscribe button.
     */
    abstract async injectSubscribeButton(element: Element): Promise<void>;

    async showSubscribeButton() {
        const el = document.createElement("div");

        reactRenderWithTheme(
            React.createElement(SubscriptionToggle, {animePage: this}),
            getThemeFor(this.state.serviceId),
            el
        );

        await this.injectSubscribeButton(el);
    }

    async _load() {
        await Promise.all([
            this.showContinueWatchingButton(),
            this.showSubscribeButton()
        ]);
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