interface ObservableContainer {
    [key: string]: any;
}

type ObservableChangeHandler = (value: any, key: string) => void;

class Observable<T extends ObservableContainer> {
    private readonly listeners: { [key: string]: ObservableChangeHandler[] };
    private readonly container: ObservableContainer;

    constructor(container?: Partial<T>) {
        this.listeners = {};
        this.container = container || {};
    }

    onChange(key: string & keyof T, handler: ObservableChangeHandler) {
        if (key in this.listeners) {
            this.listeners[key].push(handler);
        } else {
            this.listeners[key] = [handler];
        }

        return this;
    }

    updateOn(key: string & keyof T, handler: ObservableChangeHandler) {
        this.onChange(key, handler);

        handler(this.get(key), key);

        return this;
    }

    set(key: string & keyof T, value: any): boolean {
        this.container[key] = value;

        const listeners = this.listeners[key];
        if (listeners) listeners.forEach(listener => listener(value, key));

        return true;
    }

    get(key: string & keyof T): any {
        return this.container[key];
    }
}

const BackgroundStateContainer = {
    hasNewVersion: false
};

const BackgroundState = new Observable<typeof BackgroundStateContainer>(BackgroundStateContainer);
type BackgroundStateType = typeof BackgroundState & typeof BackgroundStateContainer;

window["STATE"] = new Proxy(BackgroundState, {
    get(target: Observable<typeof BackgroundStateContainer>, p: keyof typeof BackgroundStateContainer): any {
        if (p in target) {
            return target[p];
        }

        return target.get(p);
    },
    set(target: Observable<typeof BackgroundStateContainer>, p: keyof typeof BackgroundStateContainer, value: any): boolean {
        return target.set(p, value);
    }
}) as BackgroundStateType;

export {BackgroundStateType};