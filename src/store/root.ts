/**
 * First abstraction layer which only deals with root items.
 *
 * @module store
 */

/** @ignore */

import {from, merge, Observable, ReplaySubject, Subject} from "rxjs";
import {first, map, takeUntil} from "rxjs/operators";
import {nsFreeze} from "./namespace";
import {createRootItemChange$, getStorageArea, storageGet} from "./storage";

/**
 * Observable which emits the current value of the item.
 *
 * The value is either the currently stored value or `undefined` if the
 * item doesn't exist.
 *
 * The value is also read only! If you wish to change the value, use the
 * [[setItem]] function, or an [[ItemSetter]] from [[getItemSetter]].
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
        .pipe(map(change => change.newValue));

    // get current value from the storage,
    // but abort if an update comes in first!
    const item$ = from(storageGet(area, key))
        .pipe(takeUntil(change$));

    return merge(item$, change$).pipe(
        map(item => nsFreeze(item)),
    );
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
export function getRootItem$<T>(storageArea: string, key: string): ItemObservable<T> {
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
export async function getCurrentRoot<T>(storageArea: string, key: string): Promise<Readonly<T> | undefined> {
    const root$ = getRootItem$<T>(storageArea, key);
    return await root$
        .pipe(first())
        .toPromise();
}
