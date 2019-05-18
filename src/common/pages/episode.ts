/**
 * @module common/pages
 */

import {EpisodeEmbed, SkipButton} from "dolos/components/anime";
import {Episode, GrobberErrorType, GrobberResponseError, remoteGrobberClient} from "dolos/grobber";
import {cacheInMemory} from "dolos/memory";
import {wrapSentryLogger} from "dolos/SentryLogger";
import {createElement} from "react";
import {
    BehaviorSubject,
    combineLatest,
    concat,
    defer,
    Observable,
    ObservableInput,
    Subscription,
    throwError,
    zip,
} from "rxjs";
import {catchError, exhaustMap, filter, first, map} from "rxjs/operators";
import {AnimePage} from ".";
import {Service} from "../service";
import {ServicePage} from "../service-page";
import _ = chrome.i18n.getMessage;

/**
 * The methods required for [[EpisodePage.animePage]].
 *
 * Incidentally this is a subset of [[AnimePage]] and is used as such.
 */
export type EpisodeAnimePage<T extends Service> = Pick<AnimePage<T>,
    | "getUID$"
    | "forceUpdateUID"
    | "setAnimeUID"
    | "getInfo$"
    | "getEpisodesWatched$"
    | "canSetEpisodesWatched"
    | "setEpisodesWatched"
    | "openAnimeSearchDialog">;

/**
 * Possible values for [[EpisodePage.animePage]].
 */
export type EpisodeAnimePageLike<T extends Service> =
    | EpisodeAnimePage<T>
    | EpisodeAnimePage<T> & ServicePage<T>
    | AnimePage<T>;

/**
 * A page that will show the [[EpisodeEmbed]].
 *
 * Because often episodes are displayed in a page that is a slightly modified
 * version of the anime overview page the [[EpisodePage]] will reuse the [[AnimePage]]
 * when transitioning.
 *
 * Supported transitions:
 * - [[EpisodePage]] -> [[EpisodePage]]: [[EpisodePage.animePage]] is passed
 * - [[EpisodePage]] -> [[AnimePage]]: Uses [[EpisodePage.animePage.transitionTo]] to handle the transition.
 */
export abstract class EpisodePage<T extends Service> extends ServicePage<T> {

    /**
     * Anime page slave.
     */
    get animePage(): EpisodeAnimePageLike<T> {
        if (!this._animePage) {
            let animePage: EpisodeAnimePageLike<T>;

            const registeredAnimePage = this.getBackgroundPage("anime");
            if (registeredAnimePage instanceof AnimePage) {
                animePage = registeredAnimePage;
            } else {
                animePage = this.buildAnimePage();
                this.animePage = animePage;
            }

            this._animePage = animePage;
        }

        return this._animePage;
    }

    set animePage(page: EpisodeAnimePageLike<T>) {
        const currentAnimePage = this._animePage;
        // noinspection SuspiciousTypeOfGuard
        if (currentAnimePage instanceof ServicePage) {
            currentAnimePage.unload()
                .catch(reason => console.error("couldn't unload", currentAnimePage, reason));
        }

        if (page instanceof AnimePage)
            this.registerBackgroundPage(page, "anime");

        this._animePage = page;
    }

    public readonly episodeBookmarked$: BehaviorSubject<boolean>;
    private epsWatchedSub?: Subscription;

    private _animePage?: EpisodeAnimePageLike<T>;

    constructor(service: T) {
        super(service);

        this.episodeBookmarked$ = new BehaviorSubject(false as boolean);
    }

    /**
     * Create the [[EpisodeAnimePageLike]] in case it wasn't passed to the
     * service page.
     */
    public abstract buildAnimePage(): EpisodeAnimePageLike<T>;

    /**
     * Get the index of the episode.
     */
    public abstract async getEpisodeIndex(): Promise<number | undefined>;

    /**
     * Inject the episode embed into the document.
     *
     * @param embed - Episode embed element to insert
     */
    public abstract async injectEmbed(embed: Element): Promise<void>;

    /**
     * Get the [[SkipButton]] to go to the next episode.
     */
    public abstract async nextEpisodeButton(): Promise<SkipButton | undefined>;

    /**
     * Navigate to the next episode
     */
    public abstract async showNextEpisode(): Promise<void>;

    /**
     * Get the [[SkipButton]] to go to the previous episode.
     */
    public abstract async prevEpisodeButton(): Promise<SkipButton | undefined>;

    /**
     * Navigate to the previous episode
     */
    public abstract async showPrevEpisode(): Promise<void>;

