import Service from "../service";
import State from "../state";

export default abstract class ServicePage {
    service: Service;
    state: State;

    constructor(service: Service) {
        this.service = service;
        this.state = service.state;
    }

    abstract async load();

    async unload() {
    }
}