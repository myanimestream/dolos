/* tslint:disable:max-classes-per-file */
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
function prepareStoreElement<T extends Indexable<any>>(root: StoreElementRoot<any>, data: T): any {
    if (Array.isArray(data)) {
        return data.map(item => isPrimitive(item) ? item : StoreElement.create(root, item));
    }

    const result: { [key: string]: any } = {};

    for (const [key, value] of Object.entries(data)) {
        result[key] = isPrimitive(value) ? value : StoreElement.create(root, value);
    }

    return result;
}

/**
 * Proxy that is applied to [[StoreElement]]s to create a [[StoreElementProxy]] instance.
 * You should not have to use this directly.
 * @see Use [[StoreElement.create]] to create a [[StoreElementProxy]]
 */
class StoreElementTraps implements ProxyHandler<StoreElement<any>> {

    /**
     * Wrap a [[StoreElement]] in this proxy such that it becomes a [[StoreELementProxy]].
     *
     * @see [[StoreElement.create]] which already does this for you.
     */
    public static wrap<T extends StoreElement<any>>(target: T): StoreElementProxy<any> {
        const traps = new StoreElementTraps();
        const proxy = new Proxy(target, traps);
        traps.proxy = proxy;
        return proxy;
    }

    private proxy: any;

    public has<T>(target: StoreElement<T>, p: any): boolean {
        return target.has(p);
    }

    public ownKeys<T>(target: StoreElement<T>): string[] {
        return target.ownKeys();
    }

    public get<T>(target: StoreElement<T>, p: string | number) {
        if (p in target) {
            // @ts-ignore
            return target[p];
        }

        return target.get(p);
    }

    public getPrototypeOf(target: StoreElement<any>): object | null {
        return Reflect.getPrototypeOf(target);
    }

    public getOwnPropertyDescriptor(target: StoreElement<any>, p: string | number): PropertyDescriptor | undefined {
        return target.getOwnPropertyDescriptor(p) || Reflect.getOwnPropertyDescriptor(target, p);
    }

    public set<T>(target: StoreElement<T>, p: PropertyKey, value: any, receiver?: any): boolean {
        if (p in target) return Reflect.set(target, p, value, receiver);

        target.set.apply(this.proxy, [p as string | number, value]);
        return true;
    }

    public deleteProperty<T>(target: StoreElement<any>, p: string | number): boolean {
        target.deleteProperty.apply(this.proxy, [p]);
        return true;
    }
}

/**
 * Internal representation of every object inside of the extension storage.
 *
 * If you want to create a [[StoreElementProxy]] directly, call [[StoreElement.create]].
 *
 * @see [[Store]] which manages these objects.
 *
 * StoreElement itself is only used for "child" objects.
 * @see [[StoreElementRoot]] for the root.
 *
 * @see [[StoreElementProxy]] for a more accurate representation of the values
 * returned by [[Store]]
 */
export class StoreElement<T> {

    /**
     * Return the "raw" value such as the one that was used to create this element.
     * This recursively traverses the element tree and converts the nested store elements
     * to their raw value.
     *
     * This returns a copy of the value, not the original one.
     */
    get rawValue(): T {
        if (Array.isArray(this._container)) {
            // @ts-ignore
            return this._container.map(item => (item instanceof StoreElement) ? item.rawValue : item);
        }

        const raw: { [key: string]: any } = {};

        for (const [key, value] of Object.entries(this._container)) {
            raw[key] = (value instanceof StoreElement) ? value.rawValue : value;
        }

        // @ts-ignore
        return raw;
    }

    /**
     * Create a [[StoreElement]] and wrap it with [[StoreElementTraps]].
     *
     * Note that you should use this method because it pushes the wrapped value to
     * [[StoreElement.value$]] which otherwise would not be the case.
     */
    public static create<T>(root: StoreElementRoot<any>, data: T): StoreElementProxy<T> {
        const storeEl = StoreElementTraps.wrap(new StoreElement(root, data));
        storeEl.value$.next(storeEl);
        return storeEl as StoreElementProxy<T>;
    }

    /**
     * Observable which pushes a new value when anything changes.
     *
     * @see [[StoreElement.value$]] which does the same but always pushes the current value first.
     */
    public readonly onUpdate$: Subject<this>;
    /**
     * Like [[StoreElement.onUpdate$]] but a BeahviourSubject.
     * As such it always pushes the current value when you subscribe to it.
     */
    public readonly value$: BehaviorSubject<this>;
    protected readonly _root: StoreElementRoot<any>;
    protected _container!: Indexable<StoreElement<T[keyof T]> | T[keyof T]>;

