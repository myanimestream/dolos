import {getItem$, StorageAreaName} from "dolos/store";
import {clearRootCache} from "dolos/store/root";
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
