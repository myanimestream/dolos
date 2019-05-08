/**
 * Low-level interface for interacting with the storage directly.
 *
 * @module store
 */

/** @ignore */

import runtime = chrome.runtime;
import storage = chrome.storage;
import {fromExtensionEventPattern, mapArrayToObject} from "dolos/observable-utils";
import {Observable} from "rxjs";
import {filter, map} from "rxjs/operators";

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
 * Available storage areas.
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
 * Get the current value of an item in the given storage area.
 *
 * This is just a wrapper for the area's `get` method to use promises instead
 * of callbacks.
 *
 * @param area - Storage area to get the item from.
 * @param key - Key of item to get
 */
export async function storageGet<T>(area: storage.StorageArea, key: string): Promise<T | undefined> {
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
export async function storageSet<T>(area: storage.StorageArea, key: string, value: T | undefined): Promise<void> {
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
export function createRootItemChange$<T>(storageArea: string, key: string): Observable<storage.StorageChange> {
    return globalItemChange$.pipe(
        filter(value => value.areaName === storageArea && key in value.changes),
        map(value => value.changes[key]),
    );
}
