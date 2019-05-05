/**
 * Tools for interacting with the browser storage.
 *
 * The module has an [[AreaAdapter]] for the `sync` storage area as its default export.
 *
 * @module store
 */

/** @ignore */

import runtime = chrome.runtime;
import storage = chrome.storage;
import {fromExtensionEventPattern, mapArrayToObject} from "dolos/observable-utils";
import {from, merge, Observable, ReplaySubject, Subject} from "rxjs";
import {distinctUntilChanged, filter, first, map, takeUntil} from "rxjs/operators";

/**
 * Event emitted for changes.
 */
export interface GlobalChangeEvent {
    changes: { [key: string]: storage.StorageChange };
    areaName: string;
}

/**
 * Observable which listens to all storage change events.
 */
const globalItemChange$ = fromExtensionEventPattern(storage.onChanged).pipe(
    mapArrayToObject<GlobalChangeEvent>(["changes", "areaName"]),
);

/**
 * Supported storage areas.
 */
export const enum StorageAreaName {
    Local = "local",
    Managed = "managed",
    Sync = "sync",
}

/**
 * Get a storage area by its name.
 *
 * @param name - Name of the storage area.
 * Currently this is one of "local", "sync", or "managed".
 *
 * @throws [[Error]] - If the storage area with the given name doesn't exist
 */
export function getStorageArea(name: string): storage.StorageArea {
    // @ts-ignore
    const area = storage[name];

    if (area === undefined)
        throw new Error(`Invalid storage area: ${name}`);

    return area;
}

/**
 * Get the value of a key in a namespace.
 *
 * @param ns - Namespace to get value from.
 * @param path - Path to the value.
 *
 * @return Value of the path in the namespace or undefined if
 * the value doesn't exist.
 */
export function nsGet<T>(ns: any, path: string[]): T | undefined {
    let target = ns;

    for (const key of path) {
        try {
            target = target[key];
        } catch {
            return undefined;
        }
    }

    return target;
}

/**
 * Set the value of a key in a namespace.
 * Namespaces are created if they do not already exist
 * and non-namespace values are replaced.
 *
 * @param ns - Namespace to set value in.
 * The passed namespace isn't mutated!
 * @param path - Path to the value to the key to set
 * @param value - Value to set the key to
 *
 * @return Copy of the original ns with the new value at the given path.
 * It is important to note that the new ns isn't a deep copy of the old one,
 * only namespaces which are traversed are copied shallowly.
 */
export function nsSet(ns: any, path: string[], value: any): Readonly<any> {
    const lastPartIndex = path.length - 1;
    const finalKey = path[lastPartIndex];
    if (finalKey === undefined) return value;

    const nsCopy = {...ns};
    let parentNS = nsCopy;

    for (let i = 0; i < lastPartIndex; i++) {
        const key = path[i];

        const childNSCopy = {...parentNS[key]};
        // enter the copy but also add it to the nsCopy tree.
        // parentNS is already part of nsCopy and we then attach
        // the new childNSCopy to it which means that it is now also
        // part of nsCopy, so we can safely use it as our new parentNS
        parentNS = parentNS[key] = childNSCopy;
    }

    parentNS[finalKey] = value;

    return nsCopy;
}

/**
 * Get the current value of an item in the given storage area.
 *
 * This is just a wrapper for the area's `get` method to use promises instead
 * of callbacks.
 *
 * @param area - Storage area to get the item from.
 * @param key - Key of item to get
 */
async function storageGet<T>(area: storage.StorageArea, key: string): Promise<T | undefined> {
    return new Promise((res, rej) =>
        area.get(key, items => {
            if (runtime.lastError) {
                rej(runtime.lastError.message);
            } else {
                res(items[key]);
            }
        }));
}

/**
 * Set the value of an item in the given storage area.
 *
 * This is just a wrapper for the area's `set` method to use promises instead
 * of callbacks.
 *
 * @param area - Storage area to set the item in.
 * @param key - Key of item to set value of
 * @param value - New value to insert. If the given value is undefined, the key
 * is removed.
 */
