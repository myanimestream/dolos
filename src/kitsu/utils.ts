import {evaluateCode, injectCode} from "../inject";

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