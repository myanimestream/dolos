/**
 * Interacting with the browser storage has never been this *bearable*.
 *
 * Get objects from the storage which **update automatically** when their
 * stored version does and likewise update the stored version by simply
 * changing the value of a property.
 *
 * @module store
 */

import {BehaviorSubject, Subject} from "rxjs";
/** @ignore */
import {Config, DEFAULT_CONFIG, DEFAULT_STORED_ANIME_INFO, StoredAnimeInfo, SubscribedAnimes} from "./models";
import StorageChange = chrome.storage.StorageChange;


const StoreObjectTraps: ProxyHandler<StoreObject<any>> = {
    has<T>(target: StoreObject<T>, p: keyof T): boolean {
        return target.has(p);
    },
    ownKeys<T>(target: StoreObject<T>): string[] {
        return target.ownKeys();
    },
    get<T>(target: StoreObject<T>, p: keyof T): any {
        if (p in target) {
            // @ts-ignore
            return target[p];
        }

        return target.get(p);
    },
    getOwnPropertyDescriptor(target: StoreObject<any>, p: PropertyKey): PropertyDescriptor | undefined {
        if (target.has(p)) {
            return {
                enumerable: true,
                configurable: true
            }
        } else return Reflect.getOwnPropertyDescriptor(target, p);
    },
    set<T>(target: StoreObject<T>, p: PropertyKey, value: any, receiver?: any): boolean {
        if (p in target) return Reflect.set(target, p, value, receiver);

        if (typeof p === "string") {
            target.set(p, value)
                .catch(reason =>
                    console.error("Couldn't set StoreObject property", p, "for", target, reason));
            return true;
        }

        return false;
    },
    deleteProperty<T>(target: StoreObject<any>, p: keyof T): boolean {
        if (p in target) return Reflect.deleteProperty(target, p);

        target.deleteProperty(p)
            .catch(reason =>
                console.error("Couldn't delete StoreObject property", p, "for", target, reason));

        return true;
    }
};

/**
 * Something that can either be indexed using strings or numbers
 *
 * Basically an array or an object.
 */
export interface Indexable<T> {
    [key: string]: T;

    [index: number]: T;
}

/**
 * Wrap a proxy around the child so that if a value is changed it triggers
 * [[StoreObject.save]] on the provided store object.
 */
function createStoreObjectChild<T extends Object>(storeObject: StoreObject<any>, child: T): T {
    return new Proxy(child, {
        set(target: T, p: PropertyKey, value: any, receiver: any): boolean {
            const success = Reflect.set(target, p, value, receiver);
            storeObject.save()
                .catch(reason =>
                    console.error("Couldn't set", storeObject, "child property", p, "for", target, reason));
            return success;
        }
    });
}


export class StoreObject<T extends Indexable<any>> {
    onUpdate$: Subject<this>;
    value$: BehaviorSubject<this>;
    private readonly _store: Store;
    private readonly _key: string;
    private _container: T;

    /**
     * Create a basic StoreObject.
     *
     * @see [[StoreObject.create]] to create a [[StoreProxyObject]].
     */
    constructor(store: Store, key: string, data: T) {
        this._store = store;
        this._key = key;
        this._container = data;

        this.onUpdate$ = new Subject();
        this.value$ = new BehaviorSubject(this);

        this.onUpdate$.subscribe(this.value$);
    }

    /** Creates a new StoreObject wrapped with the [[StoreObjectTraps]] Proxy. */
    static create<T>(store: Store, key: string, data: T): StoreProxyObject<T> {
        const storeObject = new Proxy(
            new StoreObject<T>(store, key, data),
            StoreObjectTraps
        ) as StoreProxyObject<T>;

        // make the current value the one wrapped by the proxy
        storeObject.value$.next(storeObject);

        return storeObject;
    }

    getKey(): string {
        return this._key;
    }

    has(key: keyof T): boolean {
        return key in this._container;
    }

    get(key: keyof T): any {
        const value = this._container[key];
        // if the value isn't a primitive type, return a proxy which triggers save when a change occurs.
        return (value === Object(value)) ? createStoreObjectChild(this, value) : value;
    }

    async set(key: string, value: any) {
        this._container[key] = value;
        await this.save();
    }

    async deleteProperty(key: keyof T): Promise<void> {
        delete this._container[key];
        await this.save();
    }

    async save() {
        await this._store.set(this._key, this._container);
    }

    ownKeys(): string[] {
        return Object.keys(this._container);
    }

    // noinspection JSUnusedGlobalSymbols
    update(newValue: T): void {
        this._container = newValue;
        this.onUpdate$.next(this);
    }

    /**
     * Basically the same as [[StoreObject.update]],
     * but the behaviour is different for objects insofar
     * that their current value overwrites the provided defaults.
     *
     * This is useful if you need to make sure that some
     */
    setDefaults(defaults: T): void {
        if (Array.isArray(defaults))
            this._container = defaults;
        else
            this._container = Object.assign({}, defaults, this._container);
    }
}

/** Type of a [[StoreObject]] that uses the [[StoreObjectTraps]] Proxy. */
export type StoreProxyObject<T> = StoreObject<T> & T;

export class Store {
    _cache: { [key: string]: StoreProxyObject<any> };

    constructor() {
        this._cache = {};
        chrome.storage.onChanged.addListener(this.handleValueChanged.bind(this));
    }

    async getRaw(keys: string | string[] | Object): Promise<{ [key: string]: any }> {
        return await new Promise(res => {
            chrome.storage.sync.get(keys, res);
        });
    }

    async setRaw(items: Object): Promise<void> {
        return await new Promise(resolve => chrome.storage.sync.set(items, resolve));
    }

    async set(key: string, value: any): Promise<void> {
        await this.setRaw({[key]: value});
    }

    async get<T>(key: string, defaultValue?: T): Promise<StoreProxyObject<T>> {
        if (!(key in this._cache)) {
            const value = (await this.getRaw(key))[key];
            this._cache[key] = StoreObject.create(this, key, value || defaultValue);
        }

        return this._cache[key] as StoreProxyObject<T>;
    }

    async getConfig(): Promise<StoreProxyObject<Config>> {
        const config = await this.get("config", {} as Config);
        config.setDefaults(DEFAULT_CONFIG);

        return config;
    }

    async getStoredAnimeInfo(service_id: string, identifier: string, config?: StoreProxyObject<Config>): Promise<StoreProxyObject<StoredAnimeInfo>> {
        let key = await this.buildIdentifier(service_id, identifier, config);
        const info = await this.get(key, {} as StoredAnimeInfo);

        info.setDefaults(DEFAULT_STORED_ANIME_INFO);

        return info;
    }

    async buildIdentifier(service_id: string, identifier: string, config?: StoreProxyObject<Config>): Promise<string> {
        config = config || await this.getConfig();
        let key = `${service_id}::${config.language}_${config.dubbed ? "dub" : "sub"}::`;

        for (let i = 0; i < identifier.length; i++) {
            key += identifier.charCodeAt(i).toString(16);
        }

        return key;
    }

    async getSubscribedAnimes(): Promise<StoreProxyObject<SubscribedAnimes>> {
        return await this.get("subscribed-anime", {} as SubscribedAnimes);
    }

    private handleValueChanged(changes: { [key: string]: StorageChange }) {
        for (const [key, change] of Object.entries(changes)) {
            const storeObject = this._cache[key];
            if (storeObject) storeObject.update(change.newValue);
        }
    }
}

const DEFAULT_STORE = new Store();
export default DEFAULT_STORE;