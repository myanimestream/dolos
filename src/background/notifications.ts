/**
 * A module to make working with notifications easier.
 *
 * It mainly provides the [[BrowserNotification]] class which can be used to manage notifications.
 *
 * @module background
 */

/** ignore */
import AsyncLock from "dolos/lock";
import {fromEventPattern, merge, Observable} from "rxjs";
import {filter, first} from "rxjs/operators";


/** Event emitted for all interactions with a notification. */
export interface NotificationEvent {
    notificationID: string;
    /** Only set for ButtonClick events */
    buttonIndex?: number;
}

/** Build an Observable for the notification event `name`. */
function getObservable(name: string): Observable<NotificationEvent> {
    // @ts-ignore
    const eventTarget = chrome.notifications[name] as chrome.events.Event<any>;

    // because rxjs deprecated the resultSelector, wrap the handler in a
    // function which creates the NotificationEvent we want. Return the wrapper function
    // so that the removeHandler function can access it and remove it.
    const addHandler = (handler: Function) => {
        const wrapper = (notificationID: string, buttonIndex?: number) => handler({notificationID, buttonIndex});
        eventTarget.addListener(wrapper);

        return wrapper;
    };
    // the handler function was wrapped, we need to remove the wrapped function
    const removeHandler = (_: Function, wrapped: Function) => eventTarget.removeListener(wrapped);

    return fromEventPattern(addHandler, removeHandler);
}

export const onClicked$ = getObservable("onClicked");
export const onButtonClicked$ = getObservable("onButtonClicked");
export const onClosed$ = getObservable("onClosed");

/** [[AsyncLock]] used to trigger notifications sequentially. */
export const notificationLock = new AsyncLock();

/**
 * Low-level function to show a notification.
 * The difference between this function and just straight up calling chrome.notifications.create is that
 * it uses the [[notificationLock]] to make sure only one notification is shown at a time.
 *
 * @see [[BrowserNotification]] for a higher level approach to notifications.
 */
export async function createNotification(options: chrome.notifications.NotificationOptions): Promise<string> {
    return new Promise(async (res: (id: string) => void) => {
        await notificationLock.withLock(async () => {
            const id = await new Promise((res: (id: string) => void) => chrome.notifications.create(options, res));
            res(id);

            // wait for the notification to close and then release the lock.
            // onClosed isn't fired when the user takes action, but pressing a button closes
            // the notification. To fix this we just listen to them as well.
            await merge(
                onClosed$,
                onClicked$,
                onButtonClicked$
            ).pipe(first(e => e.notificationID == id)).toPromise();
        });
    });
}

/**
 * Wrapper around the low-level notification namespace to make it easier to work with.
 *
 * It takes an object-oriented approach i.e. the [[BrowserNotification.update]]/[[BrowserNotification.clear]] operations
 * are methods on the instance.
 *
 * @see [[BrowserNotification.create]] to create a new notification and wrap it with a BrowserNotification.
 */
export class BrowserNotification {
    readonly id: string;

    /**
     * Create a new BrowserNotification around the notification denoted by id.
     *
     * Note that you should use the [[BrowserNotification.create]]
     * function to create a new notification.
     */
    constructor(id: string) {
        this.id = id;
    }

    get onClicked$(): Observable<NotificationEvent> {
        return onClicked$.pipe(filter(ev => ev.notificationID === this.id));
    }

    get onButtonClicked$(): Observable<NotificationEvent> {
        return onButtonClicked$.pipe(filter(ev => ev.notificationID === this.id));
    }

    get onClosed$(): Observable<NotificationEvent> {
        return onClosed$.pipe(filter(ev => ev.notificationID === this.id));
    }

    /**
     * Create a new notification and return it wrapped in a BrowserNotification instance.
     */
    static async create(options: chrome.notifications.NotificationOptions): Promise<BrowserNotification> {
        const id = await createNotification(options);
        return new BrowserNotification(id);
    }

    /** Update the notification. */
    async update(options: chrome.notifications.NotificationOptions): Promise<boolean> {
        return new Promise((res: (wasUpdated: boolean) => void) =>
            chrome.notifications.update(this.id, options, res));
    }

    /** Wait until the notification is closed */
    async waitClosed(): Promise<void> {
        await this.onClosed$.pipe(first()).toPromise();
    }

    /**
     * Wait until the notification is removed.
     * This is different from [[BrowserNotification.waitClosed]] because it waits for the user to take action.
     *
     * On Windows for example the onClosed event is triggered when the notification goes off-screen, but it is still
     * accessible in the notification area. The notification is only truly removed when the user takes some sort of action,
     * either "closing" (clearing) the notification or pressing a button. It seems there is no way to detect the clearing
     * of a notification so we only take the buttons into account.
     */
    async waitRemoved(): Promise<void> {
        await merge(
            this.onClicked$,
            this.onButtonClicked$
        )
            .pipe(first())
            .toPromise();
    }
}