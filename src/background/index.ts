/**
 * Logic that is run in the background page of the extension.
 *
 * @module background
 * @preferred
 */

if (!chrome.browserAction) throw new Error("Background imported in non-background page context!");

/** @ignore */

import "./events";