    /**
     * Create a new store element. I can't see any reason why you would EVER have
     * to call this yourself.
     *
     * @see [[StoreElement.create]] to create a [[StoreElementProxy]]
     * @see [[StoreElemenrRoot]] for an actual "storage" element.
     */
    protected constructor(root: StoreElementRoot<any> | null, data: T) {
        // @ts-ignore
        this._root = root || this;
        this.setValueSelf(data);

        this.onUpdate$ = new Subject();
        this.value$ = new BehaviorSubject(this);

        this.onUpdate$.subscribe(this.value$);
    }

    /**
     * Save the [[StoreElement]] to the extension storage and wait for it to complete.
     * **IMPORTANT**: You don't have to call this method manually.
     * [[StoreElement]] automatically saves when something changes!
     *
     * @see [[StoreElement.triggerSave]] if you don't want to wait.
     */
    public async save(): Promise<void> {
        await this._root.save();
    }

    /**
     * Calls [[StoreElement.save]] and logs errors.
     * If you don't want to await [[StoreElement.save]], use this method!
     */
    public triggerSave(): void {
        this.save().catch(reason => console.error("Couldn't save", this, reason));
    }

    public has(key: any): boolean {
        return key in this._container;
    }

    /**
     * Check whether the [[StoreElement]] is equal to a raw value.
     * This is not a comparator between [[StoreElement]]. It is used by
     * [[StoreElement.update]] to check whether something has changed.
     *
     * @example
     * ```typescript
     *
     * // storeEl is a StoreElement!
     *
     * // this is a tautology!
     * storeEl.equals(storeEl.rawValue);
     * ```
     */
    public equals(other: T): boolean {
        if (Object.entries(this._container).length !== Object.entries(other).length) return false;

        for (const [key, value] of Object.entries(other)) {
            const el = this.get(key);
            if (el instanceof StoreElement) {
                if (!el.equals(value)) return false;
            } else if (el !== value) return false;
        }

        return true;
    }

    public get(key: string | number): any {
        return this._container[key];
    }

    /**
     * Get the value of key or set it to the provided default value if it doesn't exist.
     */
    public getOrSetDefault<V>(key: string | number, defaultValue: V): V | StoreElementProxy<V> {
        if (!this.has(key)) {
            this.set(key, defaultValue);
        }

        return this.get(key);
    }

