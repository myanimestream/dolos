/**
 * Interacting with the browser storage has never been this *bearable*.
 *
 * Get objects from the storage which **update automatically** when their
 * stored version does and likewise update the stored version by simply
 * changing the value of a property.
 *
 * @module store
 */

/** @ignore */

import AsyncLock from "dolos/lock";
import {BehaviorSubject, Subject} from "rxjs";
import {Config, DEFAULT_CONFIG, StoredAnimeInfo, StoredServiceAnimes, SubscribedAnimes} from "./models";
import StorageChange = chrome.storage.StorageChange;


/**
 * Something that can either be indexed using strings or numbers
 *
 * Basically an array or an object.
 */
export interface Indexable<T> {
    [key: string]: T;

    [index: number]: T;
}

/** Check whether something is an object or a primitive value */
export function isPrimitive(value: any): boolean {
    return typeof value !== "object" || value === null;
}

/**
 * Return an object with non-primitve values replaced by StoreElements.
 */
function prepareStoreElement<T extends Object>(root: StoreElementRoot<any>, data: T): any {
    if (Array.isArray(data)) {
        return data.map(item => isPrimitive(item) ? item : StoreElement.create(root, item));
    }

    let result: { [key: string]: any } = {};

    for (const [key, value] of Object.entries(data)) {
        result[key] = isPrimitive(value) ? value : StoreElement.create(root, value);
    }

    return result;
}

class StoreElementTraps implements ProxyHandler<StoreElement<any>> {
    private proxy: any;

    static wrap<T extends StoreElement<any>>(target: T): StoreElementProxy<any> {
        const traps = new StoreElementTraps();
        const proxy = new Proxy(target, traps);
        traps.proxy = proxy;
        return proxy;
    }

    has<T>(target: StoreElement<T>, p: any): boolean {
        return target.has(p);
    }

    ownKeys<T>(target: StoreElement<T>): string[] {
        return target.ownKeys();
    }

    get<T>(target: StoreElement<T>, p: string | number) {
        if (p in target) {
            // @ts-ignore
            return target[p];
        }

        return target.get(p);
    }

    getPrototypeOf(target: StoreElement<any>): object | null {
        return Reflect.getPrototypeOf(target);
    }

    getOwnPropertyDescriptor(target: StoreElement<any>, p: string | number): PropertyDescriptor | undefined {
        return target.getOwnPropertyDescriptor(p) || Reflect.getOwnPropertyDescriptor(target, p);
    }

    set<T>(target: StoreElement<T>, p: PropertyKey, value: any, receiver?: any): boolean {
        if (p in target) return Reflect.set(target, p, value, receiver);

        target.set.apply(this.proxy, [p as string | number, value]);
        return true;
    }

    deleteProperty<T>(target: StoreElement<any>, p: string | number): boolean {
        target.deleteProperty.apply(this.proxy, [p]);
        return true;
    }
}

export class StoreElement<T> {
    readonly onUpdate$: Subject<this>;
    readonly value$: BehaviorSubject<this>;

    protected readonly _root: StoreElementRoot<any>;
    protected _container: Indexable<StoreElement<T[keyof T]> | T[keyof T]>;

    protected constructor(root: StoreElementRoot<any> | null, data: T) {
        // @ts-ignore
        this._root = root || this;
        this.setValueSelf(data);

        this.onUpdate$ = new Subject();
        this.value$ = new BehaviorSubject(this);

        this.onUpdate$.subscribe(this.value$);
    }

    get rawValue(): T {
        if (Array.isArray(this._container)) {
            // @ts-ignore
            return this._container.map(item => (item instanceof StoreElement) ? item.rawValue : item);
        }

        let raw: { [key: string]: any } = {};

        for (const [key, value] of Object.entries(this._container)) {
            raw[key] = (value instanceof StoreElement) ? value.rawValue : value;
        }

        // @ts-ignore
        return raw;
    }

    static create<T>(root: StoreElementRoot<any>, data: T): StoreElementProxy<T> {
        const storeEl = StoreElementTraps.wrap(new StoreElement(root, data));
        storeEl.value$.next(storeEl);
        return storeEl as StoreElementProxy<T>;
    }

    async save(): Promise<void> {
        await this._root.save();
    }

    triggerSave(): void {
        this.save().catch(reason => console.error("Couldn't save", this, reason));
    }

    has(key: any): boolean {
        return key in this._container;
    }

    equals(other: T): boolean {
        if (Object.entries(this._container).length !== Object.entries(other).length) return false;

        for (const [key, value] of Object.entries(other)) {
            const el = this.get(key);
            if (el instanceof StoreElement) {
                if (!el.equals(value)) return false;
            } else if (el !== value) return false;
        }

        return true;
    }

    get(key: string | number): any {
        return this._container[key];
    }

    getOrSetDefault<V>(key: string | number, defaultValue: V): V | StoreElementProxy<V> {
        if (!this.has(key)) {
            this.set(key, defaultValue);
        }

        return this.get(key);
    }

    set(key: string | number, value: any): void {
        const el = this.get(key);

        if (isPrimitive(value))
            this._container[key] = value;
        else if (el instanceof StoreElement)
            el.setValueSelf(value);
        else
            this._container[key] = StoreElement.create(this._root, value);

        this.triggerSave();
        this.onUpdate$.next(this);
    }

    deleteProperty(key: string | number): void {
        delete this._container[key];
        this.triggerSave();
        this.onUpdate$.next(this);
    }

    getOwnPropertyDescriptor(p: string | number): PropertyDescriptor | undefined {
        if (this.has(p))
            return {
                enumerable: true,
                configurable: true,
                writable: true,
            };

        return undefined;
    }

