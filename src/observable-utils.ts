/**
 * Observable utilities like operators and all that good stuff.
 *
 * @module observable-utils
 */

/** @ignore */

import events = chrome.events;
import {fromEventPattern, Observable} from "rxjs";
import {map} from "rxjs/operators";

/**
 * Create an observable which listens to events from an extension event target.
 *
 * These event targets use `addListener` and `removeListener` which take
 * a single argument, the event listener. This makes them different from
 * common event targets which take the event name as an argument.
 * They also pass multiple arguments instead of only one event object.
 *
 * Arguments that would normally be passed to the event listener are wrapped
 * in an array.
 *
 * @see [[mapArrayToObject]] to create an object from the array.
 */
export function fromExtensionEventPattern<V extends any[], T extends (...args: V) => void>(
    target: events.Event<T>,
): Observable<V> {
    type HandlerType = (args: V) => void;

    const addHandler = (handler: HandlerType) => {
        const wrapper = ((...args: V) => handler(args)) as T;
        target.addListener(wrapper);

        return wrapper;
    };

    const removeHandler = (_: () => void, wrapped: T) => target.removeListener(wrapped);

    return fromEventPattern(addHandler, removeHandler);
}

/**
 * Operator to convert an array to an object.
 * This makes sense if you have a predictable array structure.
 *
 * Keys without a value default to `undefined`.
 *
 * @param keys - Object keys in order of the array
 */
export function mapArrayToObject<T extends { [key: string]: any }>(keys: Array<keyof T>): (
    source: Observable<Array<T[keyof T]>>) => Observable<T> {
    return map(value => {
        // create array of [key, value] pairs.
        const zipped = keys.map((key, i) => [key, value[i]]) as Array<[keyof T, T[keyof T]]>;
        // create object
        return zipped.reduce((prev, [key, val]) => prev[key] = val, {} as T);
    });
}
