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
import {BehaviorSubject, PartialObserver, Subject, Subscribable} from "rxjs";
import {debounceTime} from "rxjs/operators";

export type InitialValue<T> = T | (() => T);

export function usePromise<T>(promise: PromiseLike<T>): T | undefined;
export function usePromise<T, V>(promise: PromiseLike<T>, initialValue: InitialValue<V>): T | V;
export function usePromise<T, V>(promise: PromiseLike<T>, initialValue?: InitialValue<V>): T | V | undefined;
/**
 * Return the value of the resolved promise.
 */
export function usePromise<T, V>(promise: PromiseLike<T>, initialValue?: InitialValue<V>): T | V | undefined {
    const [value, setValue] = useState<T | V | undefined>(initialValue);

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

export function usePromiseMemo<T>(func: () => PromiseLike<T>,
                                  deps: MemoDependencies): T | undefined;
export function usePromiseMemo<T, V>(func: () => PromiseLike<T>,
                                     deps: MemoDependencies,
                                     initialValue: InitialValue<V>): T | V;
/** Get the promise from a function and wait for it to resolve */
export function usePromiseMemo<T, V>(func: () => PromiseLike<T>,
                                     deps: MemoDependencies,
                                     initialValue?: InitialValue<V>): T | V | undefined {
    // func is presumed not to be stable!
    const promise = useMemo(func, deps);
    return usePromise(promise, initialValue);
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

// TODO DOCS
export function useSubscriptionMemo<T>(func: () => Subscribable<T>,
                                       deps: any[],
                                       observerOrNext?: PartialObserver<T> | ((value: T) => void),
                                       error?: (error: any) => void,
                                       complete?: () => void): void {
    const observable = useMemo(func, deps);
    useSubscription(observable, observerOrNext, error, complete);
}

export function useObservable<T>(observable: BehaviorSubject<T>): T;
export function useObservable<T>(observable: Subscribable<T>): T | undefined;
export function useObservable<T, V>(observable: Subscribable<T>, initialValue: InitialValue<V>): T | V;
export function useObservable<T, V>(observable: Subscribable<T>, initialValue?: InitialValue<V>): T | V | undefined;
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
export function useObservable<T, V>(observable: Subscribable<T>, initialValue?: InitialValue<V>): T | V | undefined {
    if (observable instanceof BehaviorSubject)
        initialValue = observable.getValue();

    const [value, setValue] = useState<T | V | undefined>(initialValue);

    useSubscription(observable, setValue);

    return value;
}

export function useObservableMemo<T>(func: () => BehaviorSubject<T>, deps: MemoDependencies): T;
export function useObservableMemo<T>(func: () => Subscribable<T>, deps: MemoDependencies): T | undefined;
export function useObservableMemo<T, V>(func: () => Subscribable<T>,
                                        deps: MemoDependencies,
                                        initialValue: InitialValue<V>): T | V;
/**
 * Get an observable from the given function and return its value.
 *
 * @param func - Function to call to get the observable
 * @param initialValue - Value to use while no other value is available.
 */
export function useObservableMemo<T, V>(func: () => Subscribable<T>,
                                        deps: MemoDependencies,
                                        initialValue?: InitialValue<V>): T | V | undefined {
    const obs$ = useMemo(func, deps);
    return useObservable(obs$, initialValue);
}

/**
 * Observable state as returned by [[useObservableState]].
 */
export interface ObservableState<T> {
    readonly value: T;
    readonly error?: any;
    readonly complete: boolean;
}

export function useObservableState<T>(observable: Subscribable<T>): ObservableState<T>;
export function useObservableState<T, V>(observable: Subscribable<T>,
                                         initialValue: InitialValue<V>): ObservableState<T | V>;
export function useObservableState<T, V>(observable: Subscribable<T>,
                                         initialValue?: InitialValue<V>): ObservableState<T | V | undefined>;
// TODO DOCS
export function useObservableState<T, V>(observable: Subscribable<T>,
                                         initialValue?: InitialValue<V>): ObservableState<T | V | undefined> {
    const [value, setValue] = useState<T | V | undefined>(initialValue);
    const [error, setError] = useState<any>(undefined);
    const [complete, setComplete] = useState<boolean>(false);

    useSubscription(observable, {
        complete: () => setComplete(true),
        error: setError,
        next: setValue,
    });

    return {value, error, complete};
}

export function useObservableStateMemo<T>(func: () => Subscribable<T>,
                                          deps: any[]): ObservableState<T | undefined>;
export function useObservableStateMemo<T, V>(func: () => Subscribable<T>,
                                             deps: any[],
                                             initialValue: InitialValue<V>): ObservableState<T | V>;
// TODO DOCS
export function useObservableStateMemo<T, V>(func: () => Subscribable<T>,
                                             deps: any[],
                                             initialValue?: InitialValue<V>): ObservableState<T | V | undefined> {
    const observable = useMemo(func, deps);
    return useObservableState(observable, initialValue);
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
