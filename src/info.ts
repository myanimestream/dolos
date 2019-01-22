/**
 * A bunch of functions related to metadata.
 *
 * @module info
 */

/** @ignore */
import Manifest = chrome.runtime.Manifest;

export function getManifest(): Manifest {
    return chrome.runtime.getManifest();
}

export function getVersion(): string {
    return getManifest().version;
}