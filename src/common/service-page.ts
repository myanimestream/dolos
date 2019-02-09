/**
 * @module common
 */

import {ElementMemory} from "dolos/memory";
import Service from "./service";
import State from "./state";

export default abstract class ServicePage<T extends Service> extends ElementMemory {
    public service: T;
    public state: State<T>;

    private loaded: boolean;

    protected constructor(service: T) {
        super();
        this.service = service;
        this.state = service.state;

        this.loaded = false;
    }

    public abstract async _load(): Promise<void>;

    public async load(): Promise<void> {
        if (this.loaded) return;

        await this._load();
        this.loaded = true;
    }

    public async _unload(): Promise<void> {
        this.resetPage();
    }

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
}
