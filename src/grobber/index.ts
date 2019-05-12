/**
 * Client library for interacting with the [Grobber API](https://grobber.docs.apiary.io/).
 * Next to the [[GrobberClient]] this module also exposes some specialised classes.
 *
 * [[RemoteGrobberClient]] uses extension messages to perform the workload in
 * [[RemoteGrobberClientServer]] which should be running in the background.
 * This allows for some powerful caching which otherwise wouldn't be possible.
 *
 * For [[GrobberClient]] and [[RemoteGrobberClient]] there are exported
 * "static" instances [[grobberClient]] and [[remoteGrobberClient]] respectively.
 *
 * @module grobber
 * @preferred
 */

/** @ignore */

import {store} from "dolos/store";
import {GrobberClient} from "./client";
import {RemoteGrobberClient} from "./remote";

export * from "./client";
export * from "./models";
export * from "./remote";

/**
 * Default [[GrobberClient]].
 *
 * Uses the dolos config.
 */
export const grobberClient = new GrobberClient(store.getConfig$());

/**
 * Default [[RemoteGrobberClient]].
 */
export const remoteGrobberClient = new RemoteGrobberClient();
