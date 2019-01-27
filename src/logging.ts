/**
 * @module logging
 * @preferred
 */

/** @ignore */
import * as Sentry from "@sentry/browser";
import {getVersion} from "./info";

/** Sentry release */
const release = `dolos@${getVersion()}`;

Sentry.init({
    release,
    dsn: "https://cd0b73d8cc56445ca49d154ca6e7f12d@sentry.io/1361461"
});

export {default as SentryLogger} from "./SentryLogger";

// export const keenClient = new KeenTracking({
//     projectId: "",
//     requestType: "",
//     writeKey: ""
// });
//
// keenClient.initAutoTracking();