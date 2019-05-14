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

import {DependencyList, useCallback, useEffect, useMemo, useState} from "react";
import {BehaviorSubject, Observable, PartialObserver, Subject, Subscribable} from "rxjs";
import {debounceTime} from "rxjs/operators";

export function usePromise<T>(promise: PromiseLike<T>): T | undefined;
export function usePromise<T, V>(promise: PromiseLike<T>, defaultValue: V): T | V;
/**
 * Return the value of the resolved promise.
 */
export function usePromise<T, V>(promise: PromiseLike<T>, defaultValue?: V): T | V {
    const [value, setValue] = useState(defaultValue as T | V);

    useEffect(() => {
        let cancelled = false;

        promise.then((result: T) => {
            if (!cancelled) setValue(result);
        });

        return () => {
            cancelled = true;
        };
    }, [promise]);

    return value;
}

export type MemoDependencies = DependencyList | undefined;

export function usePromiseMemo<T>(func: () => PromiseLike<T>, deps: MemoDependencies): T | undefined;
export function usePromiseMemo<T, V>(func: () => PromiseLike<T>, deps: MemoDependencies, defaultValue: V): T | V;
/** Get the promise from a function and wait for it to resolve */
export function usePromiseMemo<T, V>(func: () => PromiseLike<T>, deps: MemoDependencies, defaultValue?: V): T | V {
    // func is presumed not to be stable!
    const promise = useMemo(func, deps);
    return usePromise(promise, defaultValue) as T | V;
}

/**
 * Add a subscriber to an observable.
 * Automatically unsubscribes.
 *
 * @see [[useObservable]] to get the current value of an observable.
 */
export function useSubscription<T>(observable: Subscribable<T>,
                                   observerOrNext?: PartialObserver<T> | ((value: T) => void),
                                   error?: (error: any) => void,
                                   complete?: () => void): void {
    useEffect(() => {
        // copied signature from type definitions. No need to complain about it, TypeScript
        // @ts-ignore
        const subscription = observable.subscribe(observerOrNext, error, complete);
        return () => subscription.unsubscribe();
    }, [observable, observerOrNext, error, complete]);
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
 *
 * @see [[useSubscription]] to subscribe to an observable.
 *
 * @return The latest value of the observable
 */
export function useObservable<T, V>(observable: Observable<T>, defaultValue?: V): T | V {
    if (observable instanceof BehaviorSubject)
        defaultValue = observable.getValue();

    const [value, setValue] = useState(defaultValue as T | V);

    useSubscription(observable, setValue);

    return value;
}

export function useObservableMemo<T>(func: () => Observable<T>, deps: MemoDependencies): T | undefined;
export function useObservableMemo<T, V>(func: () => Observable<T>, deps: MemoDependencies, defaultValue?: V): T | V;
/**
 * Get an observable from the given function and return its value.
 *
 * @param func - Function to call to get the observable
 * @param defaultValue - Value to use while no other value is available.
 */
export function useObservableMemo<T, V>(func: () => Observable<T>, deps: MemoDependencies, defaultValue?: V): T | V {
    const obs$ = useMemo(func, deps);
    return useObservable(obs$, defaultValue) as T | V;
}

export function useDebouncedState<T>(setter: (v: T) => any,
                                     dueTime: number): [T | undefined, (v: T) => any];
export function useDebouncedState<T>(setter: (v: T) => any,
                                     dueTime: number,
                                     actualValue: T | (() => T)): [T, (v: T) => any];
/**
 * Like React's useState function but the set dispatcher is debounced.
 * The value, however, always reflects the current, non-debounced, value.
 *
 * @param setter - Setter to call to update the actual value.
 * @param dueTime - Debounce time in milliseconds.
 * @param actualValue - The current value. When this changes, the returned value
 * updates to it.
 */
export function useDebouncedState<T>(setter: (v: T) => any,
                                     dueTime: number,
                                     actualValue?: T | (() => T)): [T | undefined, (v: T) => any] {
    const [internalValue, setInternalValue] = useState<T | undefined>(actualValue);
    // update the internal value if the actual value changes
    useEffect(() => setInternalValue(actualValue), [actualValue]);

    const in$ = useMemo(() => new Subject<T>(), []);

    // listen to the debounced setter
    useEffect(() => {
        const sub = in$.pipe(debounceTime(dueTime)).subscribe(setter);
        return () => sub.unsubscribe();
    }, [in$, setter, dueTime]);

    // set the internal value and push to the debouncer
    const externalSetter = useCallback((v: T) => {
        setInternalValue(v);
        in$.next(v);
    }, [in$]);

    return [internalValue, externalSetter];
}
