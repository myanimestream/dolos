/**
 * Utility functions for interacting with a namespace.
 *
 * @module store
 */

/** @ignore */

/**
 * Path for a namespace value.
 *
 * This can be a dot-separated string or an array of strings.
 *
 * Note that arrays may contain dot-separated strings. They are simply
 * flattened.
 * @example
 * ```typescript
 *
 * splitPath(["a.b", "c"]) // ["a", "b", "c"]
 * ```
 */
export type Path = string | string[];

/**
 * Split a path into its parts.
 *
 * @param path - [[Path]] to split
 */
export function splitPath(path: Path): string[] {
    if (Array.isArray(path)) {
        return path.reduce((parts, part) => {
            const newParts = part.split(".");
            parts.push(...newParts);

            return parts;
        }, [] as string[]);
    }

    return path.split(".");
}

/**
 * Check if the given value is an object.
 *
 * @param obj - Value to check
 */
function isObject(obj: any): obj is object {
    return typeof obj === "object" && obj !== null;
}

/**
 * A Namespace is just a normal object which may have nested objects.
 *
 * Note that even though it's an object, an array isn't a namespace!
 */
type Namespace = object;

/**
 * Check whether the given value is a [[Namespace]].
 *
 * @param ns - Value to check
 */
export function isNS(ns: any): ns is Namespace {
    return isObject(ns) && !Array.isArray(ns);
}

/**
 * Get all namespaces along the given path including the last value.
 *
 * @param ns - Namespace to start from
 * @param pathParts - Parts to follow
 * @param create - Whether or not to create empty namespaces along the way
 *
 * @return Namespaces which are encountered along the way (excluding the root) and the final value.
 */
function nsFollowingPath(ns: any, pathParts: string[], create?: boolean): [Namespace[], any] {
    const nsPath: any[] = [];
    let prevNS = ns;

    for (const part of pathParts) {
        try {
            prevNS = prevNS[part];
        } catch {
            if (create)
                prevNS = {};
            else
                break;
        }

        nsPath.push(prevNS);
    }

    return [nsPath, nsPath.pop()];
}

/**
 * Get the value of a key in a namespace.
 *
 * @param ns - Namespace to get value from.
 * @param pathParts - Path to the value.
 *
 * @return Value of the path in the namespace or undefined if
 * the value doesn't exist.
 */
export function nsGet<T>(ns: any, pathParts: string[]): T | undefined {
    let target = ns;

    for (const key of pathParts) {
        try {
            target = target[key];
        } catch {
            return undefined;
        }
    }

    return target;
}

export function nsWithValue(ns: Namespace, pathParts: string[], value: any): Readonly<Namespace>;
export function nsWithValue<T>(ns: any, pathParts: string[], value: T): T;
/**
 * Set the value of a key in a namespace.
 * Namespaces are created if they do not already exist
 * and non-namespace values are replaced.
 *
 * @param ns - Namespace to set value in.
 * The passed namespace isn't mutated!
 * @param pathParts - Path to the value to the key to set
 * @param value - Value to set the key to
 *
 * @return Copy of the original ns with the new value at the given path.
 * It is important to note that the new ns isn't a deep copy of the old one,
 * only namespaces which are traversed are copied shallowly.
 */
export function nsWithValue(ns: any, pathParts: string[], value: any): any {
    const lastPartIndex = pathParts.length - 1;
    const finalKey = pathParts[lastPartIndex];
    if (finalKey === undefined) return value;

    const nsCopy = {...ns};
    let parentNS = nsCopy;

    for (let i = 0; i < lastPartIndex; i++) {
        const key = pathParts[i];

        const childNSCopy = {...parentNS[key]};
        // enter the copy but also add it to the nsCopy tree.
        // parentNS is already part of nsCopy and we then attach
        // the new childNSCopy to it which means that it is now also
        // part of nsCopy, so we can safely use it as our new parentNS
        parentNS = parentNS[key] = childNSCopy;
    }

    parentNS[finalKey] = value;

    return nsCopy;
}

