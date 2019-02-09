/**
 * Dolos started using React Hooks!
 * This module exposes some useful hooks when interacting with Dolos.
 *
 * The following hooks aren't specific to Dolos! There are hooks specifically
 * for Dolos, but you won't find them in here.
 *
 * Most of these hooks alleviate working with observables, promises, or even the
 * combination of the two.
 *
 * @module hooks
 */

/** @ignore */
import * as React from "react";
import {BehaviorSubject, EMPTY, Observable, PartialObserver} from "rxjs";

export function usePromise<T>(promise: PromiseLike<T>): T | undefined;
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

export function usePromiseMemo<T>(func: () => PromiseLike<T>): T | undefined;
export function usePromiseMemo<T, V>(func: () => PromiseLike<T>, defaultValue: V): T | V;
/** Get the promise from a function and wait for it to resolve */
export function usePromiseMemo<T, V>(func: () => PromiseLike<T>, defaultValue?: V): T | V {
    const promise = React.useMemo(func, []);
    return usePromise(promise, defaultValue) as T | V;
}

/**
 * Add a subscriber to an observable.
 * Automatically unsubscribes.
 *
 * @see [[useObservable]] to get the current value of an observable.
 */
export function useSubscription<T>(observable: Observable<T>,
                                   observerOrNext?: PartialObserver<T> | ((value: T) => void),
                                   error?: (error: any) => void,
                                   complete?: () => void): void {
    React.useEffect(() => {
        // copied signature from type definitions. No need to complain about it, TypeScript
        // @ts-ignore
        const subscription = observable.subscribe(observerOrNext, error, complete);
        return () => subscription.unsubscribe();
    }, [observable]);
}

export function useObservable<T>(observable: BehaviorSubject<T>): T;
export function useObservable<T>(observable: Observable<T>): T | undefined;
export function useObservable<T, V>(observable: Observable<T>, defaultValue: V): T | V;
/**
 * Always returns the latest value emitted by the observable.
 *
 * If you provide a [[BehaviorSubject]] the first returned value will be
 * initialised with the observables current value (i.e. [[BehaviourSubject.getValue]]).
 * This makes providing a default value in that case useless since it'll be overwritten.
 * If you don't want this behaviour, please pipe your observable
 * (this essentially converts it to a normal observable).
 *
 * @see [[useSubscription]] to subscribe to an observable.
 *
 * @return The latest value of the observable
 */
export function useObservable<T, V>(observable: Observable<T>, defaultValue?: V): T | V {
    if (observable instanceof BehaviorSubject)
        defaultValue = observable.getValue();

    const [value, setValue] = React.useState(defaultValue as T | V);

    useSubscription(observable, setValue);

    return value;
}

export function useObservablePromise<T>(promise: PromiseLike<Observable<T> | undefined>): T | undefined;
export function useObservablePromise<T, V>(promise: PromiseLike<Observable<T> | undefined>, defaultValue: V): T | V;
/** Get the observable from a promise and return its current value */
export function useObservablePromise<T, V>(promise: PromiseLike<Observable<T> | undefined>, defaultValue?: V): T | V {
    const observable = usePromise(promise);
    return useObservable(observable || EMPTY, defaultValue) as T | V;
}

export function useObservablePromiseMemo<T>(func: () => PromiseLike<Observable<T> | undefined>): T | undefined;
export function useObservablePromiseMemo<T, V>(func: () => PromiseLike<Observable<T> | undefined>,
                                               defaultValue: V): T | V;
/**
 * Call the function once to get a promise returning an observable and return its current value .
 *
 * Like calling:
 * ```typescript
 *      const observable = usePromiseMemo(<func>, EMPTY);
 *      const value = useObservable(observable, <defaultValue>);
 * ```
 *
 * This may seem like it is way too specific to be of any use but you'll find that a lot
 * of Dolos is built using getter functions that asynchronously return observables.
 */
export function useObservablePromiseMemo<T, V>(func: () => PromiseLike<Observable<T> | undefined>,
                                               defaultValue?: V): T | V {
    const promise = React.useMemo(func, []);
    return useObservablePromise(promise, defaultValue) as T | V;
}
