import * as Sentry from "@sentry/browser";

function initSentry() {
    Sentry.init({dsn: "https://cd0b73d8cc56445ca49d154ca6e7f12d@sentry.io/1361461"});
}

initSentry();

export {default as SentryLogger} from "./SentryLogger";