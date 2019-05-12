/* tslint:disable:max-classes-per-file */
/**
 * Namespaced data storage.
 *
 * @module memory
 */

/** @ignore */

import * as ReactDOM from "react-dom";

/**
 * Abstract representation of a Namespace.
 */
export interface Namespace<VT = any> {
    __value?: VT;

    [key: string]: Namespace<any> | VT | undefined;
}

/**
 * Like [[enterNamespace]] but instead of returning the [[Namespace]] `namespace` it returns its parent
 * namespace and the key that would lead to the `namespace` namespace.
 */
export function enterParentNamespace<T>(start: Namespace<T>, namespace: string | string[]): [Namespace<T>, string] {
    const parts = Array.isArray(namespace) ? namespace : namespace.split(".");
    const key = parts.pop() as string;
    return [enterNamespace(start, parts), key];
}

/**
 * Get the namespace described by `namespace` relative to the `start` namespace.
 */
export function enterNamespace<T>(start: Namespace<T>, namespace: string | string[]): Namespace<T> {
    let target = start;

    const parts = Array.isArray(namespace) ? namespace : namespace.split(".");

    for (const part of parts) {
        if (part === "__value")
            throw new Error(`Cannot use reserved name __value in namespace: ${namespace}`);

        if (part in target)
            target = target[part] as Namespace<T>;
        else
            target = target[part] = {};
    }

    return target;
}

/**
 * Get an object literal representing the flattened namespace.
 * The namespace is flattened by combining the keys with a period.
 *
 * @example
 * ```typescript
 *
 * const ns = {a: {
 *      b: {
 *          c: 5,
 *          d: 6
 *      },
 *      e: 7,
 *      __value: 8
 * }};
 *
 * const flat = flattenNamespace(ns);
 *
 * // true
 * flat === {
 *     "a.b.c": 5,
 *     "a.b.d": 6,
 *     "a.e": 7,
 *     "a": 8,
 * };
 * ```
 */
export function flattenNamespace<T>(ns: Namespace<T>): { [key: string]: T } {
    const result: { [key: string]: T } = {};

    const stack = [[undefined, ns]];

    while (stack.length) {
        const [prefix, target] = stack.pop() as [string | undefined, Namespace];

        for (const [key, value] of Object.entries(target))
            if (key === "__value")
                result[prefix === undefined ? "." : prefix] = value;
            else {
                const absKey = prefix === undefined ? key : [prefix, key].join(".");
                stack.push([absKey, value]);
            }
    }

    return result;
}

/**
 * Type of a [[Namespace]] using [[NAMESPACE_TRAPS]] to grant easy access to its values.
 */
export interface ProxiedNamespace<VT = any> {
    [key: string]: VT;
}

/**
 * Traps passed to the Proxy for Namespace objects.
 */
export const NAMESPACE_TRAPS: ProxyHandler<Namespace> = {
    get<T>(target: Namespace<T>, p: PropertyKey, receiver?: any): T {
        if (typeof p === "string")
            return Reflect.get(enterNamespace(target, p), "__value");
        else return Reflect.get(target, p, receiver);
    },
    set<T>(target: Namespace<T>, p: PropertyKey, value: T, receiver?: any): boolean {
        if (typeof p === "string")
            return Reflect.set(enterNamespace(target, p), "__value", value);
        else return Reflect.set(target, p, value, receiver);
    },
    deleteProperty(target: Namespace, p: PropertyKey): boolean {
        if (typeof p === "string")
            return Reflect.deleteProperty(enterNamespace(target, p), "__value");
        else return Reflect.deleteProperty(target, p);
    },
    has(target: Namespace, p: PropertyKey): boolean {
        if (typeof p === "string")
            return Reflect.has(enterNamespace(target, p), "__value");
        else return Reflect.has(target, p);
    },
    ownKeys(target: Namespace): PropertyKey[] {
        const keys = Reflect.ownKeys(target);
        return keys.filter(key => key !== "__value");
    },
};

/**
 * @see [[Memory]] for an implementation.
 */
export interface HasMemory<T extends Memory = any> {
    memory: Namespace;
    remember: (key: string, value: any) => void;
    forget: (key: string, forgetNamespace?: boolean) => void;
    resetMemory: (...namespaces: string[]) => void;
}

/**
 * A simple namespaced data storage.
 * You can access the memory directly using [[Memory.memory]].
 *
 * ## Namespaces
 * Namespaces aren't just "objects within objects".
 * If you have the namespace `a.b.c`, `a` does not contain `b`
 * and likewise `b` doesn't contain `c`.
 *
 * You can set `a` to 5 and `a.b` to 6. `a` would still be 5.
 *
 * The only thing affected by namespaces is data removal.
 * If you remove `a` it will also remove `a.b` and `a.b.c`.
 *
 * > Removing a namespace removes all other namespaces that
 * > have the removed namespace as a prefix.
 *
 * The notable exception is [[Memory.forget]] with `forgetNamespace` false
 * (the default). This only removes the specific namespace without affecting
 * anything else.
 */
