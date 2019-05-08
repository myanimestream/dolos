/**
 * The storage mock module does have a virtual storage which is shared between all areas,
 * but it does not fire the onChanged event!
 *
 * All implementations are synchronous too, so there's no need to wait for callbacks
 */

import AsyncLock from "dolos/lock";
import {clearRootCache} from "dolos/store/root";
import {GlobalChangeEvent} from "dolos/store/storage";

export function cleanup() {
    // clear storage again. All storage areas use the same virtual storage
    // in the mock module.
    chrome.storage.local.clear();

    jest.clearAllMocks();
    clearRootCache();
}

// we need a lock to make sure only one test does something at a time
export const testLock = new AsyncLock();

export function testWithLock(cb: () => any): () => any {
    return () => testLock.withLock(() => {
        cleanup();
        return cb();
    });
}

let currentRootKey: number = 0;

export function uniqueRootKey(): string {
    return `root${currentRootKey++}`;
}

// Test the given limitations of the storage module mock
// Some differences are actually required for the tests
test("environment", testWithLock(async () => {
    const key = uniqueRootKey();

    const updates: GlobalChangeEvent[] = [];

    chrome.storage.onChanged.addListener((changes, areaName) => updates.push({
        areaName,
        changes,
    }));

    chrome.storage.sync.set({[key]: 5});
    const value = await new Promise(res => chrome.storage.local.get(key, res));

    // make sure the areas use the same virtual storage
    expect(value).toEqual({[key]: 5});

    // make sure that the onChanged event isn't fired!
    expect(updates.length).toBe(0);

}));
