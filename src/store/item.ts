/**
 * High-level abstraction layer which allows access to the browser storage
 * as if it were a namespace.
 *
 * @module store
 */

/** @ignore */

import storage = chrome.storage;
import {Namespace} from "dolos/memory";
import {Observable} from "rxjs";
import {distinctUntilChanged, map} from "rxjs/operators";
import {nsGet, nsWithDefaults, nsWithoutValue, nsWithValue, Path, splitPath} from "./namespace";
import {getCurrentRoot, getRootItem$, ItemObservable} from "./root";
import {getStorageArea, storageSet} from "./storage";

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
 * @param area - Storage area to set item in. This has to match the name,
 * otherwise weird bugs will happen. However it is never checked as this isn't
 * a public function!
 * @param rootKey - Key of the root item.
 * @param nsKeys - Namespace path of the item.
 * @param value - Value to set for the given path. If the value is undefined
 * it's removed.
 */
async function setItemInternal<T>(areaName: string, area: storage.StorageArea,
                                  rootKey: string, nsKeys: string[],
                                  value: T | undefined): Promise<void> {
    let newRoot;
    // don't wait needlessly for the current root if we're replacing it anyway.
    if (nsKeys.length === 0) {
        newRoot = value;
    } else {
        const root = await getCurrentRoot(areaName, rootKey);

        if (value === undefined)
            newRoot = nsWithoutValue(root, nsKeys);
        else
            newRoot = nsWithValue(root, nsKeys, value);
    }

    await storageSet(area, rootKey, newRoot);
}

/**
 * Set the current value of an item in the given storage area.
 *
 * @param storageArea - Storage area to set item in.
 * @param path - Path of the item to set
 * @param value - Value to insert.
 * Passing `undefined` will remove the value entirely.
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
export interface ItemSetter<T> {
    (value: T | undefined): Promise<void>;

    (value: any, relativePath: Path): Promise<void>;
}

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
 * Observable operator which applies the given defaults to all values.
 *
 * @param defaults - Defaults to provide to the [[nsWithDefaults]] function.
 */
export function applyDefaults<T, V extends Namespace>(defaults: V):
    (item$: ItemObservable<T>) => Observable<Readonly<V>> {
    return map(item => nsWithDefaults(item, defaults));
}
