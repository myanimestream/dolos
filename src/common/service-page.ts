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
    }
}