    update(newValue: T): void {
        if (this.equals(newValue)) {
            return;
        }

        if (Object.entries(newValue).length > 0) {
            const keys = new Set([...this.ownKeys(), ...Object.keys(newValue)]);

            for (const key of keys) {
                // this key was removed
                if (!(key in newValue)) {
                    delete this._container[key];
                    continue;
                }
                // otherwise it's either a new or changed key

                // @ts-ignore
                const value = newValue[key];
                const el = this.get(key);

                if (isPrimitive(value))
                    this._container[key] = value;
                else if (el instanceof StoreElement)
                    el.update(value);
                else
                    this._container[key] = StoreElement.create(this._root, value);
            }
        } else
            this.setValueSelf(newValue);

        this.onUpdate$.next(this);
    }

    ownKeys(): string[] {
        return Object.keys(this._container);
    }

    setDefaults(defaults: T): void {
        for (const [key, value] of Object.entries(defaults)) {
            const el = this.get(key);
            if (el !== undefined) continue;

            if (isPrimitive(value)) {
                this._container[key] = value;
            } else {
                this._container[key] = StoreElement.create(this._root, value);
            }
        }
    }

    protected setValueSelf(value: T): void {
        this._container = prepareStoreElement(this._root, value);
    }
}

class StoreElementRoot<T> extends StoreElement<T> {
    private readonly _store: Store;
    private readonly _key: string;

    constructor(store: Store, key: string, data: T) {
        super(null, data);

        this._store = store;
        this._key = key;
    }

    static createRoot<T>(store: Store, key: string, data: T): StoreElementProxy<T> {
        const storeEl = StoreElementTraps.wrap(new StoreElementRoot(store, key, data));
        storeEl.value$.next(storeEl);
        return storeEl as StoreElementProxy<T>;
    }

    async save() {
        await this._store.set(this._key, this.rawValue);
    }
}

export type StoreElementProxy<T> = StoreElement<T> & T;

export class Store {
    private readonly _cache: { [key: string]: StoreElementProxy<any> };
    private readonly _getLock: AsyncLock;

    constructor() {
        this._cache = {};
        this._getLock = new AsyncLock();
        chrome.storage.onChanged.addListener(this.handleValueChanged.bind(this));
    }

    static buildLanguageIdentifier(config: Config): string;

    static buildLanguageIdentifier(language: string, dubbed: boolean): string;

    /**
     * Create an identifier for the language settings.
     * The language identifier looks like this: `<language>_<dub | sub>`
     */
    static buildLanguageIdentifier(...args: any[]): string {
        let language: string;
        let dubbed: boolean;

        switch (args.length) {
            case 1:
                const config = args[0];
                language = config.language;
                dubbed = config.dubbed;
                break;
            case 2:
                language = args[0];
                dubbed = args[1];
                break;
            default:
                throw new Error("Invalid amount of arguments");
        }

        return `${language}_${dubbed ? "dub" : "sub"}`;
    }

    async get<T>(key: string, defaultValue?: T): Promise<StoreElementProxy<T>> {
        // prevents multiple roots for the same item.
        // without the lock 2 get requests to the same key
        // could lead to two different StoreElementRoots, only the
        // latter would be stored in the cache and as such, updated.
        return await this._getLock.withLock(async () => {
            if (!(key in this._cache)) {
                const value = (await this.getRaw(key))[key];
                this._cache[key] = StoreElementRoot.createRoot(this, key, value || defaultValue || {});
            }

            return this._cache[key] as StoreElementProxy<T>;
        }, key);
    }

    async set(key: string, value: any): Promise<void> {
        await this.setRaw({[key]: value});
    }

    async getConfig(): Promise<StoreElementProxy<Config>> {
        const config = await this.get("config", {} as Config);
        config.setDefaults(DEFAULT_CONFIG);

        return config;
    }

    async getStoredAnimes(serviceID: string): Promise<StoreElementProxy<StoredServiceAnimes>> {
        return await this.get(`${serviceID}::anime`, {} as StoredServiceAnimes);
    }

    async getStoredAnimeInfo(serviceID: string, identifier: string, config?: Config): Promise<StoreElementProxy<StoredAnimeInfo>> {
        config = config || await this.getConfig();

        const serviceAnimes = await this.getStoredAnimes(serviceID);
        const languageID = Store.buildLanguageIdentifier(config);

        let animes = serviceAnimes.getOrSetDefault(languageID, {} as StoreElement<StoredAnimeInfo>);
        return animes.getOrSetDefault(identifier, {}) as StoreElementProxy<StoredAnimeInfo>;
    }

    async buildIdentifier(serviceID: string, identifier: string, config?: Config): Promise<string> {
        config = config || await this.getConfig();
        const languageID = Store.buildLanguageIdentifier(config);
        let key = `${serviceID}::${languageID}::`;

        for (let i = 0; i < identifier.length; i++) {
            key += identifier.charCodeAt(i).toString(16);
        }

        return key;
    }

    async getAnimeSubscriptions(): Promise<StoreElementProxy<SubscribedAnimes>> {
        return await this.get("subscriptions::anime", {} as SubscribedAnimes);
    }

    private async getRaw(keys: string | string[] | Object): Promise<{ [key: string]: any }> {
        return await new Promise(res => {
            chrome.storage.sync.get(keys, res);
        });
    }

    private async setRaw(items: Object): Promise<void> {
        return await new Promise(resolve => chrome.storage.sync.set(items, resolve));
    }

    private handleValueChanged(changes: { [key: string]: StorageChange }) {
        for (const [key, change] of Object.entries(changes)) {
            const storeObject = this._cache[key];
            if (storeObject) storeObject.update(change.newValue);
        }
    }
}

const StaticStore = new Store();
export default StaticStore;