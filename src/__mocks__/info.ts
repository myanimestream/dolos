import Manifest = chrome.runtime.Manifest;

export function getManifest(): Manifest {
    // @ts-ignore
    return {};
}

export function getVersion(): string {
    return getManifest().version;
}
