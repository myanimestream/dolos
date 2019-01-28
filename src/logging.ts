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
    dsn: Secrets.sentryDSN
});

export {default as SentryLogger} from "./SentryLogger";

export const keenClient = new KeenTracking({
    projectId: Secrets.keenProjectID || "",
    writeKey: Secrets.keenWriteKey || ""
});

// keen isn't a big fan of extension pages, so if it doesn't work, just ignore it.
try {
    keenClient.initAutoTracking();
} catch {
}