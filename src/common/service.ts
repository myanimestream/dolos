/**
 * @module common
 */

import {SnackbarMessage, SnackbarQueue} from "dolos/common/components";
import {resolveSnackbarMessage} from "dolos/common/components/SnackbarQueue";
import {getThemeFor} from "dolos/theme";
import * as React from "react";
import {Subject} from "rxjs";
import {reactRenderWithTheme, Type} from "../utils";
import {AnimePage, EpisodePage} from "./pages";
import ServicePage from "./service-page";
import State from "./state";

export default abstract class Service {
    AnimePage: Type<AnimePage<this>>;
    EpisodePage: Type<EpisodePage<this>>;

    state: State<this>;

    snackbarMessage$: Subject<SnackbarMessage>;

    protected constructor(serviceID: string, animePage: Type<AnimePage<any>>, episodePage: Type<EpisodePage<any>>,) {
        this.state = new State(serviceID);

        this.snackbarMessage$ = new Subject();

        this.AnimePage = animePage;
        this.EpisodePage = episodePage;
    }

    abstract async route(url: URL): Promise<void>;

    async load(noRoute?: boolean) {
        const snackbar = await this.buildSnackbarQueue();

        await Promise.all([
            this.insertNoReferrerPolicy(),
            this.insertSnackbarQueue(snackbar),
        ]);

        if (!noRoute) await this.route(new URL(location.href));
    }

    // noinspection JSMethodCanBeStatic
    async insertNoReferrerPolicy(): Promise<void> {
        const temp = document.createElement("template");
        temp.innerHTML = `<meta name="referrer" content="never">`;
        const node = temp.content.firstElementChild;
        if (!node) throw new Error("Couldn't create template");

        document.head.appendChild(node);
        this.state.injected(node);
    }

    async buildSnackbarQueue(): Promise<Element> {
        const el = document.createElement("div");
        reactRenderWithTheme(
            React.createElement(SnackbarQueue, {
                snackbarMessage$: this.snackbarMessage$
            }),
            getThemeFor(this.state.serviceId),
            el
        );

        return el;
    }

    // noinspection JSMethodCanBeStatic
    async insertSnackbarQueue(snackbarQueue: Element): Promise<void> {
        document.body.appendChild(snackbarQueue);
    }

    buildServicePage<T extends ServicePage<any>>(cls: Type<T>, memory?: { [key: string]: any }): T {
        const page = new cls(this);
        if (memory) {
            for (let [key, value] of Object.entries(memory))
                page.remember(key, value);
        }

        return page;
    }

    /** Shortcut for [[Service.snackbarMessage$.next]] */
    showSnackbar(message: SnackbarMessage): void {
        this.snackbarMessage$.next(message);
    }

    /** Shortcut for [[Service.snackbarMessage$.next]] with variant error */
    showErrorSnackbar(message: string | SnackbarMessage): void {
        this.showSnackbar(resolveSnackbarMessage(message, "error"));
    }

    /** Shortcut for [[Service.snackbarMessage$.next]] with variant warning */
    showWarningSnackbar(message: string | SnackbarMessage): void {
        this.showSnackbar(resolveSnackbarMessage(message, "warning"));
    }


    async showAnimePage(memory?: { [key: string]: any }) {
        await this.state.loadPage(this.buildServicePage(this.AnimePage, memory));
    }


    async showEpisodePage(memory?: { [key: string]: any }) {
        await this.state.loadPage(this.buildServicePage(this.EpisodePage, memory));
    }
}