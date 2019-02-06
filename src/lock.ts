/**
 * Even though there is no thread safety to deal with thanks to the magic
 * of Promises there is still a need for locks.
 *
 * @module lock
 */

/** @ignore */

/**
 * Function type that can be provided to [[AsyncLock.withCallback]].
 */
export type WithLockCallback<T> = (lock: AsyncLock) => PromiseLike<T> | T;

/**
 * Key used if no key provided.
 */
export const DefaultLockKey = Symbol("global lock");

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
 * async function write(text: string, key: string, delay?: number): Promise<void> {
 *      await lock.withLock(async () => {
 *          // wait 500ms
 *          await new Promise(res => setTimeout(res, 500 + (delay || 0)));
 *          console.info(text);
 *      }, key);
 * }
 *
 * // these operations will practically start at the same time!
 * // but there will be a 500ms delay between write calls of the same key
 *
 * write("this", "a");
 * write("is", "a");
 * write("me", "a", 10);
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
    private readonly locked: Set<any>;
    private readonly queues: Map<any, (() => void)[]>;

    constructor() {
        this.locked = new Set();
        this.queues = new Map();
    }

    /**
     * Check whether the given key is locked.
     *
     * If provided with multiple keys it checks whether **any**
     * of the keys are locked.
     */
    isLocked(...keys: any[]): boolean {
        if (!keys.length) keys.push(DefaultLockKey);

        return keys.some(key => this.locked.has(key));
    }

    /**
     * Wait for the keys to be unlocked and lock them.
     * **Don't forget to call [[AsyncLock.release]] with the same arguments!**
     *
     * @see [[AsyncLock.withLock]] for a safer and more convenient approach.
     */
    async acquire(...keys: any[]) {
        if (!keys.length) keys.push(DefaultLockKey);

        await Promise.all(keys.map(key => this.waitForLocked(key)));
    }

    /**
     * Unlock the given key(s).
     * **This method should only be called by the code that previously
     * called [[AsyncLock.acquire]]**
     *
     * @see [[AsyncLock.withLock]] for a safer and more convenient approach.
     */
    release(...keys: any[]) {
        if (!keys.length) keys.push(DefaultLockKey);

        for (const key of keys) {
            this.locked.delete(key);
            this.shiftQueue(key);
        }
    }

    /**
     * Perform an action using the lock and then release it again.
     * This method always calls [[AsyncLock.release]] but doesn't silence any
     * errors.
     *
     * The provided `keys` are interpreted the same as for [[AsyncLock.acquire]].
     */
    async withLock<T>(callback: WithLockCallback<T>, ...keys: any[]): Promise<T> {
        await this.acquire(...keys);

        let result;

        try {
            result = await Promise.resolve(callback(this));
        } finally {
            this.release(...keys);
        }

        return result;
    }

    private getQueue(key: any): (() => void)[] {
        let queue = this.queues.get(key);
        if (!queue) {
            queue = [];
            this.queues.set(key, queue);
        }

        return queue;
    }

    private shiftQueue(key: any): void {
        const cb = this.getQueue(key).shift();
        if (cb) cb();
    }

    /**
     * Wait and lock the specified key.
     *
     * @see [[AsyncLock.acquire]] for a high-level method.
     */
    private async waitForLocked(key: any): Promise<void> {
        if (this.locked.has(key)) {
            const queue = this.getQueue(key);
            await new Promise(res => queue.push(res));
        }

        this.locked.add(key);
    }
}