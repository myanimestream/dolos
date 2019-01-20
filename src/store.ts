import {AnimeInfo} from "dolos/grobber";
import {Config, DEFAULT_CONFIG, DEFAULT_STORED_ANIME_INFO, StoredAnimeInfo} from "./models";
import StorageChange = chrome.storage.StorageChange;

type StoreProxy<T = {}> = {
    [P in keyof T]: T[P];
};

type StoreProxyObject<T = any> = StoreProxy<T> & StoreObject<T>;

class StoreObject<T = any> {
    [key: string]: any;

    _store: Store;
    _key: string;
    _container: T;

    constructor(store: Store, key: string, data: T) {
        this._store = store;
        this._key = key;
        this._container = data;
    }

    static create<T>(store: Store, key: string, data: T): StoreProxyObject<T> {
        // @ts-ignore
        return new Proxy(
            new StoreObject<T>(store, key, data),
            {
                has(target: StoreObject<T>, p: keyof T): boolean {
                    return target.has(p);
                },
                ownKeys(target: StoreObject<T>): string[] {
                    return target.ownKeys();
                },
                get(target: StoreObject<T>, p: keyof T): any {
                    if (p in target) {
                        // @ts-ignore
                        return target[p];
                    }

                    return target.get(p);
                },
                set(target: StoreObject<T>, p: keyof T, value: any): boolean {
                    if (p in target) {
                        target[p as any] = value;
                        return true;
                    }

                    target.set(p, value)
                        .catch(reason => console.error("Couldn't set StoreObject property", p, "for", target, reason));
                    return true;
                },
            }
        );
    }

    has(key: keyof T): boolean {
        return key in this._container;
    }

    get(key: keyof T): any {
        return this._container[key];
    }

    async set(key: keyof T, value: any) {
        this._container[key] = value;
        await this._store.set(this._key, this._container);
    }

    ownKeys(): string[] {
        return Object.keys(this._container);
    }

    // noinspection JSUnusedGlobalSymbols
    update(newValue: T) {
        Object.assign(this._container, newValue);
    }

    setDefaults(defaults: T) {
        if (Array.isArray(defaults))
            this._container = defaults;
        else
            this._container = Object.assign({}, defaults, this._container);
    }
}

export class Store {
    _cache: { [key: string]: StoreProxyObject };

    constructor() {
        this._cache = {};
        chrome.storage.onChanged.addListener(this.onValueChanged);
    }

    onValueChanged = (changes: { [key: string]: StorageChange }) => {
        for (const [key, change] of Object.entries(changes)) {
            const storeObject = this._cache[key];
            if (storeObject) storeObject.update(change.newValue);
        }
    };

    getRaw(keys: string | string[] | Object): Promise<{ [key: string]: any }> {
        return new Promise(res => {
            chrome.storage.sync.get(keys, res);
        });
    }

    setRaw(items: Object) {
        return new Promise(resolve => chrome.storage.sync.set(items, resolve));
    }

    async get<T>(key: string, defaultValue?: T): Promise<StoreProxyObject<T>> {
        if (!(key in this._cache)) {
            const value = (await this.getRaw(key))[key];
            this._cache[key] = StoreObject.create(this, key, value || defaultValue);
        }

        return this._cache[key] as StoreProxyObject<T>;
    }

    async set(key: string, value: any) {
        await this.setRaw({[key]: value});
    }

    async getConfig(): Promise<StoreProxyObject<Config>> {
        const config = await this.get("config", {});
        config.setDefaults(DEFAULT_CONFIG);

        return config as StoreProxyObject<Config>;
    }

    async buildIdentifier(service_id: string, identifier: string, config?: StoreProxyObject<Config>): Promise<string> {
        config = config || await this.getConfig();
        let key = `${service_id}::${config.language}_${config.dubbed ? "dub" : "sub"}::`;

        for (let i = 0; i < identifier.length; i++) {
            key += identifier.charCodeAt(i).toString(16);
        }

        return key;
    }

    async getStoredAnimeInfo(service_id: string, identifier: string, config?: StoreProxyObject<Config>): Promise<StoreProxyObject<StoredAnimeInfo>> {
        let key = await this.buildIdentifier(service_id, identifier, config);
        const info = await this.get(key, {});

        info.setDefaults(DEFAULT_STORED_ANIME_INFO);

        return info as StoreProxyObject<StoredAnimeInfo>;
    }

    async getSubscribedAnimeUIDs(): Promise<StoreProxyObject<{ [key: string]: AnimeInfo | null }>> {
        return await this.get("subscribed-anime", {});
    }
}

const DEFAULT_STORE = new Store();
export default DEFAULT_STORE;