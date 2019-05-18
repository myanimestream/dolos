/**
 * Telemetry and Error tracking.
 *
 * @module logging
 * @preferred
 */

/** @ignore */
import {init} from "@sentry/browser";
import {getVersion} from "./info";
import Secrets from "./secrets";

/** Sentry release */
const release = `dolos@${getVersion()}`;

init({
    dsn: Secrets.sentryDSN,
    environment: Secrets.sentryEnvironment,
    release,
});

export * from "@sentry/browser";
