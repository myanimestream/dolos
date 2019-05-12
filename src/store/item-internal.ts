/**
 * Internal item which are reused between different high-level abstractions.
 *
 * @module store
 */

/** @ignore */

import {distinctUntilChanged, map} from "rxjs/operators";
import {nsGet, nsMergeNested, nsWithValue} from "./namespace";
import {getCurrentRoot, getRootItem$, ItemObservable} from "./root";
import {storageSet} from "./storage";
import storage = chrome.storage;

/**
 * Internal implementation of non-root item getter.
 *
 * @param storageArea - Storage area where the item is stored.
 * @param rootKey - Key of the root item.
 * @param nsKeys - Namespace path of the item.
 */
export function getItem$Internal<T>(storageArea: string, rootKey: string, nsKeys: string[]): ItemObservable<T> {
    const root$ = getRootItem$(storageArea, rootKey);

    return root$.pipe(
        map(value => nsGet<T>(value, nsKeys)),
        // this is probably useless since we can expect to pass objects through
        // this, but eh.
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
 * @param update - Whether or not to update the previous value instead of
 * replacing it. This only affects namespace values.
 * @param value - Value to set for the given path. If the value is undefined
 * it's removed.
 */
export async function setItemInternal<T>(areaName: string, area: storage.StorageArea,
                                         rootKey: string, nsKeys: string[],
                                         update: boolean,
                                         value: T | undefined): Promise<void> {
    let newRoot;
    // don't wait needlessly for the current root if we're replacing it anyway.
    if (!update && nsKeys.length === 0) {
        newRoot = value;
    } else {
        const root = await getCurrentRoot(areaName, rootKey);

        if (update)
            newRoot = nsMergeNested(root, nsKeys, value);
        else
            newRoot = nsWithValue(root, nsKeys, value);
    }

    await storageSet(area, rootKey, newRoot);
}
