/**
 * Client library for interacting with the [Grobber API](https://grobber.docs.apiary.io/).
 *
 * @module grobber
 * @preferred
 */

/** @ignore */

import {GrobberClient} from "./client";
import {RemoteGrobberClient} from "./remote";

export * from "./client";
export * from "./models";
export * from "./remote";

/**
 * Default client which can be used.
 */
export const grobberClient = new GrobberClient();

/**
 * Default remote grobber client which can be used.
 */
export const remoteGrobberClient = new RemoteGrobberClient();