async function storageSet<T>(area: storage.StorageArea, key: string, value: T | undefined) {
    return new Promise((res, rej) => {
        const handleResponse = () => {
            if (runtime.lastError) {
                rej(runtime.lastError.message);
            } else {
                res();
            }
        };

        if (value === undefined) {
            area.remove(key, handleResponse);
        } else {
            area.set({[key]: value}, handleResponse);
        }
    });
}

/**
 * Observable which emits [[storage.StorageChange]] whenever the given root key changes its value.
 *
 * @param storageArea - Storage area to get key from
 * @param key - Key to get changes for
 */
function createRootItemChange$<T>(storageArea: string, key: string): Observable<storage.StorageChange> {
    return globalItemChange$.pipe(
        filter(value => value.areaName === storageArea && key in value.changes),
        map(value => value.changes[key]),
    );
}

/**
 * Observable which emits the current value of the item.
 */
export type ItemObservable<T> = Observable<Readonly<T> | undefined>;

/**
 * Create a new observable for a root item.
 *
 * @param storageArea - Storage area to get item from
 * @param key - Key of the item
 *
 * @see [[getRootItem$]]
 */
function createRootItem$<T>(storageArea: string, key: string): ItemObservable<T> {
    const area = getStorageArea(storageArea);

    // update stream
    const change$ = createRootItemChange$(storageArea, key)
        .pipe(map(value => value.newValue));

    // get current value from the storage,
    // but abort if an update comes in first!
    const item$ = from(storageGet(area, key))
        .pipe(takeUntil(change$));

    return merge(item$, change$);
}

/**
 * Cache for root level item observables.
 */
const rootCache: { [key: string]: Subject<any> | undefined } = {};

/**
 * Remove all root items from the cache.
 *
 * @param storageArea - Limit removal to only one storage area.
 */
export function clearRootCache(storageArea?: string) {
    let keys: string[];
    if (storageArea === undefined) {
        keys = Object.keys(rootCache);
    } else {
        keys = Object.keys(rootCache)
            .filter(key => key.startsWith(storageArea));
    }

    keys.forEach(key => {
        const root$ = rootCache[key];
        if (root$) root$.complete();

        delete rootCache[key];
    });
}

/**
 * Get an observable emitting the current item stored under key.
 *
 * Uses an internal cache.
 *
 * @param storageArea - Storage area to get item from.
 * @param key - Key of the stored item.
 */
function getRootItem$<T>(storageArea: string, key: string): ItemObservable<T> {
    const cacheKey = `${storageArea}::${key}`;

    let root$ = rootCache[cacheKey];
    if (!root$ || root$.isStopped) {
        root$ = rootCache[cacheKey] = new ReplaySubject(1);
        createRootItem$(storageArea, key).subscribe(root$);
    }

    return root$;
}

/**
 * Get the current value of a root item in the storage.
 *
 * @param storageArea - Storage area to get item from
 * @param key - Key of item
 */
async function getCurrentRoot<T>(storageArea: string, key: string): Promise<Readonly<T> | undefined> {
    const root$ = getRootItem$<T>(storageArea, key);
    return await root$
        .pipe(first())
        .toPromise();
}

/**
 * Path for a namespace value.
 *
 * This can be a dot-separated string or an array of strings.
 *
 * Note that arrays must not contain items with dots in them.
 * This function doesn't check this, but it does break interoperability
 * between the two.
 */
export type Path = string | string[];

/**
 * Split a path into its parts.
 *
 * @param path - [[Path]] to split
 */
export function splitPath(path: Path): string[] {
    if (Array.isArray(path))
        return path;

    return path.split(".");
}

/**
 * Get an observable for the given path.
 *
 * @param storageArea - Storage area where the item is stored.
 * @param path - Dot-separated path.
 */
export function getItem$<T>(storageArea: string, path: Path): ItemObservable<T> {
    const [rootKey, ...nsKeys] = splitPath(path);

    const root$ = getRootItem$(storageArea, rootKey);

    return root$.pipe(
        map(value => nsGet<T>(value, nsKeys)),
        distinctUntilChanged(),
    );
}

