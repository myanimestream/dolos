/**
 * A module to make working with notifications easier.
 *
 * It mainly provides the [[BrowserNotification]] class which can be used to manage notifications.
 */

/**
 * Event emitted for all interactions with the notification.
 *
 * @see [[NotificationButtonEvent]] for the event specific to buttons pressed.
 */
export interface NotificationEvent {
    notificationId: string;
}

/**
 * Event emitted when a user clicks a button.
 */
export interface NotificationButtonEvent extends NotificationEvent {
    buttonIndex: number;
}

/**
 * Type of a notification event listener. It receives only the [[NotificationEvent]] as an argument.
 */
type NotificationListener<T extends NotificationEvent> = (event: T) => void;

/** @ignore */
const eventListeners: { [key: string]: NotificationListener<any>[] } = {
    "clicked": [],
    "buttonClicked": [],
    "closed": [],
};

/**
 * Add an event listener for notification events.
 *
 * This is basically just a wrapper around `chrome.notifications`,
 * but it's structured differently.
 * The events are named "clicked", "buttonClicked", and "closed" and the [[NotificationListener]]
 * only takes one argument, a [[NotificationEvent]].
 */
function addEventListener(type: string, listener: NotificationListener<any>): void {
    eventListeners[type].push(listener);
}

/**
 * Remove an event listener again.
 *
 * @param listener - Listener to remove. If not specified remove all listeners for the given type.
 */
function removeEventListener(type: string, listener?: NotificationListener<any>): void {
    const listeners = eventListeners[type];

    if (listener) {
        const index = listeners.indexOf(listener);
        listeners.splice(index);
    } else {
        while (listeners.pop()) {
        }
    }
}

/** @ignore */
function dispatchEvent(type: string, event: NotificationEvent): void {
    const listeners = eventListeners[type];
    if (listeners) {
        listeners.forEach(listener => listener(event));
    }
}

chrome.notifications.onClicked.addListener(notificationId =>
    dispatchEvent("clicked", {notificationId,}));

chrome.notifications.onClosed.addListener(notificationId =>
    dispatchEvent("closed", {notificationId,}));

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) =>
    dispatchEvent("buttonClicked", {notificationId, buttonIndex} as NotificationButtonEvent));

export interface NotificationEventTarget {
    addEventListener(type: string, listener: NotificationListener<any>): void;

    removeEventListener(type: string, listener?: NotificationListener<any>): void;
}

class NotificationEventTargetProxy<T extends NotificationEvent> {
    private readonly target: NotificationEventTarget;
    private readonly type: string;

    constructor(target: NotificationEventTarget, type: string) {
        this.target = target;
        this.type = type;
    }

    addEventListener(listener: NotificationListener<T>): void {
        this.target.addEventListener(this.type, listener);
    }

    removeEventListener(listener?: NotificationListener<T>): void {
        this.target.removeEventListener(this.type, listener);
    }
}

/**
 * Wrapper around the low-level notification namespace to make it easier to work with.
 *
 * It takes an object-oriented approach i.e. the [[BrowserNotification.update]]/[[BrowserNotification.clear]] operations
 * are methods on the instance.
 *
 * @see [[BrowserNotification.create]] to create a new notification and wrap it with a BrowserNotification.
 */
export class BrowserNotification implements NotificationEventTarget {
    readonly id: string;

    readonly onClicked: NotificationEventTargetProxy<NotificationEvent>;
    readonly onButtonClicked: NotificationEventTargetProxy<NotificationButtonEvent>;
    readonly onClosed: NotificationEventTargetProxy<NotificationEvent>;

    private listenersAdded: { [key: string]: Set<NotificationListener<any>> };

    /**
     * Create a new BrowserNotification around the notification denoted by id.
     *
     * Note that you should use the [[BrowserNotification.create]]
     * function to create a new notification.
     */
    constructor(id: string) {
        this.id = id;

        this.onClicked = new NotificationEventTargetProxy(this, "clicked");
        this.onButtonClicked = new NotificationEventTargetProxy(this, "buttonClicked");
        this.onClosed = new NotificationEventTargetProxy(this, "closed");

        this.onClosed.addEventListener(() => this.cleanup);
    }

    /**
     * Create a new notification and return it wrapped in a BrowserNotification instance.
     */
    static async create(options: chrome.notifications.NotificationOptions): Promise<BrowserNotification> {
        return new Promise((res: (id: string) => void) => chrome.notifications.create(options, res))
            .then((id: string) => new BrowserNotification(id));
    }

    /**
     * Update the notification.
     */
    async update(options: chrome.notifications.NotificationOptions): Promise<boolean> {
        return new Promise((res: (wasUpdated: boolean) => void) =>
            chrome.notifications.update(this.id, options, res));
    }

    /**
     * Clear the notification.
     */
    async clear(): Promise<boolean> {
        return new Promise((res: (wasUpdated: boolean) => void) =>
            chrome.notifications.clear(this.id, res));
    }

    /**
     * Add an event listener for this notification.
     */
    addEventListener(type: string, listener: NotificationListener<any>): void {
        addEventListener(type, listener);
        let listeners = this.listenersAdded[type];
        if (!listeners)
            listeners = this.listenersAdded[type] = new Set();

        listeners.add(listener);
    }

    /**
     * Remove an event listener.
     *
     * @param listener - Listener to remove. If not specified, remove all listeners for type.
     */
    removeEventListener(type: string, listener?: NotificationListener<any>): void {
        if (listener) {
            removeEventListener(type, listener);
            this.listenersAdded[type].delete(listener);
        } else this.removeAllListeners(type);
    }

    /**
     * Remove all listeners.
     *
     * @param type - Listener type to remove. If not specified remove all listeners regardless of type.
     */
    removeAllListeners(type?: string): void {
        let listeners;
        if (type) {
            listeners = this.listenersAdded[type];
            if (listeners) {
                listeners.forEach(listener => removeEventListener(type, listener));
                delete this.listenersAdded[type];
            }
        } else {
            Object.entries(this.listenersAdded)
                .forEach(([type, listeners]) =>
                    listeners.forEach(listener =>
                        removeEventListener(type, listener)
                    )
                );
            this.listenersAdded = {};
        }
    }

    private cleanup() {
        this.removeAllListeners();
    }
}