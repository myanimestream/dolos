import Memory from "./memory";
import Service from "./service";
import State from "./state";

export default abstract class ServicePage<T extends Service> extends Memory {
    service: T;
    state: State<T>;

    constructor(service: T) {
        super();
        this.service = service;
        this.state = service.state;
    }

    abstract async load();

    async unload() {
        this.state.resetPage();
        this.resetMemory();
    }

    async reload() {
        await this.unload();
        await this.load();
    }

    async transitionTo(page?: ServicePage<T>) {
        await this.unload();

        if (!page) return;

        try {
            await page.load();
        } catch (e) {
            console.error("Something went wrong while transitioning to service page", page, e);
        }
    }
}