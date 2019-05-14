/**
 * @module store
 */

/** @ignore */

import {getItem$Internal, setItemInternal} from "./item-internal";
import {Path, splitPath} from "./namespace";
import {ItemObservable} from "./root";
import {getStorageArea} from "./storage";
import storage = chrome.storage;

/**
 * Can be used to set the value of an item.
 */
export class MutItem<T> {
    private readonly rootKey: string;
    private readonly nsKeys: string[];

    private _areaName: string;
    private _area: storage.StorageArea;

    private readonly _value$: ItemObservable<T>;

    constructor(areaName: string, path: Path);
    constructor(args: { areaName: string, rootKey: string, nsKeys: Path });

    constructor(...args: any[]) {
        let areaName: string;
        let rootKey: string;
        let nsKeys: string[];

        switch (args.length) {
            case 1:
                ({areaName, rootKey, nsKeys} = args[0]);
                break;

            case 2:
                areaName = args[0];
                ([rootKey, ...nsKeys] = splitPath(args[1]));
                break;

            default:
                throw Error("Invalid number of arguments");
        }

        this._area = getStorageArea(areaName);
        this._areaName = areaName;

        this.rootKey = rootKey;
        this.nsKeys = nsKeys;

        this._value$ = getItem$Internal(this._areaName, this.rootKey, this.nsKeys);
    }

    /**
     * Storage area name.
     */
    public get areaName(): string {
        return this._areaName;
    }

    public set areaName(areaName: string) {
        this._area = getStorageArea(areaName);
        this._areaName = areaName;
    }

    /**
     * Current path which is set by the item setter.
     */
    public get path(): string {
        return this.pathParts.join(".");
    }

    /**
     * Current path which is set by the item setter.
     */
    public get pathParts(): string[] {
        return [this.rootKey, ...this.nsKeys];
    }

    // TODO test

    /**
     * Observable for the value which is accessed.
     */
    public get value$(): ItemObservable<T> {
        return this._value$;
    }

    public set(value: T | undefined): Promise<void>;
    public set(value: any, relativePath: Path): Promise<void>;
    /**
     * Set the value.
     *
     * @param value - Value to set
     * @param relativePath - Specify the path relative to the item setter's path
     */
    public set(value: any, relativePath?: Path): Promise<void> {
        return this.setOrUpdate(value, relativePath, false);
    }

    public update(value: Partial<T> | undefined): Promise<void>;
    public update(value: any, relativePath: Path): Promise<void>;
    /**
     * Update the value.
     * This behaves differently from [[set]] for namespaces.
     * Instead of overwriting the namespace, it only overwrites
     * values specified in the value namespace.
     *
     * @param value - Value to update the current value with
     * @param relativePath - Specify the path relative to the item setter's path
     */
    public update(value: any, relativePath?: Path): Promise<void> {
        return this.setOrUpdate(value, relativePath, true);
    }

    /**
     * Get a new item setter with a path relative to the current one.
     *
     * @param relativePath - Relative location for the new path.
     */
    public withPath<V>(relativePath: Path): MutItem<V> {
        const nsKeys = this.getNSKeys(relativePath);

        return new MutItem<V>({
            areaName: this._areaName,
            rootKey: this.rootKey,

            nsKeys,
        });
    }

    private getNSKeys(relativePath?: Path): string[] {
        if (relativePath === undefined)
            return this.nsKeys;
        else
            return this.nsKeys.concat(splitPath(relativePath));
    }

    private setOrUpdate(value: any, relativePath: Path | undefined, update: boolean): Promise<void> {
        return setItemInternal(this._areaName, this._area, this.rootKey,
            this.getNSKeys(relativePath), update, value);
    }
}

/**
 * Create a mutable item for the given path.
 *
 * @param storageArea - Storage area where the item is stored.
 * @param path - Dot-separated path.
 */
export function getMutItem<T>(storageArea: string, path: Path): MutItem<T> {
    return new MutItem<T>(storageArea, path);
}
