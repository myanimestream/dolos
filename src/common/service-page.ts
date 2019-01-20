import {ElementMemory} from "dolos/memory";
import Service from "./service";
import State from "./state";

export default abstract class ServicePage<T extends Service> extends ElementMemory {
    service: T;
    state: State<T>;

    private loaded: boolean;

    constructor(service: T) {
        super();
        this.service = service;
        this.state = service.state;

        this.loaded = false;
    }

    abstract async _load(): Promise<void>;

    async load() {
        if (this.loaded) return;

        await this._load();
        this.loaded = true;
    }

    async _unload() {
        this.resetPage();
    }

    async unload() {
        if (!this.loaded) return;

        await this._unload();
        this.loaded = false;
    }

    resetPage() {
        this.resetMemory();
        this.removeInjected();
    }

    async reload() {
        await this.unload();
        await this.load();
    }

    async transitionTo(page?: ServicePage<T>): Promise<ServicePage<T> | void> {
        await this.unload();

        if (!page) return;
        await page.load();
    }
}