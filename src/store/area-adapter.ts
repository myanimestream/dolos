/**
 * Provides an adapter for a specific storage area which has the item methods.
 *
 * @module store
 */

/** @ignore */

import {getItem$, setItem, updateItem} from "./item";
import {getMutItem, MutItem} from "./mut-item";
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

    updateItem<T>(path: Path, value: T): Promise<void>;

    getMutItem<T>(path: Path): MutItem<T>;
}

/**
 * An implementation of [[AreaAdapterLike]] for the given storage area.
 *
 * The implementation works by binding the functions to the given area in the
 * constructor.
 */
export class AreaAdapter implements AreaAdapterLike {
    public readonly areaName: string;

    /** @inheritDoc */
    public getItem$: AreaAdapterLike["getItem$"];
    /** @inheritDoc */
    public setItem: AreaAdapterLike["setItem"];
    /** @inheritDoc */
    public updateItem: AreaAdapterLike["setItem"];
    /** @inheritDoc */
    public getMutItem: AreaAdapterLike["getMutItem"];

    constructor(areaName: string) {
        this.areaName = areaName;

        this.getItem$ = getItem$.bind(undefined, areaName) as AreaAdapterLike["getItem$"];
        this.getMutItem = getMutItem.bind(undefined, areaName) as AreaAdapterLike["getMutItem"];
        this.setItem = setItem.bind(undefined, areaName);
        this.updateItem = updateItem.bind(undefined, areaName);
    }
}
