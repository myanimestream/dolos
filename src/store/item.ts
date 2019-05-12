/**
 * High-level abstraction layer which allows access to the browser storage
 * as if it were a namespace.
 *
 * @module store
 */

import {Namespace} from "dolos/memory";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {getItem$Internal, setItemInternal} from "./item-internal";
import {nsWithDefaults, Path, splitPath} from "./namespace";
import {ItemObservable} from "./root";
import {getStorageArea} from "./storage";

/**
 * Get an observable for the given path.
 *
 * @param storageArea - Storage area where the item is stored.
 * @param path - Path to value.
 */
export function getItem$<T>(storageArea: string, path: Path): ItemObservable<T> {
    const [rootKey, ...nsKeys] = splitPath(path);
    return getItem$Internal(storageArea, rootKey, nsKeys);
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

    await setItemInternal(storageArea, area, rootKey, nsKeys, false, value);
}

/**
 * Update the current value of an item in the given storage area.
 * This differs from [[setItem]] insofar that it merges namespaces
 * instead of replacing them.
 * Other values are still replaced.
 *
 * @param storageArea - Storage area to set item in.
 * @param path - Path of the item to set
 * @param value - Value to insert.
 * Passing `undefined` will remove the value entirely.
 */
export async function updateItem<T>(storageArea: string, path: Path, value: T): Promise<void> {
    const area = getStorageArea(storageArea);
    const [rootKey, ...nsKeys] = splitPath(path);

    await setItemInternal(storageArea, area, rootKey, nsKeys, true, value);
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
