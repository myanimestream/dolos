/**
 * @module debug
 * @preferred
 */

/** @ignore */

import * as React from "react";
import {HashRouter} from "react-router-dom";
import dolosTheme from "../theme";
import {reactRenderWithTheme, wrapSentryLogger} from "../utils";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    reactRenderWithTheme(
        wrapSentryLogger(<HashRouter>Debug</HashRouter>),
        dolosTheme,
        // @ts-ignore
        document.getElementById("root"),
    );
});
