import Manifest = chrome.runtime.Manifest;

export function getManifest(): Manifest {
    return chrome.runtime.getManifest();
}

export function getVersion(): string {
    return getManifest().version;
}