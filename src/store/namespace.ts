/**
 * Utility functions for interacting with a namespace.
 *
 * @module store/namespace
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
 * A Namespace is just a normal object which may have nested objects.
 */
export interface Namespace<T = any> {
    [key: string]: T | Namespace<T>;
}

export type NamespaceLike = Namespace | any;

/**
 * Check whether the given value is a [[Namespace]].
 */
export function isNS(ns: any): ns is Namespace {
    return !!(ns && typeof ns === "object" && !Array.isArray(ns));
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
export function nsGet<T>(ns: NamespaceLike, pathParts: string[]): T | undefined {
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
export function nsSet<T>(ns: NamespaceLike, pathParts: string[], value: T): Readonly<Namespace | T> {
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

// TODO figure out signature
export function nsSetDefaults<T, V>(ns: T | undefined, defaults: V): T & V;
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
export function nsSetDefaults<T, V>(ns: T, defaults: V): T | V {
    if (!(isNS(ns) && isNS(defaults))) {
        return defaults;
    }

    const output = {...ns} as Namespace;
    for (const [key, defaultValue] of Object.entries(defaults)) {
        if (key in output) {
            const outputValue = output[key];

            if (isNS(defaultValue) || isNS(outputValue))
                output[key] = nsSetDefaults(outputValue, defaultValue);
        } else {
            output[key] = defaultValue;
        }
    }

    return output as T & V;
}
