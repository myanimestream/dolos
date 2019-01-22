/**
 * Because extension content scripts run in their own sand-boxed environment they can't easily access
 * the page's Javascript namespace.
 * But this module helps you do exactly that.
 *
 * You can use [[injectCode]] to simply run code in the page's context and [[evaluateCode]] if you need
 * to pass a value back.
 *
 * ### Using real functions in your code
 * The code needs to be written in Javascript that can be executed by the browser. It isn't processed in any way.
 * If possible, write an actual function which you then convert to a string to leverage the power of TypeScript.
 *
 * @example
 * ```typescript
 *
 * // write the function like you would for any other function, this way it'll
 * // be compiled to the targeted javascript version
 * function test(value: any): string {
 *     return value.toString();
 * }
 *
 * const code = `
 *      // test now holds the compiled test function code
 *      const test = ${test.toString()};
 *      return test(5);
 * `;
 *
 * // returns "5"
 * await evaluateCode(code);
 * ```
 *
 * ### Getting something from the page
 * Let's say you want to access the variable `USER_NAME` which the page conveniently exposes to the global scope,
 * you can simply grab it using [[evaluateCode]].
 *
 * @example
 * ```typescript
 *
 * const username = await evaluateCode(`USER_NAME`);
 * ```
 *
 *### Running code
 * If you have to call a function in the page to perform some action, say,
 * changing the colour of the background (called "changeBackgroundColour"), you can use [[injectCode]]
 * to simply run it.
 *
 * @example
 * ```typescript
 *
 * injectCode(`changeBackgroundColour("green");`);
 * ```
 *
 * @module inject
 */

/** @ignore */
import {waitUntilExists} from "./utils";

/**
 * Code mix-in which when executed immediately removes the current script element from the DOM.
 *
 * @see [[injectCode]] with [[InjectOptions.keepAfterExecution]] set to `false`
 */
const DELETE_AFTER = `(${(() => {
    const script = document.currentScript;
    if (script) script.remove();
}).toString()})();`;

/**
 * Code mix-in which exposes the `pushResult(value: any, key: string)` function
 * to "expose" a value in an element so that it can be accessed from the extension context.
 *
 * Requires the variable `uid` to be set using [[formatCode]].
 *
 * @see [[evaluateCode]]
 */
const PUSH_RESULT = `const pushResult = ${(
    (value: any, key: string) => {
        const el = document.createElement("div");
        el.id = "{{uid}}";
        el.setAttribute(key, JSON.stringify(value));
        document.body.appendChild(el);
    }
).toString()};`;

/**
 * Code mix-in to evaluate some code and expose the return value in the DOM.
 * It relies on [[PUSH_RESULT]].
 *
 * Requires `code`, and `uid` to be set using [[formatCode]].
 *
 * Works by wrapping `code` in an async function and
 * pushing the result after finishing.
 *
 * @see [[evaluateCode]]
 */
const EVAL_TEMPLATE = `
${PUSH_RESULT}

const run = async () => {{{code}}};
run().then(value => pushResult(value, "data-result"),
        reason => pushResult(reason.toString(), "data-error"));
`;

/**
 * Options for injections.
 */
interface InjectOptions {
    /**
     * Element to append the script element to. Defaults to the document body.
     */
    target?: Element;
    /**
     * When set to true the script element will **NOT** be removed from the document after executing.
     */
    keepAfterExecution?: boolean;
}

/**
 * A simple formatter that can be used to format template code.
 *
 * The code uses `{{name}}` syntax to indicate templates which can be replaced by providing `{name: "value"}`
 * to the function.
 *
 * This function is very basic and shouldn't be used for more complex templates!
 */
export function formatCode(code: string, args: { [key: string]: any }): string {
    for (const [key, value] of Object.entries(args))
        code = code.replace(`{{${key}}}`, value);

    return code;
}

/**
 * Inject javascript code to be run in the context of the page's Window.
 *
 * @return script tag that the code was injected to.
 */
export function injectCode(code: string, options?: Partial<InjectOptions>): Element {
    options = options || {};

    code = `(async () => {${code}})();`;

    if (!options.keepAfterExecution) {
        code += DELETE_AFTER;
    }

    const scriptEl = document.createElement("script");
    const codeEl = document.createTextNode(code);
    scriptEl.appendChild(codeEl);

    (options.target || document.body).appendChild(scriptEl);
    return scriptEl;
}

/**
 * Generate a random id.
 * This function is used to communicate between the windows by giving each evaluation context its own id.
 */
function getUid(): string {
    return `id-${Math.random().toString(36).substr(2, 16)}`;
}

/**
 * Evaluate `code` in the context of the page window and return its result.
 * This function can be used to get access to Javascript variables
 * because extensions don't have access to the page's Window object.
 *
 * The return value needs to be **JSON serializable**!
 *
 * @see [[injectCode]] if you only need to execute code without getting the result.
 *
 * @param code - Supports both sync and async code. If you don't use an explicit return statement your
 * code will be prefixed with `return`. This can be used to create simple eval statements:
 * ```typescript
 * // title holds the document title (note: there's no need to use evaluateCode for this)
 * const title = await evaluateCode(`document.title`);
 * ```
 *
 * @throws Any errors that occurred during execution of the code
 */
export async function evaluateCode(code: string): Promise<any> {
    const uid = getUid();
    if (!code.includes("return")) code = `return ${code}`;

    injectCode(formatCode(EVAL_TEMPLATE, {uid, code}));

    const el = await waitUntilExists(`#${uid}`);

    const error = el.getAttribute("data-error");
    if (error) throw Error(error);

    const result = el.getAttribute("data-result");
    if (result === null)
        throw new Error("No result passed!");

    const value = (result === "undefined") ? undefined : JSON.parse(result);

    el.remove();

    return value;
}