    public set(key: string | number, value: any): void {
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

    public deleteProperty(key: string | number): void {
        delete this._container[key];
        this.triggerSave();
        this.onUpdate$.next(this);
    }

    public getOwnPropertyDescriptor(p: string | number): PropertyDescriptor | undefined {
        if (this.has(p))
            return {
                configurable: true,
                enumerable: true,
                writable: true,
            };

        return undefined;
    }

    /**
     * Receive a new value and apply it to this element.
     * This is not a method you should use! It is exposed for [[Store]]
     * to apply changes to this element.
     *
     * @see [[StoreElement.setDefaults]] for a way to set defaults.
     */
    public update(newValue: T): void {
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

    public ownKeys(): string[] {
        return Object.keys(this._container);
    }

    /**
     * Provide some default values for this element.
     * If a key already exists it is skipped.
     *
     * This does not trigger [[StoreElement.save]]!
     */
    public setDefaults(defaults: T): void {
        for (const [key, value] of Object.entries(defaults)) {
            const el = this.get(key);

            if (el instanceof StoreElement) {
                el.setDefaults(value);
                continue;
            } else if (el !== undefined) {
                continue;
            }

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

/**
 * A special type of [[StoreElement]] that represents the top level object from the
 * extension storage.
 */
class StoreElementRoot<T> extends StoreElement<T> {

    public static createRoot<T>(store: Store, key: string, data: T): StoreElementProxy<T> {
        const storeEl = StoreElementTraps.wrap(new StoreElementRoot(store, key, data));
        storeEl.value$.next(storeEl);
        return storeEl as StoreElementProxy<T>;
    }

    private readonly _store: Store;
    private readonly _key: string;

    constructor(store: Store, key: string, data: T) {
        super(null, data);

        this._store = store;
        this._key = key;
    }

    /**
     * Save directly propagates to the [[Store]].
     */
    public async save() {
        await this._store.set(this._key, this.rawValue);
    }
}

/**
 * A [[StoreElement]] that has been wrapped with [[StoreElementTraps]].
 * This makes it so you can access all the attributes from the object
 * while still having access to the benefits of a [[StoreElement]].
 *
 * Note that all properties of the object which are themselves objects
 * will be a store element proxy themselves.
 */
export type StoreElementProxy<T> = StoreElement<T> & T;

/**
 * An interface between the extension storage and Dolos.
 * It uses [[StoreElement]] or rather [[StoreElementProxy]] objects to
 * provide an easy-to-work-with API.
 *
 * Each [[Store]] instance manages its own cache, but there won't be a problem
 * if you use multiple instances as the cache is kept up-to-date with the storage.
 */
export class Store {

    public static buildLanguageIdentifier(config: Config): string;

    public static buildLanguageIdentifier(language: string, dubbed: boolean): string;

    /**
     * Create an identifier for the language settings.
     * The language identifier looks like this: `<language>_<dub | sub>`
     */
    public static buildLanguageIdentifier(...args: any[]): string {
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

    private readonly _cache: { [key: string]: StoreElementProxy<any> };
    private readonly _getLock: AsyncLock;

    constructor() {
        this._cache = {};
        this._getLock = new AsyncLock();
        chrome.storage.onChanged.addListener(this.handleValueChanged.bind(this));
    }

    /**
     * Get the value for the provided key from the storage.
     * This method returns a [[StoreElementProxy]] proxied object which
     * can interact with the underlying value directly.
     *
     * If there's no value for the given key the provided default value is used.
     * If no default value is provided it defaults to an empty object.
     * The default value is not immediately saved to the storage. However if you
     * edit an attribute of the [[StoreElementProxy]] object the saved value will
     * include the default.
     *
     * Access to the storage is "locked" using the key. This means that if you
     * start multiple get requests at the same time they will all finish
     * at the same time and resolve to the same [[StoreElementProxy]] object.
     * This is to provide consistency and ensure that the [[Store._cache]] cannot
     * be overwritten, potentially creating a dead [[StoreElement]] that isn't updated.
     */
    public async get<T>(key: string, defaultValue?: T): Promise<StoreElementProxy<T>> {
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

    /**
     * Store the given value under the given key in the storage.
     *
     * @see [[StoreElementProxy]] objects returned by [[Store.get]]
     * for a more convenient access.
     */
    public async set(key: string, value: any): Promise<void> {
        await this.setRaw({[key]: value});
    }

    /**
     * Load the [[Config]] from the storage.
     */
    public async getConfig(): Promise<StoreElementProxy<Config>> {
        const config = await this.get("config", {} as Config);
        config.setDefaults(DEFAULT_CONFIG);

        return config;
    }

    /**
     * Get thhe [[StoredServiceAnimes]] for a given service from the storage.
     *
     * @see [[Store.getStoredAnimeInfo]] for accessing [[StoredAnimeInfo]] directly.
     */
    public async getStoredAnimes(serviceID: string): Promise<StoreElementProxy<StoredServiceAnimes>> {
        return await this.get(`${serviceID}::anime`, {} as StoredServiceAnimes);
    }

    public async getStoredAnimeInfo(serviceID: string,
                                    identifier: string,
                                    config?: Config): Promise<StoreElementProxy<StoredAnimeInfo>> {
        config = config || await this.getConfig();

        const serviceAnimes = await this.getStoredAnimes(serviceID);
        const languageID = Store.buildLanguageIdentifier(config);

        const animes = serviceAnimes.getOrSetDefault(languageID, {} as StoreElement<StoredAnimeInfo>);
        return animes.getOrSetDefault(identifier, {}) as StoreElementProxy<StoredAnimeInfo>;
    }

    /**
     * Build an identifier which uniquely represents a medium for a service.
     *
     * @oaram config - if not provided [[Store.getConfig]] is used.
     */
    public async buildIdentifier(serviceID: string, identifier: string, config?: Config): Promise<string> {
        config = config || await this.getConfig();
        const languageID = Store.buildLanguageIdentifier(config);
        let key = `${serviceID}::${languageID}::`;

        for (let i = 0; i < identifier.length; i++) {
            key += identifier.charCodeAt(i).toString(16);
        }

        return key;
    }

    /**
     * Get the stored [[SubscribedAnimes]] object.
     */
    public async getAnimeSubscriptions(): Promise<StoreElementProxy<SubscribedAnimes>> {
        return await this.get("subscriptions::anime", {} as SubscribedAnimes);
    }

    private async getRaw(keys: string | string[] | object): Promise<{ [key: string]: any }> {
        return await new Promise(res => {
            chrome.storage.sync.get(keys, res);
        });
    }

    private async setRaw(items: object): Promise<void> {
        return await new Promise(resolve => chrome.storage.sync.set(items, resolve));
    }

    private async handleValueChanged(changes: { [key: string]: StorageChange }) {
        await Promise.all(
            Object.entries(changes)
                .map(([key, change]) =>
                    // lock the key
                    this._getLock.withLock(() => {
                        const storeObject = this._cache[key];
                        if (storeObject) storeObject.update(change.newValue);
                    }, key),
                ),
        );
    }
}

/**
 * Global version of [[Store]].
 * It doesn't break anything if you don't use this instance, but there
 * are several performance benefits if you do use it.
 */
const STATIC_STORE = new Store();
export default STATIC_STORE;
