/**
 * A bunch of functions related to metadata.
 *
 * @module info
 */

/** @ignore */
import Manifest = chrome.runtime.Manifest;

/**
 * Get the manifest.json data
 */
export function getManifest(): Manifest {
    return chrome.runtime.getManifest();
}

/**
 * Get the current version as specified in the manifest.json file.
 */
export function getVersion(): string {
    return getManifest().version;
}