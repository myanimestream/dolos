import {StorageAreaName} from "dolos/store";
import {clearRootCache, getRootItem$} from "dolos/store/root";
import {first} from "rxjs/operators";
import {testWithLock, uniqueRootKey} from ".";

test("clearRootCache", testWithLock(async () => {
    const key = uniqueRootKey();

    const item1$ = getRootItem$(StorageAreaName.Local, key);
    const item2$ = getRootItem$(StorageAreaName.Local, key);

    clearRootCache();

    const item3$ = getRootItem$(StorageAreaName.Local, key);

    expect(item1$).toBe(item2$);
    expect(item2$).not.toBe(item3$);
}));

test("items are immutable", async () => {
    const key = uniqueRootKey();

    chrome.storage.sync.set({[key]: {a: 1}});

    const value: any = await getRootItem$(StorageAreaName.Sync, key).pipe(first()).toPromise();

    expect(value).toEqual({a: 1});

    expect(() => value["a"] = 5).toThrow("Cannot assign to read only property 'a' of object '#<Object>'");
    expect(() => value["test"] = 5).toThrow("Cannot add property test, object is not extensible");
});
