import {getMutItem} from "dolos/store";
import {testWithLock, uniqueRootKey} from ".";

describe("getMutItem", () => {
    test("set", testWithLock(async () => {
        const key = uniqueRootKey();

        const setter = getMutItem("local", `${key}.b`);

        await setter.set({a: 3});
        expect(chrome.storage.local.set).toHaveBeenCalledWith({[key]: {b: {a: 3}}}, expect.any(Function));

        await setter.set("test", "c");
        // the previous change persists because the subscriber count drops to 0
        // and getCurrentRoot will be forced to retrieve the root value again.
        expect(chrome.storage.local.set).toHaveBeenCalledWith({[key]: {b: {a: 3, c: "test"}}}, expect.any(Function));
    }));

    test("update", testWithLock(async () => {
        const key = uniqueRootKey();

        const setter = getMutItem("local", `${key}.b`);

        await setter.set({a: 3});

        await setter.update({c: "test"});
        expect(chrome.storage.local.set).toHaveBeenCalledWith({[key]: {b: {a: 3, c: "test"}}}, expect.any(Function));
    }));

    test("withPath", testWithLock(async () => {
        const key = uniqueRootKey();
        const setter = getMutItem("local", `${key}.b`);
        const newSetter = setter.withPath("c");

        await newSetter.set("test2");
        expect(chrome.storage.local.set).toHaveBeenCalledWith({[key]: {b: {c: "test2"}}}, expect.any(Function));
    }));
});
