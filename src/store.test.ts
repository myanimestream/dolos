import Store, {isPrimitive, StoreElement, StoreElementProxy} from "./store";

beforeEach(() => jest.clearAllMocks());

test("isPrimitive", () => {
    expect(isPrimitive(null)).toBeTruthy();
    expect(isPrimitive(undefined)).toBeTruthy();
    expect(isPrimitive("value")).toBeTruthy();
    expect(isPrimitive(5)).toBeTruthy();

    expect(isPrimitive({})).toBeFalsy();
    expect(isPrimitive([])).toBeFalsy();
});

test("StoreElementTraps", () => {
    // @ts-ignore
    const element = new StoreElement.create(null, {test: 5});

    expect(element.test).toBe(5);
    expect("test" in element).toBeTruthy();
    expect(Object.keys(element)).toEqual(["test"]);
});


test("Store object", async () => {
    const key = "test";

    const test = await Store.get(key) as StoreElementProxy<any>;
    expect(chrome.storage.sync.get).toHaveBeenCalled();

    expect(test).toBeTruthy();
    expect(test.rawValue).toEqual({});

    // @ts-ignore
    test.value = 5;
    test.test = "value";
    expect(test.rawValue).toEqual({value: 5, test: "value"});

    expect(chrome.storage.sync.set).toHaveBeenCalled();

    // @ts-ignore
    await Store.handleValueChanged({[key]: {newValue: {value: 6}}});

    expect(test.value).toBe(6);
    expect(test.test).toBeUndefined();
});

test("Store array", async () => {
    const key = "test2";

    const test = await Store.get(key, []);
    expect(chrome.storage.sync.get).toHaveBeenCalled();

    expect(test).toBeTruthy();
    expect(test.rawValue).toEqual([]);

    // @ts-ignore
    test.push(5);
    expect(test.rawValue).toEqual([5]);

    expect(chrome.storage.sync.set).toHaveBeenCalled();

    // @ts-ignore
    await Store.handleValueChanged({[key]: {newValue: [6]}});

    expect(test[0]).toBe(6);
});

test("Store deep", async () => {
    const key = "deep";

    let value = {
        map: {
            a: [3],
            b: "b",
            c: {
                nested: true,
            }
        },
        items: [
            5,
            4,
            3,
            {
                a: 5,
            }
        ]
    };

    const test = await Store.get(key, value);

    const map = test.map;
    const mapA = map.a;
    const mapC = map.c;

    const items = test.items;
    const itemsLast = items[items.length - 1];

    // @ts-ignore
    expect(map.rawValue).toEqual(value.map);

    value.map.c.nested = false;
    // @ts-ignore
    await Store.handleValueChanged({[key]: {newValue: value}});

    expect(mapC.nested).toBeFalsy();
    expect(map.c).toBe(mapC);
    expect(test.rawValue).toEqual(value);


    value.items[0] = 15;
    // @ts-ignore
    await Store.handleValueChanged({[key]: {newValue: value}});

    expect(items[0]).toBe(15);
    expect(items[items.length - 1]).toBe(itemsLast);
    expect(test.rawValue).toEqual(value);

    mapA.push(5, 8, 13, 21);
    // @ts-ignore
    expect(mapA.rawValue).toEqual([3, 5, 8, 13, 21]);

    // @ts-ignore
    mapA.push({
        new: "yes",
    });

    expect(mapA[mapA.length - 1]).toBeInstanceOf(StoreElement);

    value = test.rawValue;
    // @ts-ignore
    value["newProxyObj"] = {
        yes: "it works"
    };
    // @ts-ignore
    value["newProxyList"] = ["yes", "please", "work"];
    // @ts-ignore
    await Store.handleValueChanged({[key]: {newValue: value}});

    // @ts-ignore
    expect(test.newProxyObj).toBeInstanceOf(StoreElement);
    // @ts-ignore
    expect(test.newProxyList).toBeInstanceOf(StoreElement);
});