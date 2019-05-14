/**
 * @module common
 */

/** @ignore */

import {getThemeFor} from "dolos/theme";
import {reactRenderWithTheme} from "dolos/utils";
import {ReactNode} from "react";
import {Observable} from "rxjs";
import {first} from "rxjs/operators";
import {ElementMemory} from "../memory";
import {Config} from "../models";
import {Identifier, ReadObservable, store} from "../store";
import Service from "./service";
import ServicePage from "./service-page";

/**
 * State handler for services.
 */
export default class State<T extends Service> extends ElementMemory {
    public readonly serviceID: string;
    public readonly config$: ReadObservable<Config>;

    public page?: ServicePage<T>;

    private _config?: Readonly<Config>;

    constructor(serviceID: string) {
        super();
        this.serviceID = serviceID;

        this.config$ = store.getConfig$();
    }

    get config(): Promise<Config> {
        if (this._config !== undefined)
            return Promise.resolve(this._config);

        this.config$.subscribe(config => this._config = config);
        return this.config$.pipe(first()).toPromise();
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

    /**
     * Render a given react node with the appropriate theme for this service.
     * @param element - Element to render
     * @param tag - Tag to render element to.
     */
    public renderWithTheme(element: ReactNode, tag: keyof HTMLElementTagNameMap | Element = "div"): Element {
        const el = (tag instanceof Element) ? tag : document.createElement(tag);

        reactRenderWithTheme(element, getThemeFor(this.serviceID), el);

        return el;
    }

    /**
     * Get an observable for an identifier.
     */
    public getID$(mediumID$: Observable<string>): Observable<Identifier> {
        return store.getID$(this.serviceID, mediumID$);
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
