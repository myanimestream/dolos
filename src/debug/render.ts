/**
 * Entry point for rendering the standalone debug page.
 *
 * @module debug/render
 * @preferred
 */

/** @ignore */

import {createElement} from "react";
import {Debug} from ".";
import dolosTheme from "../theme";
import {reactRenderWithTheme, wrapSentryLogger} from "../utils";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    reactRenderWithTheme(
        wrapSentryLogger(createElement(Debug)),
        dolosTheme,
        // @ts-ignore
        document.getElementById("root"),
    );
});
