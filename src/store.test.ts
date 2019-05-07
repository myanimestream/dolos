/**
 * The storage mock module does have a virtual storage which is shared between all areas,
 * but it does not fire the onChanged event!
 *
 * All implementations are synchronous too, so there's no need to wait for callbacks
 */

import {Observable, Subject} from "rxjs";
import {bufferCount, delay, first, map, startWith, take, toArray} from "rxjs/operators";
import AsyncLock from "./lock";
import {
    clearRootCache,
    getItem$,
    getItemSetter,
    getStorageArea,
    GlobalChangeEvent,
    nsGet,
    nsSet,
    setItem,
    StorageAreaName
} from "./store";

function cleanup() {
    // clear storage again. All storage areas use the same virtual storage
    // in the mock module.
    chrome.storage.local.clear();

    jest.clearAllMocks();
    clearRootCache();
}

// we need a lock to make sure only one test does something at a time
const testLock = new AsyncLock();

function withTestLock(cb: () => any): () => any {
    return () => testLock.withLock(() => {
        cleanup();
        return cb();
    });
}

let currentRootKey: number = 0;

function uniqueRootKey(): string {
    return `root${currentRootKey++}`;
}

// Test the given limitations of the storage module mock
// Some differences are actually required for the tests
test("environment", withTestLock(async () => {
    const key = uniqueRootKey();

    const updates: GlobalChangeEvent[] = [];

    chrome.storage.onChanged.addListener((changes, areaName) => updates.push({
        changes,
        areaName,
    }));

    chrome.storage.sync.set({[key]: 5});
    const value = await new Promise(res => chrome.storage.local.get(key, res));

    // make sure the areas use the same virtual storage
    expect(value).toEqual({[key]: 5});

    // make sure that the onChanged event isn't fired!
    expect(updates.length).toBe(0);

}));

test("getStorageArea", () => {
    expect(getStorageArea("sync")).toBe(chrome.storage.sync);
    expect(getStorageArea("local")).toBe(chrome.storage.local);
    expect(() => getStorageArea("test"))
        .toThrow("Invalid storage area: test");

    expect(getStorageArea(StorageAreaName.Sync)).toBe(chrome.storage.sync);
    expect(getStorageArea(StorageAreaName.Local)).toBe(chrome.storage.local);
    expect(getStorageArea(StorageAreaName.Managed)).toBe(chrome.storage.managed);
});

test("nsGet", () => {
    const ns = {a: {b: "hello"}};

    expect(nsGet(ns, ["a", "b"])).toBe("hello");
    expect(nsGet(ns, ["a", "c"])).toBe(undefined);
    expect(nsGet(ns, ["a", "b", "c"])).toBe(undefined);
    expect(nsGet(ns, [])).toBe(ns);
});

test("nsSet", () => {
    const ns = {a: {b: "hello"}};

    const originalNSClone = JSON.parse(JSON.stringify(ns));

    expect(nsSet(ns, [], "test")).toBe("test");
    expect(nsSet(undefined, ["a"], "test")).toEqual({
        a: "test"
    });

    const updated = nsSet(ns, ["a", "b"], "test");
    expect(updated).not.toBe(ns);
    expect(updated).toEqual(
        {a: {b: "test"}}
    );

    expect(nsSet(ns, ["a", "c", "d"], {a: "some value"})).toEqual({
        a: {
            b: "hello",
            c: {d: {a: "some value"}}
        }
    });

    // make sure we didn't mutate the original!
    expect(ns).toEqual(originalNSClone);
});

describe("setItem", () => {
    test("normal", withTestLock(async () => {
        const key = uniqueRootKey();

        await setItem("local", `${key}.b`, "test");
        expect(chrome.storage.local.set).toHaveBeenCalledWith({[key]: {b: "test"}}, expect.any(Function));
    }));

    test("remove when passing undefined", withTestLock(async () => {
        const key = uniqueRootKey();

        await setItem("local", key, undefined);
        expect(chrome.storage.local.set).not.toHaveBeenCalled();
        expect(chrome.storage.local.remove).toHaveBeenCalledWith(key, expect.any(Function));
    }));
});

test("getItemSetter", withTestLock(async () => {
    const key = uniqueRootKey();

    const setter = getItemSetter("local", `${key}.b`);

    await setter({a: 3});
    expect(chrome.storage.local.set).toHaveBeenCalledWith({[key]: {b: {a: 3}}}, expect.any(Function));

    await setter("test", "c");
    // because the mock doesn't emit change events we can't expect the previous change to persist!
    expect(chrome.storage.local.set).toHaveBeenCalledWith({[key]: {b: {c: "test"}}}, expect.any(Function));
}));

