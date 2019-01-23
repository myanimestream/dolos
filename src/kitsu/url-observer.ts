/**
 * @module kitsu
 */

/**
 * Observes the url for any changes and calls a callback if it changes.
 *
 * Instead of using the UrlObserver directly you may extend it:
 * @example
 * ```typescript
 *
 * class MyThing extends UrlObserver {
 *     constructor() {
 *          // don't provide a callback because we're using it directly.
 *         super(1000);
 *     }
 *
 *     // this method is called whenever the url changes
 *     onUrlChange(old: string, updated: string): void {
 *         console.log(`the url has changed from ${old} to ${updated}`);
 *     }
 * }
 * ```
 */
export default class UrlObserver {
    _observing: boolean;

    interval: number;
    url: string;

    callback?: (old: string, updated: string) => void;

    /**
     * Create a new UrlObserver.
     *
     * @see [[UrlObserver.start]] to start monitoring the url.
     *
     * @param interval - in milliseconds
     */
    constructor(interval: number, callback?: (old: string, updated: string) => any) {
        this.interval = interval;
        this.callback = callback;
        this._observing = false;
    }

    /**
     * Start observing the url.
     *
     * @throws TypeError is the
     */
    start(): void {
        if (this._observing)
            throw new TypeError("Already observing!");

        this._observing = true;
        this._observeUrl();
    }

    /**
     * This method is called whenever a url change is observed.
     *
     * You can override this method when inheriting from [[UrlObserver]].
     */
    onUrlChange(old: string, updated: string): void {
        if (this.callback)
            this.callback(old, updated);
    }

    private _observeUrl() {
        const currentUrl = location.href;
        if (currentUrl != this.url) {
            this.onUrlChange(this.url, currentUrl);
            this.url = currentUrl;
        }

        setTimeout(this._observeUrl.bind(this), this.interval);
    }
}