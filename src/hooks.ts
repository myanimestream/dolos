/**
 * Dolos started using React Hooks. This module exposes some useful hooks.
 *
 * @module hooks
 */

/** @ignore */
import * as React from "react";
import {Observable} from "rxjs";

export function useObservable<T, V>(observable: Observable<T>): T | undefined;
export function useObservable<T, V>(observable: Observable<T>, defaultValue: V): T | V;
/**
 * Always returns the latest value emitted by the observable.
 */
export function useObservable<T, V>(observable: Observable<T>, defaultValue?: V): T | V | undefined {
    const [value, setValue] = React.useState(defaultValue as T | V);

    React.useEffect(() => {
        const subscription = observable.subscribe(setValue);
        return () => subscription.unsubscribe();
    }, [observable]);

    return value;
}

export function usePromise<T, V>(promise: PromiseLike<T>): T | undefined;
export function usePromise<T, V>(promise: PromiseLike<T>, defaultValue: V): T | V;
/**
 * Return the value of the resolved promise.
 */
export function usePromise<T, V>(promise: PromiseLike<T>, defaultValue?: V): T | V | undefined {
    const [value, setValue] = React.useState(defaultValue as T | V);

    React.useEffect(() => {
        promise.then(setValue);
    }, [promise]);

    return value;
}