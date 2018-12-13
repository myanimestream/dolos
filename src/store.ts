import Config, {DEFAULT_CONFIG} from "./config";
import StoredAnimeInfo, {DEFAULT_STORED_ANIME_INFO} from "./stored-anime-info";
import StorageChange = chrome.storage.StorageChange;

type StoreProxy<T = {}> = {
    [P in keyof T]: T[P];
};

type StoreProxyObject<T = {}> = StoreProxy<T> & StoreObject<T>;

class StoreObject<T = {}> {
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
            new StoreObject<T>(store, key, data || {} as T),
            {
                has(target: StoreObject<T>, p: keyof T): boolean {
                    return target.has(p);
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

                    console.log("setting", target, p, value);
                    target.set(p, value)
                        .catch(reason => console.trace("Couldn't set storeobject property", p, "for", target, reason));
                    return true;
                },
                ownKeys(target: StoreObject<T>): (keyof T)[] {
                    return target.ownKeys();
                }
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

    ownKeys(): (keyof T)[] {
        return Object.keys(this._container) as (keyof T)[];
    }

    update(newValue: T) {
        console.log("update", this, newValue);
        Object.assign(this._container, newValue);
    }

    setDefaults(defaults: { [key: string]: any }) {
        this._container = Object.assign({}, defaults, this._container);
    }
}

export class Store {
    _cache: { [key: string]: StoreProxyObject };

    constructor() {
        this._cache = {};
        chrome.storage.onChanged.addListener(this.onValueChanged);
    }

    onValueChanged = (changes: { [key: string]: StorageChange }, areaName: string) => {
        for (const [key, change] of Object.entries(changes)) {
            const storeObject = this._cache[key];
            if (storeObject) storeObject.update(change.newValue);
        }

        console.log(changes, areaName);
    };

    getRaw(keys?: string | string[] | Object): Promise<{ [key: string]: any }> {
        return new Promise(res => {
            chrome.storage.sync.get(keys, res);
        });
    }

    setRaw(items: Object) {
        return new Promise(resolve => chrome.storage.sync.set(items, resolve));
    }

    async get(key: string): Promise<StoreProxyObject> {
        if (!(key in this._cache)) {
            const value = (await this.getRaw(key))[key];
            this._cache[key] = StoreObject.create(this, key, value);
            console.log("getting", key, this._cache[key]);

        }

        return this._cache[key];
    }

    async set(key: string, value: any) {
        await this.setRaw({[key]: value});
    }

    async getConfig(): Promise<StoreProxyObject<Config>> {
        const config = await this.get("config");
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
        const info = await this.get(key);
        console.log("defaulted", key);

        info.setDefaults(DEFAULT_STORED_ANIME_INFO);

        return info as StoreProxyObject<StoredAnimeInfo>;
    }

}

const DEFAULT_STORE = new Store();
export default DEFAULT_STORE;