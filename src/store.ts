import Config, {buildConfig} from "./config";

function getRaw(keys: string | string[] | Object | null): Promise<{ [key: string]: any }> {
    return new Promise(resolve => {
        chrome.storage.sync.get(keys, resolve);
    });
}

function setRaw(items: Object): Promise<void> {
    return new Promise(resolve => chrome.storage.sync.set(items, resolve));
}

export async function getConfig(): Promise<Config> {
    const raw = await getRaw("config");
    return buildConfig(raw.config);
}

export const setConfig = async (config: Config) => await setRaw({config});