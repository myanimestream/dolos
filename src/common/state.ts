/**
 * @module common
 */

import {AnimeInfo} from "dolos/grobber";
import {getThemeFor} from "dolos/theme";
import {reactRenderWithTheme} from "dolos/utils";
import * as React from "react";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {ElementMemory} from "../memory";
import {AnimeSubscriptionInfo, Config, StoredAnimeInfo} from "../models";
import Store from "../store";
import Service from "./service";
import ServicePage from "./service-page";

/**
 * State handler for services.
 */
export default class State<T extends Service> extends ElementMemory {
    public serviceId: string;
    public page?: ServicePage<T>;

    constructor(serviceID: string) {
        super();
        this.serviceId = serviceID;
    }

    // noinspection JSMethodCanBeStatic
    get config(): Promise<Config> {
        return Store.getConfig();
    }

    /**
     * Reset state and reload current service page.
     */
    public async reload() {
        this.resetState();
        const page = this.page;
        if (page) {
            await page.reload();
        }
    }

    public resetState() {
        this.removeInjected();
        this.resetMemory();
    }

    public async loadPage(page?: ServicePage<T>) {
        if (this.page) {
            try {
                const override = await this.page.transitionTo(page);
                if (override) page = override;
            } catch (e) {
                console.error("Couldn't transition from page", this.page, "to", page, "because", e);
                throw e;
            }
        } else if (page) {
            try {
                await page.load();
            } catch (e) {
                console.error("Couldn't load page", page, "because", e);
                throw e;
            }
        }

        this.page = page;
    }

    public renderWithTheme(element: React.ReactNode, tag: keyof HTMLElementTagNameMap | Element = "div"): Element {
        const el = (tag instanceof Element) ? tag : document.createElement(tag);

        reactRenderWithTheme(element, getThemeFor(this.serviceId), el);

        return el;
    }

    /**
     * Get the stored [[StoredAnimeInfo]] for the provided identifier.
     * The returned value is a StorageObject and thus can be used to alter
     * the stored version directly.
     *
     * Even if nothing is stored, this method still returns an instance of [[StoredAnimeInfo]]
     * which you may use to write to.
     */
    public async getStoredAnimeInfo(animeID: string): Promise<StoredAnimeInfo> {
        return await Store.getStoredAnimeInfo(this.serviceId, animeID, await this.config);
    }

    /**
     * Build an identifier for the given MediaID.
     *
     * @see [[STATIC_STORE.buildIdentifier]]
     */
    public async buildIdentifier(mediaID: string): Promise<string> {
        return await Store.buildIdentifier(this.serviceId, mediaID, await this.config);
    }

    /**
     * Get the [[AnimeSubscriptionInfo]] for an Anime.
     * The returned value is a [[StoreElementProxy]].
     */
    public async getSubscription(animeID: string): Promise<AnimeSubscriptionInfo | undefined> {
        const [subscriptions, identifier] = await Promise.all([
            Store.getAnimeSubscriptions(),
            this.buildIdentifier(animeID),
        ]);

        return subscriptions[identifier];
    }

    /**
     * Get an observable which keeps track of whether the user is subscribed to the Anime
     * It immediately pushes the current state to the observer.
     */
    public async getSubscribed$(animeID: string): Promise<Observable<boolean>> {
        const subscriptions = await Store.getAnimeSubscriptions();
        const identifier = await this.buildIdentifier(animeID);

        return subscriptions.value$.pipe(map(sub => identifier in sub));
    }

    /** Subscribe to an Anime */
    public async subscribeAnime(animeID: string,
                                animeURL: string,
                                nextEpisodeURL: string | undefined,
                                episodesWatched: number,
                                anime: AnimeInfo): Promise<void> {
        const subscriptions = await Store.getAnimeSubscriptions();
        const identifier = await this.buildIdentifier(animeID);

        subscriptions[identifier] = {
            anime,
            animeURL,
            episodesWatched,
            identifier,
            nextEpisodeURL,
            serviceID: this.serviceId,
        };
    }

    /** Unsubscribe from Anime */
    // noinspection JSMethodCanBeStatic
    public async unsubscribeAnime(animeID: string): Promise<void> {
        const subscriptions = await Store.getAnimeSubscriptions();
        const identifier = await this.buildIdentifier(animeID);

        delete subscriptions[identifier];
    }
}

export interface HasState<T extends Service = any> {
    state: State<T>;
}

/**
 * Decorator which caches the result of a method in the state cache so that it's globally available.
 * @see [[cacheInMemory]]
 */
export function cacheInStateMemory(name?: string) {
    return (target: object & HasState, propertyKey: string, descriptor: PropertyDescriptor) => {
        const keyName = name || `${target.constructor.name}-${propertyKey}`;
        const func = descriptor.value;
        let returnPromise: boolean;

        descriptor.value = function(this: HasState) {
            const memory = this.state.memory;
            if (memory === undefined)
                throw new Error("No memory found");

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
