/**
 * Utility functions for Dolos.
 *
 * @module utils
 */

/** @ignore */

import {MuiThemeProvider, Theme} from "@material-ui/core/styles";
import ThemeProvider from "@material-ui/styles/ThemeProvider";
import axios from "axios";
import {NewEpisodeEvent} from "dolos/background/update-check";
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
}

/**
 * Get access to the extension's background window.
 */
export async function getBackgroundWindow(): Promise<BackgroundWindow> {
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
 * Wrap a React node with a Sentry logger which tracks errors.
 * @see [[SentryLogger]]
 */
export function wrapSentryLogger(component: React.ReactNode): React.ReactNode {
    return React.createElement(SentryLogger, {}, component);
}

/**
 * Apply a theme to a React node and render it to renderTarget
 */
export function reactRenderWithTheme(component: React.ReactNode, theme: Theme, renderTarget: Element) {
    // @ts-ignore
    let wrapped = React.createElement(ThemeProvider, {theme}, component);
    // @ts-ignore
    wrapped = React.createElement(MuiThemeProvider, {theme}, wrapped);
    ReactDOM.render(wrapped, renderTarget);
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
export interface Type<T> extends Function {
    new(...args: any[]): T;
}

/**
 * Download the data and return a url pointing to it.
 */
export async function getBlobURL(url: string): Promise<string> {
    const resp = await axios.get(url, {responseType: "blob"});
    return URL.createObjectURL(resp.data);
}