/**
 * Even though there is no thread safety to deal with thanks to the magic
 * of Promises there is still a need for locks.
 *
 * @module lock
 */

/** @ignore */

/**
 * A namespaced Semaphore for asynchronous operations.
 *
 * Not providing a key to the methods makes this function as if
 * it were a normal Semaphore.
 *
 * @example
 * ```typescript
 *
 * const lock = new AsyncLock();
 *
 * async write(text: string, key: string): Promise<void> {
 *      await lock.withLock(() => {
 *          // delay 500 ms to simulate load
 *          await new Promise(res => setTimeout(res, 500));
 *          console.info(text);
 *      }, key);
 * }
 *
 * // these operations will practically start at the same time!
 * // but there will be a 500ms delay between write calls of the same key
 *
 * write("this", "a");
 * write("is", "a");
 * write("me", "a");
 *
 * write("cute", "b");
 * write("not", "b");
 * write("loyal", "b");
 *
 * write("dog", "c");
 * write("very", "c");
 * write("to", "c");
 *
 * // Output:
 * // *500ms pass*
 * // this cute dog
 * // *500ms pass*
 * // is not very
 * // *500ms pass*
 * // loyal to me
 * ```
 */
export default class AsyncLock {
    private readonly locked: { [key: string]: boolean };
    private readonly queues: { [key: string]: (() => void)[] };

    constructor() {
        this.locked = {};
        this.queues = {};
    }

    /**
     * Check whether the given key is locked.
     *
     * If provided with an array of keys it checks whether **any**
     * of the keys are locked.
     *
     * > If you nest a list of keys within the list of keys,
     * > while this isn't supported, it recursively checks whether any
     * > of the keys is locked.
     */
    isLocked(key?: string | string[]): boolean {
        if (Array.isArray(key)) {
            return key.some(k => this.isLocked(k));
        }

        return this.locked[key || ""];
    }

    /**
     * Wait for the keys to be unlocked and lock them.
     * **Don't forget to call [[AsyncLock.release]] with the same argument!**
     *
     * @see [[AsyncLock.withLock]] for a safer and more convenient approach.
     */
    async acquire(key?: string | string[]) {
        if (Array.isArray(key)) {
            await Promise.all(key.map(k => this.acquire(k)));
            return;
        }

        await this.waitForLock(key);
        this.locked[key || ""] = true;
    }

    /**
     * Unlock the given key(s).
     * **This method should only be called by the code that previously
     * called [[AsyncLock.acquire]]**
     *
     * @see [[AsyncLock.withLock]] for a safer and more convenient approach.
     *
     * @throws Error - When the lock isn't locked
     */
    release(key?: string | string[]) {
        if (Array.isArray(key)) {
            key.forEach(k => this.release(k));
            return;
        }

        if (!this.isLocked(key)) throw new Error("Lock isn't locked");
        this.locked[key || ""] = false;
        this.shiftQueue(key);
    }

    /**
     * Perform an action using the lock and then release it again.
     * This method always calls [[AsyncLock.release]] but doesn't silence any
     * errors.
     *
     * The provided `keys` are interpreted the same as for [[AsyncLock.acquire]].
     */
    async withLock<T>(callback: (lock?: AsyncLock) => PromiseLike<T> | T, key?: string | string[]): Promise<T> {
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