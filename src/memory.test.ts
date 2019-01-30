import {enterNamespace, enterParentNamespace, flattenNamespace, Memory, Namespace, NamespaceTraps} from "./memory";

const namespace: Namespace<any> = {
    __value: 5,
    a: {
        __value: {a: 5},

    },
    b: {
        c: {
            d: {
                __value: null,
            },
            e: {
                __value: true
            }
        }
    },
};

test("flatten namespace", () => {
    const flat = flattenNamespace(namespace);
    expect(flat).toEqual({
        ".": 5,
        "a": {a: 5},
        "b.c.d": null,
        "b.c.e": true,
    });
});

test("enter namespace", () => {
    const ns = enterNamespace(namespace, "b.c");
    expect(ns).toBe(namespace.b.c);
});

test("enter parent namespace", () => {
    const [ns, key] = enterParentNamespace(namespace, "b.c");
    expect(ns).toBe(namespace.b);
    expect(key).toBe("c");
});

test("namespace traps", () => {
    const ns = JSON.parse(JSON.stringify(namespace));

    const proxy = new Proxy(ns, NamespaceTraps);

    expect(Object.keys(proxy)).toEqual(["a", "b"]);
    expect(proxy.a).toBe(ns.a.__value);
    expect(proxy.b).toBeUndefined();

    expect("b.c.d" in proxy).toBe(true);

    proxy["b.c.e"] = false;
    expect(proxy["b.c.e"]).toBe(false);

    delete proxy.a;
    expect(proxy.a).toBeUndefined();
});

test("memory", () => {
    const memory = new Memory();

    memory.remember("a", "a");
    memory.remember("key", "value");
    memory.remember("key.k2", true);
    memory.remember("key.k3", false);
    memory.remember("key.k3.k", true);

    expect(memory.memory.key).toEqual("value");
    expect(memory.memory["key.k2"]).toBe(true);
    expect(memory.memory["key.k3"]).toBe(false);

    memory.forget("key.k3", false);
    expect(memory.memory["key.k3"]).toBeUndefined();
    expect(memory.memory["key.k3.k"]).toBe(true);

    memory.forget("key.k3", true);
    expect(memory.memory["key.k3.k"]).toBe(undefined);

    memory.resetMemory("key");
    // @ts-ignore
    expect(flattenNamespace(memory.internalMemory)).toEqual({a: "a"});

    memory.resetMemory();
    // @ts-ignore
    expect(flattenNamespace(memory.internalMemory)).toEqual({});
});