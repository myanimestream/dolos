/**
 * Telemetry and Error tracking.
 *
 * @module logging
 * @preferred
 */

/** @ignore */
import * as Sentry from "@sentry/browser";
import {getVersion} from "./info";
import Secrets from "./secrets";

/** Sentry release */
const release = `dolos@${getVersion()}`;

Sentry.init({
    dsn: Secrets.sentryDSN,
    environment: Secrets.sentryEnvironment,
    release,
});

export {default as SentryLogger} from "./SentryLogger";
