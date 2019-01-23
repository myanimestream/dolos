/**
 * @module common
 */

import {AnimeInfo} from "dolos/grobber";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {ElementMemory} from "../memory";
import {Config, StoredAnimeInfo} from "../models";
import Store from "../store";
import Service from "./service";
import ServicePage from "./service-page";

/**
 * State handler for services.
 */
export default class State<T extends Service> extends ElementMemory {
    serviceId: string;
    page?: ServicePage<T>;

    constructor(service_id: string) {
        super();
        this.serviceId = service_id;
    }

    // noinspection JSMethodCanBeStatic
    get config(): Promise<Config> {
        return Store.getConfig();
    }

    async reload() {
        this.resetState();
        const page = this.page;
        if (page) {
            await page.reload();
        }
    }

    resetState() {
        this.removeInjected();
        this.resetMemory();
    }

    async loadPage(page?: ServicePage<T>) {
        if (this.page) {
            try {
                const override = await this.page.transitionTo(page);
                if (override) page = override;
            } catch (e) {
                console.error("Couldn't transition from page", this.page, "to", page);
                throw e;
            }
        } else if (page) {
            try {
                await page.load();
            } catch (e) {
                console.error("Couldn't load page", page);
                throw e;
            }
        }

        this.page = page;
    }

    async getStoredAnimeInfo(identifier: string): Promise<StoredAnimeInfo> {
        return await Store.getStoredAnimeInfo(this.serviceId, identifier);
    }

    /**
     * Get an observable which keeps track of whether the user is subscribed to the Anime
     * It immediately pushes the current state to the observer.
     */
    async getSubscribed$(identifier: string): Promise<Observable<boolean>> {
        const subscribed = await Store.getSubscribedAnimes();
        return subscribed.value$.pipe(map(sub => identifier in sub));
    }

    async subscribeAnime(identifier: string, animeURL: string, nextEpisodeURL: string, episodesWatched: number, anime: AnimeInfo): Promise<void> {
        const subscribed = await Store.getSubscribedAnimes();
        subscribed[identifier] = {
            serviceID: this.serviceId,
            anime,
            identifier,
            episodesWatched,
            animeURL,
            nextEpisodeURL,
        };
    }

    // noinspection JSMethodCanBeStatic
    async unsubscribeAnime(identifier: string): Promise<void> {
        const subscribed = await Store.getSubscribedAnimes();
        delete subscribed[identifier];
    }
}

export interface HasState<T extends Service = any> {
    state: State<T>
}

/**
 * Decorator which caches the result of a method in the state cache so that it's globally available.
 * @see [[cacheInMemory]]
 */
export function cacheInStateMemory(name?: string) {
    return function (target: Object & HasState, propertyKey: string, descriptor: PropertyDescriptor) {
        const keyName = name || `${target.constructor.name}-${propertyKey}`;
        const func = descriptor.value;
        let returnPromise: boolean;

        descriptor.value = function () {
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