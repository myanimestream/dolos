import {isNS, nsGet, nsWithDefaults, nsWithoutValue, nsWithValue, splitPath} from "dolos/store/namespace";

test("splitPath", () => {
    expect(splitPath("a..a.b.test")).toEqual(["a", "", "a", "b", "test"]);
    expect(splitPath(["a", "b", "c"])).toEqual(["a", "b", "c"]);
    expect(splitPath(["a", "b.c", "d.e", "test"])).toEqual(["a", "b", "c", "d", "e", "test"]);
});

test("isNS", () => {
    ["test", null, undefined, [], NaN, Symbol(), 5, 5.5].forEach(value => {
        expect(isNS(value)).toBe(false);
    });

    expect(isNS({})).toBe(true);
});

test("nsGet", () => {
    const ns = {a: {b: "hello"}};

    expect(nsGet(ns, ["a", "b"])).toBe("hello");
    expect(nsGet(ns, ["a", "c"])).toBe(undefined);
    expect(nsGet(ns, ["a", "b", "c"])).toBe(undefined);
    expect(nsGet(ns, [])).toBe(ns);
});

test("nsWithValue", () => {
    const ns = {a: {b: "hello"}};

    const originalNSClone = JSON.parse(JSON.stringify(ns));

    expect(nsWithValue(ns, [], "test")).toBe("test");
    expect(nsWithValue(undefined, ["a"], "test")).toEqual({
        a: "test"
    });

    const updated = nsWithValue(ns, ["a", "b"], "test");
    expect(updated).not.toBe(ns);
    expect(updated).toEqual(
        {a: {b: "test"}}
    );

    expect(nsWithValue(ns, ["a", "c", "d"], {a: "some value"})).toEqual({
        a: {
            b: "hello",
            c: {d: {a: "some value"}}
        }
    });

    // make sure we didn't mutate the original!
    expect(ns).toEqual(originalNSClone);
});

describe("nsWithDefaults", () => {
    test("mixed arguments should resolve to default", () => {
        expect(nsWithDefaults("something", {a: 5})).toEqual({a: 5});
        expect(nsWithDefaults({a: 5}, "test")).toEqual("test");
        expect(nsWithDefaults({a: 5}, [1, 2, 3])).toEqual([1, 2, 3]);
    });

    test("shallow updates", () => {
        expect(nsWithDefaults({a: 5}, {a: 6, b: 5})).toEqual({a: 5, b: 5});
        expect(nsWithDefaults({a: undefined}, {a: 5})).toEqual({a: undefined});
        expect(nsWithDefaults({a: [1, 2, 3], b: 3}, {a: 5, c: 3})).toEqual({a: [1, 2, 3], b: 3, c: 3});
    });

    test("doesn't mutate", () => {
        const a = {
            a: 1,
            b: {c: 3},
        };
        const aCopy = JSON.parse(JSON.stringify(a));

        const b = {
            d: "e",
            e: "f",
            g: {h: {i: 5}},
        };
        const bCopy = JSON.parse(JSON.stringify(b));

        expect(nsWithDefaults(a, b)).toEqual({
            a: 1,
            b: {c: 3},
            d: "e",
            e: "f",
            g: {h: {i: 5}},
        });

        expect(a).toEqual(aCopy);
        expect(b).toEqual(bCopy);
    });

    test("deep mixed", () => {
        expect(nsWithDefaults({
            a: {b: 5},
            b: {c: {d: "e"}},
            e: null,
            f: 5,
        }, {
            a: "rip",
            b: {c: {h: 2}, g: 1},
            f: {i: 1},
        })).toEqual({
            a: "rip",
            b: {c: {d: "e", h: 2}, g: 1},
            e: null,
            f: {i: 1},
        });
    });
});

test("nsWithoutValue", () => {
    expect(nsWithoutValue(5, ["test"])).toBe(5);
    expect(nsWithoutValue({a: 5}, [])).toEqual({a: 5});

    expect(nsWithoutValue({a: 5, b: 6}, ["b"])).toEqual({a: 5});
    expect(nsWithoutValue({a: 5, b: {c: 6, d: 7}}, ["b", "c"])).toEqual({a: 5, b: {d: 7}});

    expect(nsWithoutValue({a: 5, b: {c: 6, d: 7}}, ["q", "f", "no"])).toEqual({a: 5, b: {c: 6, d: 7}});

    expect(nsWithoutValue({b: {b: {b: 6}}}, ["b", "b", "c", "b"])).toEqual({b: {b: {b: 6}}});
});
