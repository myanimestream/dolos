/**
 * @module common
 */

/** @ignore */

import {getThemeFor} from "dolos/theme";
import {reactRenderWithTheme} from "dolos/utils";
import {ReactNode} from "react";
import {Observable} from "rxjs";
import {ElementMemory} from "../memory";
import {Config} from "../models";
import {Identifier, ReadObservable, store} from "../store";
import {Service} from "./service";
import {ServicePage} from "./service-page";

/**
 * State handler for services.
 */
export class State<T extends Service> extends ElementMemory {
    public readonly serviceID: string;
    public readonly config$: ReadObservable<Config>;

    public page?: ServicePage<T>;

    constructor(serviceID: string) {
        super();
        this.serviceID = serviceID;

        this.config$ = store.getConfig$();
    }

    /**
     * Reset state and reload current service page.
     */
    public async reload() {
        this.resetState();
        const page = this.page;
        if (page) await page.reload();
    }

    /**
     * Reset the state.
     *
     * This resets the state memory and removes all injected elements.
     */
    public resetState() {
        this.removeInjected();
        this.resetMemory();
    }

    /**
     * Load a page.
     *
     * @param page - Page to load. If no page is given, the current one
     * is unloaded.
     */
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
     *
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
    public getAnimeID$(mediumID$: Observable<string>): Observable<Identifier> {
        return store.getID$(this.serviceID, mediumID$);
    }
}

/**
 * Object that has access to a state.
 */
export interface HasState<T extends Service> {
    state: State<T>;
}

/**
 * Decorator which caches the result of a method in the state cache so that
 * it's globally available.
 * @see [[cacheInMemory]]
 */
export function cacheInStateMemory(name?: string, isSync?: boolean) {
    return (target: object & HasState<any>, propertyKey: string, descriptor: PropertyDescriptor) => {
        const keyName = name || `${target.constructor.name}-${propertyKey}`;
        const func = descriptor.value;

        descriptor.value = function(this: HasState<any>) {
            const memory = this.state.memory;
            if (memory === undefined)
                throw new Error("No memory found");

            let value;
            if (keyName in memory) {
                value = memory[keyName];
            } else {
                value = func.apply(this);

                Promise.resolve(value)
                    .then(val => this.state.remember(keyName, val))
                    .catch(console.error);
            }

            if (isSync) return value;
            else return Promise.resolve(value);
        };
    };
}
