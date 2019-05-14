/**
 * Debug utilities for the store.
 *
 * @module store/debug
 */

/** @ignore */

import {concat, defer, Observable} from "rxjs";
import {filter, map, mapTo, tap} from "rxjs/operators";
import {ReadObservable} from "./dolos-store";
import {MutItem} from "./mut-item";
import {Namespace} from "./namespace";
import {getRootChange$, getStorageArea, storageGetAll} from "./storage";

/**
 * Create an observable which observes the root storage unit by first getting
 * all root items and then monitoring the global changes to catch changes,
 * additions and removals of root items.
 *
 * The emitted value is always the same namespace, but its entries are
 * modified and deleted accordingly.
 *
 * @param areaName - Storage area to get root of.
 */
function createRoot$(areaName: string): ReadObservable<Namespace> {
    const area = getStorageArea(areaName);

    const initial$ = defer(() => storageGetAll(area));
    const change$ = getRootChange$(areaName);

    const currentRoot: { [key: string]: any } = {};

    return concat(initial$, change$).pipe(
        map(root => {
            for (const [key, value] of Object.entries(root)) {
                if (value === undefined) delete currentRoot[key];
                else currentRoot[key] = value;
            }

            return currentRoot;
        }),
    );
}

/**
 * Array of [[MutItem]] instances.
 */
export type MutItemArray<T> = ReadonlyArray<MutItem<T>>;

/**
 * Get an Observable of an array of [[MutItem]] for each root item in the
 * storage.
 *
 * The observable emits the same array instance each time a new root is added
 * or removed and the MutItem instances in it are guaranteed to stay the same
 * given that they aren't removed.
 *
 * @param areaName - Storage area to get roots for.
 */
export function createAllMutRootItems$(areaName: string): Observable<MutItemArray<any>> {
    const currentRootKeys: Set<string> = new Set();
    const items: Array<MutItem<any>> = [];

    return createRoot$(areaName).pipe(
        map(root => Object.keys(root)),
        map(rootKeys => rootKeys.filter(key => !currentRootKeys.has(key))),
        filter(newRootKeys => newRootKeys.length > 0),
        tap(newRootKeys => newRootKeys.forEach(key => {
            items.push(new MutItem({areaName, rootKey: key, nsKeys: []}));
            currentRootKeys.add(key);
        })),
        mapTo(items),
    );
}
