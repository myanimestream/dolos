import {getItem$, StorageAreaName} from "dolos/store";
import {clearRootCache, getRootItem$} from "dolos/store/root";
import {first} from "rxjs/operators";
import {testWithLock, uniqueRootKey} from ".";

test("clearRootCache", testWithLock(async () => {
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

test("items are immutable", async () => {
    const key = uniqueRootKey();

    chrome.storage.sync.set({[key]: {a: 1}});

    const value: any = await getRootItem$(StorageAreaName.Sync, key).pipe(first()).toPromise();

    expect(value).toEqual({a: 1});

    expect(() => value["a"] = 5).toThrow("Cannot assign to read only property 'a' of object '#<Object>'");
    expect(() => value["test"] = 5).toThrow("Cannot add property test, object is not extensible");
});