export function nsMerge<T1 extends Namespace, T2 extends Namespace>(a: T1, b: T2): T1 & T2;
export function nsMerge<T>(a: any, b: T): T;
/**
 * Merge namespaces.
 * Behaves similar to `Object.assign` but respects nested namespaces and
 * returns the second argument if either of them isn't a namespace.
 */
export function nsMerge(a: any, b: any): any {
    if (!(isNS(a) && isNS(b))) return b;

    const nsCopy = {...a} as { [key: string]: any };

    for (const [key, valueB] of Object.entries(b)) {
        const valueA = (a as { [key: string]: any })[key];
        nsCopy[key] = nsMerge(valueA, valueB);
    }

    return nsCopy;
}

/**
 * Merge two namespaces within a root namespace.
 *
 * @param root - Root namespace to merge within
 * @param pathParts - Path to namespace to be merged
 * @param source - Namespace to merge with
 */
export function nsMergeNested(root: any, pathParts: string[], source: any): any {
    if (pathParts.length === 0)
        return nsMerge(root, source);

    const [pathNamespaces, value] = nsFollowingPath(root, pathParts, true);
    const newValue = nsMerge(value, source);

    const nsCopy = {...root};
    let target = nsCopy;

    for (let i = 0; i < pathNamespaces.length; i++) {
        const key = pathParts[i];
        const nsPart = {...pathNamespaces[i]};

        target = target[key] = nsPart;
    }

    const finalKey = pathParts[pathParts.length - 1];
    target[finalKey] = newValue;

    return nsCopy;
}

export function nsWithoutValue(ns: Namespace, pathParts: string[]): Namespace;
export function nsWithoutValue<T>(ns: T, pathParts: string[]): T;
/**
 * Get a namespace without the value given by its path.
 */
export function nsWithoutValue(ns: any, pathParts: string[]): any {
    if (!isNS(ns)) return ns;

    const nsCopy = {...ns} as { [key: string]: any };
    let target = nsCopy;

    const pathNamespaces = nsFollowingPath(ns, pathParts)[0];

    for (let i = 0; i < pathNamespaces.length; i++) {
        const key = pathParts[i];
        const pathNS = {...pathNamespaces[i]};
        target = target[key] = pathNS;
    }

    const lastKeyIndex = pathParts.length - 1;

    // only remove the last value if we actually reached it
    if (pathNamespaces.length === lastKeyIndex)
        delete target[pathParts[lastKeyIndex]];

    return nsCopy;
}

export function nsWithDefaults<T extends Namespace, V extends Namespace>(ns: T, defaults: V): Readonly<T & V>;
export function nsWithDefaults<T>(ns: any, defaults: T): T;
/**
 * Recursively update a namespace with defaults.
 *
 * If either argument isn't a namespace, the default is returned.
 * Likewise if a nested value doesn't match (i.e. it's a namespace in one,
 * but not the other), the default is used.
 *
 * @param ns - Namespace to apply defaults to
 * @param defaults - Defaults to apply.
 */
export function nsWithDefaults(ns: any, defaults: any): any {
    if (!(isNS(ns) && isNS(defaults))) {
        return defaults;
    }

    const output = {...ns} as { [key: string]: any };
    for (const [key, defaultValue] of Object.entries(defaults)) {
        if (key in output) {
            const outputValue = output[key];

            if (isNS(defaultValue) || isNS(outputValue))
                output[key] = nsWithDefaults(outputValue, defaultValue);
        } else {
            output[key] = defaultValue;
        }
    }

    return output;
}

/**
 * Recursively freeze the given namespace.
 *
 * @return The object that was passed.
 * Note that the object is frozen in-place!
 */
export function nsFreeze<T>(ns: T): Readonly<T> {
    const queue = [ns];

    while (queue.length > 0) {
        const item = queue.pop();
        Object.freeze(item);

        if (isObject(item)) queue.push(...Object.values(item));
    }

    return ns;
}
