/**
 * Dolos started using React Hooks. This module exposes some useful hooks.
 *
 * @module hooks
 */

/** @ignore */
import * as React from "react";
import {EMPTY, Observable} from "rxjs";

export function useObservable<T, V>(observable: Observable<T>): T | undefined;
export function useObservable<T, V>(observable: Observable<T>, defaultValue: V): T | V;
/**
 * Always returns the latest value emitted by the observable.
 */
export function useObservable<T, V>(observable: Observable<T>, defaultValue?: V): T | V {
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
export function usePromise<T, V>(promise: PromiseLike<T>, defaultValue?: V): T | V {
    const [value, setValue] = React.useState(defaultValue as T | V);

    React.useEffect(() => {
        promise.then(setValue);
    }, [promise]);

    return value;
}

export function usePromiseMemo<T, V>(func: () => PromiseLike<T>): T | undefined;
export function usePromiseMemo<T, V>(func: () => PromiseLike<T>, defaultValue: V): T | V;
/** Get the promise from a function and wait for it to resolve */
export function usePromiseMemo<T, V>(func: () => PromiseLike<T>, defaultValue?: V): T | V {
    const promise = React.useMemo(func, []);
    return usePromise(promise, defaultValue) as T | V;
}

export function useObservablePromise<T, V>(promise: PromiseLike<Observable<T> | undefined>): T | undefined;
export function useObservablePromise<T, V>(promise: PromiseLike<Observable<T> | undefined>, defaultValue: V): T | V;
/** Get the observable from a promise and return its current value */
export function useObservablePromise<T, V>(promise: PromiseLike<Observable<T> | undefined>, defaultValue?: V): T | V {
    const observable = usePromise(promise);
    return useObservable(observable || EMPTY, defaultValue) as T | V;
}

export function useObservablePromiseMemo<T, V>(func: () => PromiseLike<Observable<T> | undefined>): T | undefined;
export function useObservablePromiseMemo<T, V>(func: () => PromiseLike<Observable<T> | undefined>, defaultValue: V): T | V;
/** Call the function once to get a promise returning an observable and return its current value  */
export function useObservablePromiseMemo<T, V>(func: () => PromiseLike<Observable<T> | undefined>, defaultValue?: V): T | V {
    const promise = React.useMemo(func, []);
    return useObservablePromise(promise, defaultValue) as T | V;
}