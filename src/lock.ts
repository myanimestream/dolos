/**
 * @module lock
 */

/** @ignore */
export default class AsyncLock {
    private readonly locked: { [key: string]: boolean };
    private readonly queues: { [key: string]: (() => void)[] };

    constructor() {
        this.locked = {};
        this.queues = {};
    }

    isLocked(key?: string | string[]): boolean {
        if (Array.isArray(key)) {
            return key.some(k => this.isLocked(k));
        }

        return this.locked[key || ""];
    }

    async acquire(key?: string | string[]) {
        if (Array.isArray(key)) {
            await Promise.all(key.map(k => this.acquire(k)));
            return;
        }

        await this.waitForLock(key);
        this.locked[key || ""] = true;
    }

    release(key?: string | string[]) {
        if (Array.isArray(key)) {
            key.forEach(k => this.release(k));
            return;
        }

        if (!this.isLocked(key)) throw new Error("Lock isn't locked");
        this.locked[key || ""] = false;
        this.shiftQueue(key);
    }

    async withLock<T>(callback: (lock?: AsyncLock) => PromiseLike<T>, key?: string | string[]): Promise<T> {
        await this.acquire(key);
        try {
            return await Promise.resolve(callback(this));
        } finally {
            this.release(key);
        }
    }

    private getQueue(key?: string): (() => void)[] {
        let queue = this.queues[key || ""];
        if (!queue) queue = this.queues[key || ""] = [];

        return queue;
    }

    private shiftQueue(key?: string) {
        const cb = this.getQueue(key).shift();
        if (cb) cb();
    }

    private async waitForLock(key?: string) {
        if (!this.isLocked(key)) return;
        await new Promise(res => this.getQueue(key).push(res));
    }
}