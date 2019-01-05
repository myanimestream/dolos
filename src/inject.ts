import {waitUntilExists} from "./utils";

const DELETE_AFTER = `(${(() => document.currentScript.remove()).toString()})();`;

const PUSH_RESULT = `const pushResult = ${(
    (value: any, key: string) => {
        const el = document.createElement("div");
        el.id = "{{uid}}";
        el.setAttribute(key, JSON.stringify(value));
        document.body.appendChild(el);
    }
).toString()};`;

const EVAL_TEMPLATE = `
${PUSH_RESULT}

const run = async () => {{{code}}};
run().then(value => pushResult(value, "data-result"),
        reason => pushResult(reason, "data-error"));
`;

interface InjectOptions {
    target?: Element;
    deleteAfter?: boolean;
}

export function formatCode(code: string, args: { [key: string]: any }): string {
    for (const [key, value] of Object.entries(args))
        code = code.replace(`{{${key}}}`, value);

    return code;
}

export function injectCode(code: string, options?: Partial<InjectOptions>): Element {
    options = options || {};

    code = `(async () => {${code}})();`;

    if (options.deleteAfter) {
        code += DELETE_AFTER;
    }

    const scriptEl = document.createElement("script");
    const codeEl = document.createTextNode(code);
    scriptEl.appendChild(codeEl);

    (options.target || document.body).appendChild(scriptEl);
    return scriptEl;
}

function getUid(): string {
    return `id-${Math.random().toString(36).substr(2, 16)}`;
}

export async function evaluateCode(code: string): Promise<any> {
    const uid = getUid();
    if (!code.includes("return")) code = `return ${code}`;

    injectCode(formatCode(EVAL_TEMPLATE, {uid, code}), {deleteAfter: true});

    const el = await waitUntilExists(`#${uid}`);

    const error = el.getAttribute("data-error");
    if (error) throw Error(error);

    const result = el.getAttribute("data-result");
    const value = (result === "undefined") ? undefined : JSON.parse(result);

    el.remove();

    return value;
}