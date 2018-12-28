import {Theme} from "@material-ui/core/styles/createMuiTheme";
import MuiThemeProvider from "@material-ui/core/styles/MuiThemeProvider";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {SentryLogger} from "./logging";

export function waitUntilExists(selector: string): Promise<Element> {
    return new Promise(res => {
        const check = (observer: MutationObserver) => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                res(el);
            }
        };

        const o = new MutationObserver((_, observer) => check(observer));
        o.observe(document.body, {childList: true, subtree: true});

        check(o);
    });
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