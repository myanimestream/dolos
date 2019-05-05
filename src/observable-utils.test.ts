import {fromExtensionEventPattern, mapArrayToObject} from "dolos/observable-utils";
import {Observable, Subject, SubscriptionLike} from "rxjs";
import {take, toArray} from "rxjs/operators";

describe("fromExtensionEventPattern", () => {
    class MockEvent implements chrome.events.Event<any> {
        private event$: Observable<any[]>;
        private subs: Map<any, SubscriptionLike>;

        constructor(event$: Observable<any>) {
            this.event$ = event$;
            this.subs = new Map();
        }

        addListener(callback: any): void {
            if (this.subs.has(callback)) throw new Error("Callback is already listening");

            const sub = this.event$.subscribe(args => callback(...args));
            this.subs.set(callback, sub);
        }

        removeListener(callback: any): void {
            const sub = this.subs.get(callback);
            if (sub) sub.unsubscribe();
        }

        addRules = jest.fn();

        getRules = jest.fn();

        hasListener = jest.fn();

        hasListeners = jest.fn();

        removeRules = jest.fn();
    }

    test("subscription management", () => {
        const obs$ = fromExtensionEventPattern(chrome.storage.onChanged);

        const sub = obs$.subscribe(() => undefined);
        expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();

        sub.unsubscribe();
        expect(chrome.storage.onChanged.removeListener).toHaveBeenCalled();
    });

    test("argument collection", async () => {
        const event$ = new Subject();
        const event = new MockEvent(event$);

        const obs$ = fromExtensionEventPattern(event);
        const itemsPromise = obs$.pipe(
            take(3),
            toArray(),
        ).toPromise();

        event$.next([1, 2, 3]);
        event$.next([4, 5, 6]);
        event$.next([7, 8, 9]);

        expect(await itemsPromise).toEqual([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ]);
    });
});

test("mapArrayToObject", async () => {
    const array$ = new Subject<any[]>();
    const obj$ = array$.pipe(mapArrayToObject(["a", "b", "c"]));
    const itemsPromise = obj$.pipe(
        take(3),
        toArray(),
    ).toPromise();

    array$.next([1, true, "no"]);
    array$.next([2, false, "yes"]);
    array$.next([3, true, "maybe"]);

    expect(await itemsPromise).toEqual([
        {a: 1, b: true, c: "no"},
        {a: 2, b: false, c: "yes"},
        {a: 3, b: true, c: "maybe"},
    ]);
});
