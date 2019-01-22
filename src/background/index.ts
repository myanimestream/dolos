/**
 * Test
 * @module background
 * @preferred
 */

if (!chrome.browserAction) throw new Error("Background imported in non-background page context!");

/** @ignore */
import "./events";