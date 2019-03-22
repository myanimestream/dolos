/**
 * Entry point for rendering the settings page.
 * Immediately renders on import.
 *
 * @module options/render
 * @preferred
 */

/** @ignore */

import * as React from "react";
import {Settings} from ".";
import dolosTheme from "../theme";
import {reactRenderWithTheme, wrapSentryLogger} from "../utils";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    reactRenderWithTheme(
        wrapSentryLogger(React.createElement(Settings)),
        dolosTheme,
        // @ts-ignore
        document.getElementById("root"),
    );
});
