/**
 * @module logging
 * @preferred
 */

/** @ignore */
import * as Sentry from "@sentry/browser";
import KeenTracking from "keen-tracking";
import {getVersion} from "./info";
import Secrets from "./secrets";

/** Sentry release */
const release = `dolos@${getVersion()}`;

Sentry.init({
    release,
    dsn: Secrets.sentryDSN,
});

export {default as SentryLogger} from "./SentryLogger";

export const keen = new KeenTracking({
    projectId: Secrets.keenProjectID || "",
    writeKey: Secrets.keenWriteKey || ""
});

keen.extendEvents({
    dolos: {
        version: getVersion()
    }
});

// keen isn't a big fan of extension pages, so if it doesn't work, just ignore it.
try {
    keen.initAutoTracking();
} catch {
}