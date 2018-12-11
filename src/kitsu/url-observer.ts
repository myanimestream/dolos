export default class UrlObserver {
    _observing: boolean;

    interval: number;
    url: string;

    callback?: (old: string, updated: string) => void;

    constructor(interval: number, callback?: (old?: string, updated?: string) => any) {
        this.interval = interval;
        this.callback = callback;
        this._observing = false;
    }

    _observeUrl() {
        const currentUrl = location.href;
        if (currentUrl != this.url) {
            this.onUrlChange(this.url, currentUrl);
            this.url = currentUrl;
        }

        setTimeout(this._observeUrl.bind(this), this.interval);
    }

    start() {
        if (this._observing)
            throw new TypeError("Already observing!");

        this._observing = true;
        this._observeUrl();
    }

    onUrlChange(old: string, updated: string) {
        this.callback(old, updated);
    }
}