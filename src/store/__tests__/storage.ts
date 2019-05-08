import {getStorageArea, StorageAreaName} from "dolos/store/storage";

test("getStorageArea", () => {
    expect(getStorageArea("sync")).toBe(chrome.storage.sync);
    expect(getStorageArea("local")).toBe(chrome.storage.local);
    expect(() => getStorageArea("test"))
        .toThrow("Invalid storage area: test");

    expect(getStorageArea(StorageAreaName.Sync)).toBe(chrome.storage.sync);
    expect(getStorageArea(StorageAreaName.Local)).toBe(chrome.storage.local);
    expect(getStorageArea(StorageAreaName.Managed)).toBe(chrome.storage.managed);
});
