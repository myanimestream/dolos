/**
 * Entry point for rendering the standalone debug page.
 *
 * @module debug/render
 * @preferred
 */

/** @ignore */

import {createElement} from "react";
import {Debug} from ".";
import {wrapSentryLogger} from "../SentryLogger";
import dolosTheme from "../theme";
import {reactRenderWithTheme} from "../utils";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    reactRenderWithTheme(
        wrapSentryLogger(createElement(Debug)),
        dolosTheme,
        document.getElementById("root")!,
    );
});
