import {BackgroundStateType} from "./background-state";

export async function getBackgroundWindow(): Promise<Window> {
    // @ts-ignore
    return await new Promise((res, rej) =>
        chrome.runtime.getBackgroundPage(window => {
            if (window) res(window);
            else rej(new Error("background page not found"));
        })
    );
}

export async function getState(): Promise<BackgroundStateType> {
    return (await getBackgroundWindow())["STATE"];
}