    /**
     * Get the [[Episode]] information.
     */
    public getEpisode$(): Observable<Episode> {
        const createEpisode$ = (uid$: ObservableInput<string>) => {
            return combineLatest([
                uid$,
                defer(() => this.getEpisodeIndex()),
            ]).pipe(
                map(([uid, episodeIndex]) => {
                    if (episodeIndex === undefined)
                        throw new Error("Episode index undefined");

                    return [uid, episodeIndex] as [string, number];
                }),
                exhaustMap(([uid, episodeIndex]) => remoteGrobberClient.getEpisode(uid, episodeIndex)),
            );
        };

        return createEpisode$(this.animePage.getUID$()).pipe(
            catchError(err => {
                if (err instanceof GrobberResponseError && err.name === GrobberErrorType.UIDUnknown) {
                    return createEpisode$(this.animePage.forceUpdateUID());
                } else {
                    return throwError(err);
                }
            }),
        );
    }

    /**
     * Create the episode embed element.
     */
    public async buildEmbed(): Promise<Element> {
        return this.state.renderWithTheme(
            wrapSentryLogger(createElement(EpisodeEmbed, {episodePage: this})),
        );
    }

    /**
     * Function to call when the episode finished playing.
     */
    public onEpisodeEnd(): Promise<void> {
        const updateProgress$ = this.state.config$.pipe(
            first(),
            filter(config => config.updateAnimeProgress),
            exhaustMap(() => this.markEpisodeWatched()),
        );
        const showNext$ = this.state.config$.pipe(
            first(),
            filter(config => config.autoNext),
            exhaustMap(() => zip(
                this.animePage.getInfo$(),
                defer(() => this.getEpisodeIndex()),
            )),
            exhaustMap(async ([animeInfo, episodeIndex]) => {
                if (episodeIndex === undefined) return;
                if (animeInfo === undefined || episodeIndex + 1 < animeInfo.episodes)
                    await this.showNextEpisode();
            }),
        );

        // make sure that updateProgress finished first because otherwise
        // it might get cancelled by the "showNextEpisode" which depending on
        // the implementation destroys the js context.
        return concat(updateProgress$, showNext$).toPromise();
    }

    /**
     * Mark the episode as watched
     */
    public markEpisodeWatched(): Promise<void> {
        return this.setEpisodeWatchedMark(true);
    }

    /**
     * Mark the episode as unwatched
     */
    public markEpisodeUnwatched(): Promise<void> {
        return this.setEpisodeWatchedMark(false);
    }

    public async _load() {
        const loadAnimePage = async () => {
            // They are very much related, TypeScript!
            // noinspection SuspiciousTypeOfGuard
            if (this.animePage instanceof ServicePage)
                await this.animePage.load();
        };

        const setupEpisodePage = async () => {
            const [epIndex, epsWatched$] = await Promise.all([
                this.getEpisodeIndex(),
                this.animePage.getEpisodesWatched$(),
            ]);

            this.epsWatchedSub = epsWatched$.subscribe(epsWatched => {
                if (epsWatched !== undefined && epIndex !== undefined)
                    this.episodeBookmarked$.next(epsWatched >= epIndex + 1);
            });
        };

        const loadEpisodePage = async () => {
            const embed = await this.buildEmbed();
            await this.injectEmbed(embed);
        };

        await Promise.all([
            loadAnimePage(),
            setupEpisodePage(),
            loadEpisodePage(),
        ]);
    }

    public async _unload() {
        if (this.epsWatchedSub)
            this.epsWatchedSub.unsubscribe();

        await super._unload();
    }

    public async transitionTo(page?: ServicePage<T>): Promise<ServicePage<T> | undefined> {
        if (page instanceof AnimePage) {
            const animePage = this.getBackgroundPage("anime");
            if (animePage) {
                this.resetPage();
                return await animePage.transitionTo(page);
            }
        } else if (page instanceof EpisodePage) {
            page.animePage = this.animePage;
            this.resetPage();
            await page.load();
            return undefined;
        }

        return await super.transitionTo(page);
    }

    /**
     * @deprecated use [[getEpisode$]]
     */
    @cacheInMemory("episode")
    public async getEpisode(): Promise<Episode | undefined> {
        try {
            return await this.getEpisode$().pipe(first()).toPromise();
        } catch {
            return undefined;
        }
    }

    private async setEpisodeWatchedMark(watched: boolean): Promise<void> {
        const [epIndex, canSetProgress] = await Promise.all([
            this.getEpisodeIndex(),
            this.animePage.canSetEpisodesWatched(),
        ]);
        if (!canSetProgress) return;

        if (epIndex === undefined) {
            console.warn("Can't update anime progress, episodeIndex undefined!");
            return;
        }

        // index + 1 if watched is true
        // index if watched is false
        if (!await this.animePage.setEpisodesWatched(epIndex + Number(watched)))
            this.service.showErrorSnackbar(_("episode__bookmark_failed"));
    }
}