export class Memory implements HasMemory {
    public readonly memory: ProxiedNamespace;
    protected readonly internalMemory: Namespace;

    constructor() {
        this.internalMemory = {};
        this.memory = new Proxy(this.internalMemory, NAMESPACE_TRAPS);
    }

    /**
     * Store the given value under the namespace key.
     *
     * @param key - Namespaces are separated by a dot
     */
    public remember(key: string, value: any) {
        this.memory[key] = value;
    }

    /**
     * Delete the value of the provided namespace key.
     *
     * @param forgetNamespace - if true this operation behaves
     * like [[Memory.resetMemory]] with the key as an argument.
     * Otherwise it merely removes the specified namespace.
     */
    public forget(key: string, forgetNamespace?: boolean) {
        let target;
        if (forgetNamespace) {
            [target, key] = enterParentNamespace(this.internalMemory, key);
        } else target = this.memory;

        delete target[key];
    }

    /**
     * Reset the given namespaces and all their children.
     *
     * When called with no arguments this flushes the entire memory
     * (i.e. deletes all keys).
     *
     * @see [[Memory.forget]] to remove a specific namespace without affecting its children.
     */
    public resetMemory(...namespaces: string[]) {
        namespaces = namespaces.length > 0 ? namespaces : Object.keys(this.memory);

        namespaces.forEach(ns => {
            this.forget(ns, true);
        });
    }

    /**
     * Assign a [[Namespace]] to the memory.
     * This does not remove the current memory.
     *
     * Calls `Object.assign`.
     */
    protected assignMemory(memory: Namespace): void {
        Object.assign(this.internalMemory, memory);
    }
}

/**
 * @see [[ElementMemory]] for an implementation.
 */
export interface HasElementMemory<T extends ElementMemory = any> {
    injected: (el: Element, ns: string) => void;
    removeInjected: (...namespaces: string[]) => void;
}

/**
 * Remove an element but also try to unmount
 * its React component if there is any.
 */
function removeElement(el: Element): void {
    ReactDOM.unmountComponentAtNode(el);
    el.remove();
}

/**
 * [[Memory]] that can also keep track of injected DOM elements.
 *
 * This class doesn't actually touch the [[Memory.memory]] at all,
 * but provides a similar interface for HTML Elements.
 */
export class ElementMemory extends Memory implements HasElementMemory {
    private readonly internalInjectedMemory: Namespace<Node[]>;
    private readonly injectedMemory: ProxiedNamespace<Node[]>;

    constructor() {
        super();
        this.internalInjectedMemory = {};
        // @ts-ignore
        this.injectedMemory = new Proxy(this.internalInjectedMemory, NAMESPACE_TRAPS) as ProxiedNamespace<Element[]>;
    }

    /**
     * Keep track of the given element such that it can be removed later.
     *
     * @see [[ElementMemory.removeInjected]] to remove elements
     */
    public injected(el: Node, ns?: string) {
        ns = ns || "global";
        const elements = this.injectedMemory[ns];

        if (elements) elements.push(el);
        else this.injectedMemory[ns] = [el];
    }

    /**
     * Remove all elements from the given namespaces.
     * Removing elements of a namespace also removes all elements
     * in namespaces further down.
     *
     * If no namespaces provided removes all elements.
     */
    public removeInjected(...namespaces: string[]) {
        namespaces = namespaces.length > 0 ? namespaces : Object.keys(this.injectedMemory);

        namespaces.forEach(key => {
            const [parentNS, nsKey] = enterParentNamespace(this.internalInjectedMemory, key);

            const flattened = flattenNamespace(parentNS[nsKey] as Namespace);
            Object.values(flattened).forEach(elements =>
                elements.forEach(removeElement));

            delete parentNS[nsKey];
        });
    }
}

/**
 * Decorator to cache the result of a nullary method.
 *
 * Applying this decorator to a method in a [[HasMemory]] class
 * will memoize the result of the method in the [[Memory.memory]].
 *
 * The method must not take any arguments (i.e. be a nullary function)
 */
export function cacheInMemory(name?: string) {
    return (target: object & HasMemory, propertyKey: string, descriptor: PropertyDescriptor) => {
        const keyName: string = name || `${target.constructor.name}-${propertyKey}`;
        const func = descriptor.value;

        // keep track of whether the underlying function returns a promise
        // so that subsequent calls can return a promise even though
        // the value can be retrieved synchronously.
        let returnPromise: boolean;

        descriptor.value = function(this: HasMemory) {
            const memory = this.memory;

            let value;
            if (keyName in memory) {
                value = memory[keyName];
            } else {
                value = func.apply(this);
                returnPromise = !!value.then;

                Promise.resolve(value)
                    .then(val => this.remember(keyName, val))
                    .catch(console.error);
            }

            if (returnPromise) return Promise.resolve(value);
            else return value;
        };
    };
}
