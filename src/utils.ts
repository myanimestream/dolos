/**
 * Utility functions for Dolos.
 * These are some miscellaneous functions that didn't really fit anywhere else.
 *
 * @module utils
 */

/** @ignore */

import {MuiThemeProvider, Theme} from "@material-ui/core/styles";
import {ThemeProvider} from "@material-ui/styles";
import axios from "axios";
import {NewEpisodeEvent} from "dolos/background/update-check";
import {GrobberClient} from "dolos/grobber";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {BehaviorSubject, Subject} from "rxjs";
import {SentryLogger} from "./logging";

/**
 * BackgroundWindow interface with all of its attributes.
 */
interface BackgroundWindow extends Window {
    hasNewVersion$: BehaviorSubject<boolean>;
    hasNewEpisode$: Subject<NewEpisodeEvent>;

    backgroundGrobberClient: GrobberClient;
}

/**
 * Get access to the extension's background window.
 */
export async function getBackgroundWindow(): Promise<BackgroundWindow> {
    if (!chrome.runtime.getBackgroundPage)
        throw new Error("Cannot access background page from the current context!");

    return await new Promise((res: (window?: Window) => void) => chrome.runtime.getBackgroundPage(res))
        .then(window => {
            if (window) return window as BackgroundWindow;
            else throw new Error("background page not found");
        });
}

/**
 * Wait for an Element to exist in the DOM.
 *
 * @param selector - CSS selector to wait for
 * @param target - Node from which to use the selector. Defaults to document
 */
export function waitUntilExists(selector: string, target?: Node & ParentNode): Promise<Element> {
    const targetEl = target || document;

    return new Promise(res => {
        const check = (observer: MutationObserver) => {
            const el = targetEl.querySelector(selector);
            if (el) {
                observer.disconnect();
                res(el);
            }
        };

        const o = new MutationObserver((_, observer) => check(observer));
        o.observe(targetEl, {childList: true, subtree: true});

        check(o);
    });
}

/**
 * Apply a timeout to a promise.
 *
 * @param timeout - Timeout in milliseconds
 * @return The result of promise or undefined if it timed out
 */
export async function waitWithTimeout<T>(promise: PromiseLike<T>, timeout: number): Promise<T | undefined> {
    const timeoutPromise: Promise<undefined> = new Promise(res => setTimeout(() => res(undefined), timeout));
    return await Promise.race([promise, timeoutPromise]);
}

/**
 * Options passed to [[retryUntil]] function.
 */
export interface RetryUntilOptions<T> {
    /**
     * Time in milliseconds that needs to pass before the next attempt is started.
     * The time is counted before an attempt is started!
     */
    interval: number;
    /**
     * Time in milliseconds after which to abort.
     */
    timeout?: number;
    catchErrors?: boolean;
    /**
     * Exit condition is called after every attempt unless an error was caught
     * with [[RetryUntilOptions.catchErrors]].
     */
    condition?: (value: T, attempt: number) => boolean | PromiseLike<boolean>;
}

/**
 * Re-run a function until the return value meets the condition.
 *
 * @param func - may take the number of attempts that preceded it (counting up from 0)
 */
export async function retryUntil<T>(
    func: (attempt: number) => T | PromiseLike<T>,
    opts: RetryUntilOptions<T>,
): Promise<T | undefined> {
    const condition = opts.condition || (val => Boolean(val));

    let running = true;
    let attempt = 0;

    async function runner() {
        while (running) {
            const delay = new Promise(resolve => setTimeout(resolve, opts.interval));

            // use a separate flag because the res might be undefined intentionally!
            let gotRes = false;
            let res: T | undefined;

            try {
                res = await Promise.resolve(func(attempt));
                gotRes = true;
            } catch (e) {
                if (!opts.catchErrors) throw e;
            }

            if (gotRes && await Promise.resolve(condition(res as T, attempt)))
                return res;

            attempt += 1;
            await delay;
        }
        return undefined;
    }

    let result;
    if (opts.timeout)
        result = await waitWithTimeout(runner(), opts.timeout);
    else
        result = await runner();

    running = false;
    return result;
}

/**
 * Wrap a React node with a Sentry logger which catches errors and displays a message
 * to the user.
 *
 * @see [[SentryLogger]]
 */
export function wrapSentryLogger(component: React.ReactNode): React.ReactNode {
    return React.createElement(SentryLogger, {}, component);
}

/**
 * Apply a theme to a React node.
 *
 * This wraps the provided node with both the modern [[ThemeProvider]] and
 * the old [[MuiThemeProvider]].
 *
 * @see [[reactRenderWithTheme]] to render the result to an element.
 */
export function wrapWithTheme(component: React.ReactNode, theme: Theme): React.ReactElement<any> {
    // @ts-ignore
    let wrapper = React.createElement(ThemeProvider, {theme}, component);
    // @ts-ignore
    wrapper = React.createElement(MuiThemeProvider, {theme}, wrapper);

    return wrapper;
}

/**
 * Apply a theme to a React node and render it to renderTarget
 */
export function reactRenderWithTheme(component: React.ReactNode, theme: Theme, renderTarget: Element) {
    ReactDOM.render(wrapWithTheme(component, theme), renderTarget);
}

/**
 * Type of a constructor which, when used, returns an instance of T.
 *
 * @example
 * ```typescript
 *
 * // declare a function which constructs a URL from a href using a constructor.
 * function createURL(href: string, constructor: Type<URL>): URL {
 *     return new URL(href);
 * }
 * ```
 */
export type Type<T> = new(...args: any[]) => T;

/**
 * Download the data and return a url pointing to it.
 */
export async function getBlobURL(url: string): Promise<string> {
    const resp = await axios.get(url, {responseType: "blob"});
    return URL.createObjectURL(resp.data);
}

/**
 * Serialise an error so that it can persist outside
 * of the Javascript environment.
 *
 * @see [[unmarshalError]] to recreate an Error
 */
export function marshalError(error: Error): string {
    return JSON.stringify(error, Object.getOwnPropertyNames(error));
}

/**
 * Build an error from a marshalled representation.
 *
 * This creates an error of type `Error`, **custom errors
 * are not supported** and `instanceof` checks should not be used.
 * Instead use the [[Error.name]] property to distinguish between
 * error types!
 *
 * @see [[marshalError]] to marshal an error.
 */
export function unmarshalError(error: string): Error {
    const rawError = JSON.parse(error);
    if (!rawError)
        throw new Error(`Couldn't recreate error from: ${error}`);

    return Object.assign(new Error(), rawError);
}

export async function promisifyCallback<T extends any>(func: (callback: (arg: T) => void) => void): Promise<T>;
export async function promisifyCallback<T extends any[]>(func: (callback: (...args: T) => void) => void): Promise<T>;
/**
 * Convert a function which takes a callback to a Promise.
 */
export async function promisifyCallback<T extends any[]>(func: (callback: (...args: T) => void) => void): Promise<T> {
    const receiver = (...args: T) => {
        if (args.length === 1)
            return args[0];
        else
            return args;
    };

    return new Promise((res: (args: T) => void) => {
        func((...args) => res(receiver(...args)));
    });
}
