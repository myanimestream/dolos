import Service from "./service";
import State from "./state";

export default abstract class ServicePage<T extends Service> {
    service: T;
    state: State<T>;

    constructor(service: T) {
        this.service = service;
        this.state = service.state;
    }

    abstract async load();

    async unload() {
        this.state.resetPage();
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