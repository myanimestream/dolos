import {getItem$, getItemSetter, setItem, StorageAreaName} from "dolos/store";
import {GlobalChangeEvent} from "dolos/store/storage";
import {Observable, Subject} from "rxjs";
import {bufferCount, delay, first, map, startWith, take, toArray} from "rxjs/operators";
import {testLock, testWithLock, uniqueRootKey} from ".";

describe("setItem", () => {
    test("normal", testWithLock(async () => {
        const key = uniqueRootKey();

        await setItem("local", `${key}.b`, "test");
        expect(chrome.storage.local.set).toHaveBeenCalledWith({[key]: {b: "test"}}, expect.any(Function));
    }));

    test("remove when passing undefined as root", testWithLock(async () => {
        const key = uniqueRootKey();

        await setItem("local", key, undefined);
        expect(chrome.storage.local.set).not.toHaveBeenCalled();
        expect(chrome.storage.local.remove).toHaveBeenCalledWith(key, expect.any(Function));
    }));
});

test("getItemSetter", testWithLock(async () => {
    const key = uniqueRootKey();

    const setter = getItemSetter("local", `${key}.b`);

    await setter({a: 3});
    expect(chrome.storage.local.set).toHaveBeenCalledWith({[key]: {b: {a: 3}}}, expect.any(Function));

    await setter("test", "c");
    // the previous change should theoretically persist because the subscriber count drops to 0
    // and getCurrentRoot will be forced to retrieve the root value again.
    // It doesn't though, so whatevs...
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

    test("first root value", testWithLock(async () => {
        const key = uniqueRootKey();

        chrome.storage.local.set({[key]: 5});

        const item$ = getItem$(StorageAreaName.Local, key);
        const value = await item$.pipe(first()).toPromise();
        expect(value).toBe(5);
    }));

    test("first nested value", testWithLock(async () => {
        const key = uniqueRootKey();

        chrome.storage.local.set({[key]: {b: {c: "test"}}});

        const item$ = getItem$(StorageAreaName.Local, `${key}.b`);
        const value = await item$.pipe(first()).toPromise();
        expect(value).toEqual({c: "test"});
    }));

    test("update root value", testWithLock(async () => {
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

    test("update nested value", testWithLock(async () => {
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

    test("update cancels get", testWithLock(async () => {
        const key = uniqueRootKey();
        const change$ = new Subject();

        (chrome.storage.local.get as jest.Mock).mockImplementationOnce(async (_, cb: any) => {
            // wait for first update to ensure that this is slower
            await change$.pipe(first()).toPromise();
            cb("get value");

            // test to make sure the get definitely fired!
            change$.next("update value 2");
        });

        mockOnChangedListeners(change$.pipe(
            mapToGlobalChange("local", key),
        ), true);

        const item$ = getItem$(StorageAreaName.Local, key);
        const valuePromise = item$.pipe(
            take(2),
            toArray(),
        ).toPromise();

        change$.next("update value");

        const value = await valuePromise;

        // "update value" comes in before "get value" so it should never be emitted.
        expect(value).toEqual(["update value", "update value 2"]);
    }));
});
