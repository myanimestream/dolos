import {waitUntilExists} from "./utils";

const DELETE_AFTER = `
document.scripts[document.scripts.length - 1]
    .remove();
`;

const EMBER_BASE = `
function getApp() {
    const {Namespace, Application} = window["Ember"];
    let application;

    Namespace.NAMESPACES.forEach(namespace => {
        if (namespace instanceof Application) {
            application = namespace;
            return false;
        }
    });

    return application;
}

const getContainer = () => getApp().__container__;
const getRouter = () => getContainer().lookup("router:main");
const getSession = () => getContainer().lookup("session:main");
const getQueryCache = () => getContainer().lookup("service:query-cache");

`;

const EVAL_TEMPLATE = `
function pushResult(value, key) {
    const el = document.createElement("div");
    el.id = "{{uid}}";
    el.setAttribute(key, JSON.stringify(value));
    document.body.appendChild(el);
}

const run = async () => {{{code}}};

run().then(value => pushResult(value, "data-result"),
        reason => pushResult(reason, "data-error"));

`;

interface InjectOptions {
    target?: Element;
    deleteAfter?: boolean;
}

function formatCode(code: string, args: { [key: string]: any }): string {
    for (const [key, value] of Object.entries(args))
        code = code.replace(`{{${key}}}`, value);

    return code;
}

export function injectCode(code: string, options?: InjectOptions): Element {
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

    injectCode(formatCode(EVAL_TEMPLATE, {uid, code}));

    const el = await waitUntilExists(`#${uid}`);

    const error = el.getAttribute("data-error");
    if (error) throw Error(error);

    const result = el.getAttribute("data-result");
    if (result === "undefined") throw Error("Can't evaluate expressions that return undefined, " +
        "please use null or a similar JSON-compatible data type");

    const value = JSON.parse(result);
    el.remove();

    return value;
}

export function transitionTo(view: string, ...args: any[]) {
    injectCode(EMBER_BASE + `getRouter().transitionTo("${view}", ${args.map(arg => JSON.stringify(arg))})`, {deleteAfter: true});
}

export async function getAccessToken(): Promise<string | null> {
    return await evaluateCode(EMBER_BASE + "return getSession().content.authenticated.access_token || null;");
}

export async function setProgress(animeId: string, userId: string, progress: number): Promise<boolean> {
    const SET_PROGRESS = `
return await new Promise(res => getQueryCache()
    .query("library-entry", {filter: {animeId: "${animeId}", userId: "${userId}"}})
    .then(records => {
        const entry = records.firstObject;
        entry.set("progress", ${progress});
        return entry.save();
    })
    .then(() => res(true))
    .catch(reason => res(reason)));
`;
    const result = await evaluateCode(EMBER_BASE + SET_PROGRESS);
    if (result !== true) {
        console.error("couldn't update progress", result);
        return false;
    }

    return true;
}