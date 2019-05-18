/**
 * @module common
 */

import {ElementMemory} from "dolos/memory";
import {Service} from "./service";
import {State} from "./state";

/**
 * A ServicePage represents a page of a service.
 */
export abstract class ServicePage<T extends Service> extends ElementMemory {
    public service: T;
    public state: State<T>;
    /**
     * ServicePages which are running as a child
     * of the current page.
     */
    public backgroundPages: Map<any, ServicePage<T>>;

    private loaded: boolean;

    protected constructor(service: T) {
        super();
        this.service = service;
        this.state = service.state;
        this.backgroundPages = new Map();

        this.loaded = false;
    }

    /**
     * Load the service page and all background pages.
     * This is a no-op if the page
     * is already loaded.
     */
    public async load(): Promise<void> {
        if (this.loaded) return;

        const pageLoad = this._load();
        const backgroundLoad = this.loadBackgroundPages();

        await Promise.all([pageLoad, backgroundLoad]);
        this.loaded = true;
    }

    /**
     * Load all background pages.
     *
     * @see [[load]] which also loads the service page.
     */
    public async loadBackgroundPages(): Promise<void> {
        await Promise.all(Array.from(this.backgroundPages.values(), page => page.load()));
    }

    /**
     * Unload the service page and all its background pages.
     * This is a no-op if the service page isn't loaded,
     * i.e. [[ServicePage.loaded]] is false.
     */
    public async unload(): Promise<void> {
        if (!this.loaded) return;

        const pageUnload = this._unload();
        const backgroundUnload = this.unloadBackgroundPages();

        await Promise.all([pageUnload, backgroundUnload]);

        this.resetPage();
        this.loaded = false;
    }

    /**
     * Unload all background pages.
     *
     * @see [[unload]] which also unloads the service page itself.
     */
    public async unloadBackgroundPages(): Promise<void> {
        await Promise.all(Array.from(this.backgroundPages.values(), page => page.unload()));
    }

    /**
     * Reset the page.
     *
     * This resets the page memory and removes all injected elements.
     */
    public resetPage(): void {
        this.resetMemory();
        this.removeInjected();
    }

    /**
     * Reload the service page.
     */
    public async reload(): Promise<void> {
        await this.unload();
        await this.load();
    }

    /**
     * Transition to the given service page.
     *
     * @param page - Service page to transition to or undefined to just unload
     * the service page.
     */
    public async transitionTo(page?: ServicePage<T>): Promise<ServicePage<T> | undefined> {
        await this.unload();

        if (page) await page.load();

        return undefined;
    }

    /**
     * Get a background page.
     *
     * @param id - Id of the background page.
     */
    public getBackgroundPage(id: any): ServicePage<T> | undefined {
        return this.backgroundPages.get(id);
    }

    /**
     * Register a new background page.
     *
     * @param page - Service page to register as a background page.
     * @param id - Background page id which can be used to retrieve the
     * page using [[getBackgroundPage]].
     */
    public registerBackgroundPage(page: ServicePage<T>, id: any): void {
        this.backgroundPages.set(id, page);
    }

    protected abstract async _load(): Promise<void>;

    protected async _unload(): Promise<void> {
    }
}
