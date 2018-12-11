import Config, {buildConfig} from "./config";
import Language from "./language";

function getRaw(keys?: string | string[] | Object): Promise<{ [key: string]: any }> {
    return new Promise(resolve => {
        chrome.storage.sync.get(keys, resolve);
    });
}

function setRaw(items: Object): Promise<void> {
    return new Promise(resolve => chrome.storage.sync.set(items, resolve));
}

export const getConfig = async () => buildConfig((await getRaw("config")).config);

export const setConfig = async (config: Config) => await setRaw({config});


function buildIdentifier(service_id: string, identifier: string, language: Language, dubbed: boolean): string {
    let key = `${service_id}::${language}_${dubbed ? "dub" : "sub"}::`;

    for (let i = 0; i < identifier.length; i++) {
        key += identifier.charCodeAt(i).toString(16);
    }

    return key;
}

export async function getUID(service_id: string, identifier: string, language: Language, dubbed: boolean): Promise<string | null> {
    let key = buildIdentifier(service_id, identifier, language, dubbed);
    return (await getRaw(key))[key];
}

export async function setUID(service_id: string, identifier: string, language: Language, dubbed: boolean, uid: string) {
    let key = buildIdentifier(service_id, identifier, language, dubbed);

    await setRaw({[key]: uid});
}