/**
 * Internal implementation of non-root item setter.
 *
 * @param areaName - Storage area name to set item in
 * @param area - Storage area to set item in. This has to match the name, otherwise
 * weird bugs will happen. However it is never checked as this isn't a public function!
 * @param rootKey - Key of the root item.
 * @param nsKeys - Namespace path of the item.
 * @param value - Value to set for the given path.
 */
async function setItemInternal<T>(areaName: string, area: storage.StorageArea,
                                  rootKey: string, nsKeys: string[],
                                  value: T): Promise<void> {
    let newRoot;
    // no need to wait needlessly for the current root if we're replacing it anyway.
    if (nsKeys.length === 0) {
        newRoot = value;
    } else {
        const root = await getCurrentRoot(areaName, rootKey);
        newRoot = nsSet(root, nsKeys, value);
    }

    await storageSet(area, rootKey, newRoot);
}

/**
 * Set the current value of an item in the given storage area.
 *
 * @param storageArea - Storage area to set item in.
 * @param path - Path of the item to set
 * @param value - Value to insert
 */
export async function setItem<T>(storageArea: string, path: Path, value: T): Promise<void> {
    const area = getStorageArea(storageArea);
    const [rootKey, ...nsKeys] = splitPath(path);

    await setItemInternal(storageArea, area, rootKey, nsKeys, value);
}

/**
 * Function which can be used to set the value of an item simply by calling it.
 * Calling it with `undefined` deletes the item altogether.
 *
 * The second argument can be used to specify a relative path.
 */
export type ItemSetter<T> = (value: T | undefined, relativePath?: Path) => Promise<void>;

/**
 * Create an item setter function for the given path.
 *
 * @param storageArea - Storage area where the item is stored.
 * @param path - Dot-separated path.
 */
export function getItemSetter<T>(storageArea: string, path: Path): ItemSetter<T> {
    const area = getStorageArea(storageArea);
    const [rootKey, ...nsKeys] = splitPath(path);

    return (value: T | undefined, relativePath?: Path) => {
        let finalNSKeys: string[];

        if (relativePath === undefined)
            finalNSKeys = nsKeys;
        else
            finalNSKeys = [...nsKeys, ...splitPath(relativePath)];

        return setItemInternal(storageArea, area, rootKey, finalNSKeys, value);
    };
}

/**
 * Mutable item access containing the item observable and the item setter.
 */
export type MutItem<T> = [ItemObservable<T>, ItemSetter<T>];

/**
 * Get an observable and a setter function for the given path.
 *
 * This is just a convenience function for [[getItem$]] and [[getItemSetter]].
 *
 * @param storageArea - Storage area where the item is stored.
 * @param path - Dot-separated path.
 */
export function getMutItem$<T>(storageArea: string, path: Path): MutItem<T> {
    return [getItem$(storageArea, path), getItemSetter(storageArea, path)];
}

/**
 * Utility class which provides functions bound to a given storage area.
 *
 * @see [[getStorageAdapter]] to get an area adapter.
 */
export interface AreaAdapter {
    readonly areaName: string;

    getItem$<T>(path: Path): ItemObservable<T>;

    setItem<T>(path: Path, value: T): Promise<void>;

    getItemSetter<T>(path: Path): ItemSetter<T>;

    getMutItem$<T>(path: Path): [ItemObservable<T>, ItemSetter<T>];
}

/**
 * Get an [[AreaAdapter]] for the given storage area.
 *
 * @param areaName - Storage area to get adapter for.
 */
export function getStorageAdapter(areaName: string): AreaAdapter {
    // make sure the given storage area is valid.
    try {
        getStorageArea(areaName);
    } catch (e) {
        throw e;
    }

    return {
        areaName,
        getItem$: getItem$.bind(undefined, areaName) as AreaAdapter["getItem$"],
        getItemSetter: getItemSetter.bind(undefined, areaName),
        getMutItem$: getMutItem$.bind(undefined, areaName) as AreaAdapter["getMutItem$"],
        setItem: setItem.bind(undefined, areaName),
    };
}

const syncAdapter = getStorageAdapter(StorageAreaName.Sync);
export default syncAdapter;
