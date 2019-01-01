import * as Sentry from "@sentry/browser";
import ReactGA from "react-ga";
import {getVersion} from "./info";

const release = `dolos@${getVersion()}`;

Sentry.init({
    release,
    dsn: "https://cd0b73d8cc56445ca49d154ca6e7f12d@sentry.io/1361461"
});

ReactGA.initialize("UA-131499018-1", {
    debug: true,
    gaAddress: "https://ssl.google-analytics.com/ga.js",
});

ReactGA.set({release});

export {default as SentryLogger} from "./SentryLogger";
export {default as ReactGA} from "react-ga";