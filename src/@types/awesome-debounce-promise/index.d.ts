declare module "awesome-debounce-promise" {
    interface DebounceOptions {
        /** Set leading: true if you want to call func and return its promise immediately. */
        leading?: boolean;

        /**
         * Set accumulate: true if you want the debounced function to be called
         * with an array of all the arguments received while waiting.
         */
        accumulate?: boolean;
    }

    /**
     * Returns a debounced version of func that delays invoking until after wait milliseconds.
     */
    export function debounce<T extends (...args: any[]) => any>(
        func: T,
        wait?: number,
        options?: DebounceOptions
    ): (...args: Parameters<T>) => ReturnType<T> extends Promise<any>
        ? ReturnType<T>
        : Promise<ReturnType<T>>;

    /**
     * Given a function returning promises, wrap it so that only the promise returned from last call will actually resolve
     * This is useful to ignore former async results and handle concurrency issues
     */
    export function onlyResolvesLast<T extends (...args: any[]) => Promise<any>>(func: T):
        (...args: Parameters<T>) => ReturnType<T>;

    interface AwesomeDebounceOptions extends DebounceOptions {
        /**
         * One distinct debounced function is created per key and added to an internal cache
         * By default, the key is null, which means that all the calls
         * will share the same debounced function
         */
        key?: (...args: any[]) => any;

        /**
         * By default, a debounced function will only resolve
         * the last promise it returned
         * Former calls will stay unresolved, so that you don't have
         * to handle concurrency issues in your code
         * Setting this to false means all returned promises will resolve to the last result
         */
        onlyResolvesLast?: boolean;
    }

    /**
     * We create a debouncing function cache, because when wrapping the original function,
     * we may actually want to route the function call to different debounced functions depending function paameters
     */
    export interface DebounceCache {
        debounceCache: { [key: string]: (...args: any[]) => any };

        getDebouncedFunction<T extends (...args: any[]) => any>(
            func: T,
            wait: number,
            options: AwesomeDebounceOptions,
            args: any[]): (...args: Parameters<T>) => ReturnType<T>;
    }


    /**
     * Returns a debounced version of func that delays invoking until after wait milliseconds.
     */
    export default function AwesomeDebouncePromise<T extends (...args: any[]) => any>(
        func: T,
        wait?: number,
        options?: AwesomeDebounceOptions
    ): (...args: Parameters<T>) => ReturnType<T> extends Promise<any>
        ? ReturnType<T>
        : Promise<ReturnType<T>>;
}