/**
 * Logic that is run in the background page of the extension.
 *
 * @module background
 * @preferred
 */

if (!chrome.browserAction) throw new Error("Background imported in non-background page context!");

/** @ignore */

import {grobberClient, RemoteGrobberClientServer} from "dolos/grobber";
import "./events";

const remoteGrobberClientServer = new RemoteGrobberClientServer(grobberClient);
remoteGrobberClientServer.serve();
