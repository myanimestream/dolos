/**
 * @module common
 */

import {ElementMemory} from "dolos/memory";
import Service from "./service";
import State from "./state";

export default abstract class ServicePage<T extends Service> extends ElementMemory {
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
     * Load the service page.
     * This is a no-op if the page
     * is already loaded.
     */
    public async load(): Promise<void> {
        if (this.loaded) return;

        await this._load();
        this.loaded = true;
    }

    /**
     * Unload a service page.
     * This is a no-op if the service page isn't loaded,
     * i.e. [[ServicePage.loaded]] is false.
     */
    public async unload(): Promise<void> {
        if (!this.loaded) return;

        await this._unload();
        this.loaded = false;
    }

    public resetPage(): void {
        this.resetMemory();
        this.removeInjected();
    }

    public async reload(): Promise<void> {
        await this.unload();
        await this.load();
    }

    public async transitionTo(page?: ServicePage<T>): Promise<ServicePage<T> | undefined> {
        await this.unload();

        if (page)
            await page.load();

        return undefined;
    }

    public getBackgroundPage(id: any): ServicePage<T> | undefined {
        return this.backgroundPages.get(id);
    }

    public registerBackgroundPage(page: ServicePage<T>, id: any): void {
        this.backgroundPages.set(id, page);
    }

    protected abstract async _load(): Promise<void>;

    protected async _unload(): Promise<void> {
        await Promise.all(
            Array.from(this.backgroundPages.values())
                .map(page => page.unload()),
        );

        this.resetPage();
    }
}
