export default class Memory implements HasMemory {
    memory: Readonly<{ [key: string]: any }>;
    private memoryNamespace: { [key: string]: string[] };

    constructor() {
        this.memory = {};
        this.memoryNamespace = {};
    }

    remember(key: string, value: any, ...namespaces: string[]) {
        // @ts-ignore
        this.memory[key] = value;

        namespaces.forEach(ns => {
            const keys = this.memoryNamespace[ns];
            if (keys) keys.push(key);
            else this.memoryNamespace[ns] = [key];
        });
    }

    resetMemory(...namespaces: string[]) {
        if (namespaces) {
            namespaces.forEach(ns => {
                const keys = this.memoryNamespace[ns];
                if (keys) {
                    // @ts-ignore
                    keys.forEach(key => delete this.memory[key]);
                    this.memoryNamespace[ns] = [];
                }
            });
        } else {
            this.memory = {};
            this.memoryNamespace = {};
        }
    }
}

export interface HasMemory<T extends Memory = any> {
    memory: Readonly<{ [key: string]: any }>;
    remember: (key: string, value: any, ...namespaces: string[]) => void;
}

export function cacheInMemory(keyName?: string, ...namespaces: string[]) {
    return function (target: Object & HasMemory, propertyKey: string, descriptor: PropertyDescriptor) {
        keyName = keyName || `${target.constructor.name}-${propertyKey}`;
        const func = descriptor.value;
        let returnPromise;

        descriptor.value = function () {
            const memory = this.memory;

            let value;
            if (keyName in memory) {
                value = memory[keyName];
            } else {
                value = func.apply(this);
                returnPromise = !!value.then;

                Promise.resolve(value)
                    .then(val => this.remember(keyName, val, ...namespaces))
                    .catch(console.error);
            }

            if (returnPromise) return Promise.resolve(value);
            else return value;
        };
    };
}