// language=ECMAScript 6
const DELETE_AFTER = `
document.scripts[document.scripts.length - 1]
    .remove();
`;

// language=ECMAScript 6
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

function getRouter() {
    return getApp().__container__.lookup("router:main");
}
`;

interface InjectOptions {
    target?: Element;
    deleteAfter?: boolean;
}

export function injectCode(code: string, options?: InjectOptions): Element {
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

export function transitionTo(view: string, ...args: any[]) {
    injectCode(EMBER_BASE + `getRouter().transitionTo("${view}", ${args.map(arg => JSON.stringify(arg))})`, {deleteAfter: true});
}