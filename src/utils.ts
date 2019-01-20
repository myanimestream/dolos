import {Theme} from "@material-ui/core/styles/createMuiTheme";
import MuiThemeProvider from "@material-ui/core/styles/MuiThemeProvider";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as rxjs from "rxjs";
import {SentryLogger} from "./logging";

interface BackgroundWindow extends Window {
    hasNewVersion$: rxjs.Subject<boolean>;
}

export async function getBackgroundWindow(): Promise<BackgroundWindow> {
    // @ts-ignore
    return await new Promise((res, rej) =>
        chrome.runtime.getBackgroundPage(window => {
            if (window) res(window);
            else rej(new Error("background page not found"));
        })
    );
}

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

export async function waitWithTimeout<T>(promise: PromiseLike<T>, timeout: number): Promise<T | null> {
    const timeoutPromise: Promise<null> = new Promise(res => setTimeout(() => res(null), timeout));
    return await Promise.race([promise, timeoutPromise]);
}

export function wrapSentryLogger(component: React.ReactNode): React.ReactNode {
    // @ts-ignore
    return React.createElement(SentryLogger, {}, component);
}

export function reactRenderWithTheme(component: React.ReactNode, theme: Theme, renderTarget: Element) {
    // @ts-ignore
    const wrapped = React.createElement(MuiThemeProvider, {theme}, component);
    ReactDOM.render(wrapped, renderTarget);
}

export interface Type<T> extends Function {
    new(...args: any[]): T;
}