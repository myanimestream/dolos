/**
 * Provides an adapter for a specific storage area which has the item methods.
 *
 * @module store
 */

/** @ignore */

import {getItem$, getItemSetter, getMutItem$, ItemSetter, setItem} from "./item";
import {Path} from "./namespace";
import {ItemObservable} from "./root";

/**
 * Utility class which provides functions bound to a given storage area.
 *
 * @see [[AreaAdapter]] for an implementation
 */
export interface AreaAdapterLike {
    readonly areaName: string;

    getItem$<T>(path: Path): ItemObservable<T>;

    setItem<T>(path: Path, value: T): Promise<void>;

    getItemSetter<T>(path: Path): ItemSetter<T>;

    getMutItem$<T>(path: Path): [ItemObservable<T>, ItemSetter<T>];
}

/**
 * An implementation of [[AreaAdapterLike]] for the given storage area.
 *
 * The implementation works by binding the functions to the given area in the
 * constructor.
 */
export class AreaAdapter implements AreaAdapterLike {
    public readonly areaName: string;

    public getItem$: AreaAdapterLike["getItem$"];
    public setItem: AreaAdapterLike["setItem"];
    public getItemSetter: AreaAdapterLike["getItemSetter"];
    public getMutItem$: AreaAdapterLike["getMutItem$"];

    constructor(areaName: string) {
        this.areaName = areaName;

        this.getItem$ = getItem$.bind(undefined, areaName) as AreaAdapterLike["getItem$"];
        this.getItemSetter = getItemSetter.bind(undefined, areaName);
        this.getMutItem$ = getMutItem$.bind(undefined, areaName) as AreaAdapterLike["getMutItem$"];
        this.setItem = setItem.bind(undefined, areaName);
    }
}
