/**
 * @module common
 */

import {resolveSnackbarMessage, SnackbarMessage, SnackbarQueue} from "dolos/components";
import {createElement} from "react";
import {Subject} from "rxjs";
import {Type} from "../utils";
import {AnimePage, EpisodePage} from "./pages";
import {ServicePage} from "./service-page";
import {State} from "./state";

/**
 * Service acts as a router and a state manager for a service.
 */
export abstract class Service {
    public animePageType: Type<AnimePage<this>>;
    public episodePageType: Type<EpisodePage<this>>;

    public readonly state: State<this>;
    public readonly snackbarMessage$: Subject<SnackbarMessage>;

    protected constructor(serviceID: string, animePage: Type<AnimePage<any>>, episodePage: Type<EpisodePage<any>>) {
        this.state = new State(serviceID);

        this.snackbarMessage$ = new Subject();

        this.animePageType = animePage;
        this.episodePageType = episodePage;
    }

    /**
     * Route the given url.
     *
     * @param url - URL to route.
     */
    public abstract async route(url: URL): Promise<void>;

    /**
     * Load the service.
     *
     * @param noRoute - Whether or not to immediately call route with the
     * current url.
     */
    public async load(noRoute?: boolean) {
        const snackbar = await this.buildSnackbarQueue();

        await Promise.all([
            this.insertNoReferrerPolicy(),
            this.insertSnackbarQueue(snackbar),
        ]);

        if (!noRoute) await this.route(new URL(location.href));
    }

    /**
     * Insert a meta tag to the document head which
     * specifies that the referrer shouldn't be sent.
     */
    public async insertNoReferrerPolicy(): Promise<void> {
        const temp = document.createElement("template");
        temp.innerHTML = '<meta name="referrer" content="never">';
        const node = temp.content.firstElementChild;
        if (!node) throw new Error("Couldn't create template");

        document.head.appendChild(node);
        this.state.injected(node);
    }

    /**
     * Build a snackbar queue which displays the messages
     * from [[snackbarMessage$]].
     */
    public async buildSnackbarQueue(): Promise<Element> {
        return this.state.renderWithTheme(
            createElement(SnackbarQueue, {
                snackbarMessage$: this.snackbarMessage$,
            }),
        );
    }

    /**
     * Insert a snackbar queue to the document body.
     *
     * @param snackbarQueue - Snackbar queue to inject.
     *
     * @see [[buildSnackbarQueue]] to build the snackbar queue element.
     */
    public async insertSnackbarQueue(snackbarQueue: Element): Promise<void> {
        document.body.appendChild(snackbarQueue);
        this.state.injected(snackbarQueue);
    }

    /**
     * Build a service page of the given constructor.
     *
     * @param cls - Service page type to build.
     * @param memory - Memory to pass to the built service page.
     */
    public buildServicePage<T extends ServicePage<this>>(cls: Type<T>, memory?: { [key: string]: any }): T {
        const page = new cls(this);
        if (memory) {
            for (const [key, value] of Object.entries(memory))
                page.remember(key, value);
        }

        return page;
    }

    /** Shortcut for [[Service.snackbarMessage$.next]] */
    public showSnackbar(message: SnackbarMessage): void {
        this.snackbarMessage$.next(message);
    }

    /** Shortcut for [[Service.snackbarMessage$.next]] with variant error */
    public showErrorSnackbar(message: string | SnackbarMessage): void {
        this.showSnackbar(resolveSnackbarMessage(message, "error"));
    }

    /** Shortcut for [[Service.snackbarMessage$.next]] with variant warning */
    public showWarningSnackbar(message: string | SnackbarMessage): void {
        this.showSnackbar(resolveSnackbarMessage(message, "warning"));
    }

    /** Shortcut for [[Service.snackbarMessage$.next]] with variant info */
    public showInfoSnackbar(message: string | SnackbarMessage): void {
        this.showSnackbar(resolveSnackbarMessage(message, "info"));
    }

    /**
     * Show the anime page.
     *
     * @param memory - Memory to apply to the page.
     */
    public async showAnimePage(memory?: { [key: string]: any }) {
        await this.state.loadPage(this.buildServicePage(this.animePageType, memory));
    }

    /**
     * Show the episode page.
     *
     * @param memory - Memory to apply to the page.
     */
    public async showEpisodePage(memory?: { [key: string]: any }) {
        await this.state.loadPage(this.buildServicePage(this.episodePageType, memory));
    }
}