describe("getItem$", () => {
    function mapToGlobalChange(areaName: string, rootKey: string, startValue?: any):
        (source: Observable<any>) => Observable<GlobalChangeEvent> {
        return source => source.pipe(
            // TS thinks startValue is of type SchedulerLike which is deprecated.
            startWith(startValue as unknown),
            bufferCount(2, 1),
            map(([prev, curr]) => ({
                changes: {[rootKey]: {oldValue: prev, newValue: curr}},
                areaName: areaName
            } as GlobalChangeEvent)),
        );
    }

    function mockOnChangedListeners<T>(change$: Observable<GlobalChangeEvent>, noDelay?: boolean): void {
        if (!testLock.isLocked()) throw new Error("testLock must be acquired for this");

        if (!noDelay)
            change$ = change$.pipe(delay(0));

        (chrome.storage.onChanged.addListener as jest.Mock)
            .mockImplementation(cb => {
                    // simulate a delay!
                    return change$
                        .subscribe(change => cb(change.changes, change.areaName));
                }
            );
    }

    test("first root value", withTestLock(async () => {
        const key = uniqueRootKey();

        chrome.storage.local.set({[key]: 5});

        const item$ = getItem$(StorageAreaName.Local, key);
        const value = await item$.pipe(first()).toPromise();
        expect(value).toBe(5);
    }));

    test("first nested value", withTestLock(async () => {
        const key = uniqueRootKey();

        chrome.storage.local.set({[key]: {b: {c: "test"}}});

        const item$ = getItem$(StorageAreaName.Local, `${key}.b`);
        const value = await item$.pipe(first()).toPromise();
        expect(value).toEqual({c: "test"});
    }));

    test("update root value", withTestLock(async () => {
        const key = uniqueRootKey();

        const change$ = new Subject();
        mockOnChangedListeners(change$.pipe(mapToGlobalChange("local", key)));

        const item$ = getItem$(StorageAreaName.Local, key);
        const itemsPromise = item$.pipe(
            take(3),
            toArray(),
        ).toPromise();

        change$.next({a: 5});
        change$.next({a: 6, b: 3});

        expect(await itemsPromise).toEqual([
            undefined,
            {a: 5},
            {a: 6, b: 3},
        ]);
    }));

    test("update nested value", withTestLock(async () => {
        const key = uniqueRootKey();

        chrome.storage.local.set({[key]: {a: {d: "test"}}});

        const change$ = new Subject();
        mockOnChangedListeners(change$.pipe(
            mapToGlobalChange("local", key, {a: {d: "test"}}),
        ));

        const item$ = getItem$(StorageAreaName.Local, [key, "a", "d"]);
        const itemsPromise = item$.pipe(
            take(3),
            toArray(),
        ).toPromise();

        // ensure that it emits undefined if the value was deleted
        change$.next({a: {}});
        change$.next({a: {d: {a: 6, b: 3}}});

        expect(await itemsPromise).toEqual([
            "test",
            undefined,
            {a: 6, b: 3},
        ]);
    }));

    test("update cancels get", withTestLock(async () => {
        const key = uniqueRootKey();
        const change$ = new Subject();

        (chrome.storage.local.get as jest.Mock).mockImplementationOnce(async (_, cb: any) => {
            // wait 50ms to ensure that this is slower than the following update
            await new Promise(res => setTimeout(res, 50));
            cb("get value");

            // test to make sure the get definitely fired!
            change$.next("update value 2");
        });

        mockOnChangedListeners(change$.pipe(
            mapToGlobalChange("local", key),
        ), true);

        const item$ = getItem$(StorageAreaName.Local, key);
        change$.next("update value");

        const value = await item$.pipe(
            take(2),
            toArray(),
        ).toPromise();

        // "update value" comes in before "get value" so it should never be emitted.
        expect(value).toEqual(["update value", "update value 2"]);
    }));
});

test("clearRootCache", withTestLock(async () => {
    const key = uniqueRootKey();

    async function setCurrent(value: any) {
        await new Promise(res => chrome.storage.local.set({[key]: value}, res));
    }

    async function getCurrent(): Promise<any> {
        return await getItem$(StorageAreaName.Local, key).pipe(first()).toPromise();
    }

    await setCurrent(3);
    expect(await getCurrent()).toBe(3);

    // shouldn't update the current value because the root is cached
    // and the onChanged event doesn't fire.
    await setCurrent(5);
    expect(await getCurrent()).toBe(3);

    clearRootCache();

    // after the root cache is cleared it should update
    expect(await getCurrent()).toBe(5);
}));

// TODO test area adapters
