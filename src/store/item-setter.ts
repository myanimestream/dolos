import {getItem$} from "./item";
import {setItemInternal} from "./item-internal";
import {Path, splitPath} from "./namespace";
import {ItemObservable} from "./root";
import {getStorageArea} from "./storage";
import storage = chrome.storage;

/**
 * Function which can be used to set the value of an item simply by calling it.
 * Calling it with `undefined` deletes the item altogether.
 *
 * The second argument can be used to specify a relative path.
 */
export class ItemSetter<T> {
    public readonly rootKey: string;
    public readonly nsKeys: string[];

    private _areaName: string;
    private _area: storage.StorageArea;

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
    }

    public get areaName(): string {
        return this._areaName;
    }

    public set areaName(areaName: string) {
        this._area = getStorageArea(areaName);
        this._areaName = areaName;
    }

    public get path(): string[] {
        return [this.rootKey, ...this.nsKeys];
    }

    public set(value: T | undefined): Promise<void>;
    public set(value: any, relativePath: Path): Promise<void>;

    public set(value: any, relativePath?: Path): Promise<void> {
        return this.setOrUpdate(value, relativePath, false);
    }

    public update(value: Partial<T> | undefined): Promise<void>;
    public update(value: any, relativePath: Path): Promise<void>;

    public update(value: any, relativePath?: Path): Promise<void> {
        return this.setOrUpdate(value, relativePath, true);
    }

    public withPath<V>(relativePath: Path): ItemSetter<V> {
        const nsKeys = this.nsKeys.concat(relativePath);

        return new ItemSetter<V>({
            areaName: this._areaName,
            rootKey: this.rootKey,

            nsKeys,
        });
    }

    private setOrUpdate(value: any, relativePath: Path | undefined, update: boolean): Promise<void> {
        let nsKeys: string[];

        if (relativePath === undefined)
            nsKeys = this.nsKeys;
        else
            nsKeys = this.nsKeys.concat(splitPath(relativePath));

        return setItemInternal(this._areaName, this._area, this.rootKey, nsKeys, update, value);
    }
}

/**
 * Create an item setter function for the given path.
 *
 * @param storageArea - Storage area where the item is stored.
 * @param path - Dot-separated path.
 */
export function getItemSetter<T>(storageArea: string, path: Path): ItemSetter<T> {
    return new ItemSetter<T>(storageArea, path);
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
