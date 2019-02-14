/**
 * @module debug
 * @preferred
 */

/** @ignore */

import * as React from "react";
import dolosTheme from "../theme";
import {reactRenderWithTheme, wrapSentryLogger} from "../utils";
import {Debug} from "./Debug";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    reactRenderWithTheme(
        wrapSentryLogger(<Debug/>),
        dolosTheme,
        // @ts-ignore
        document.getElementById("root"),
    );
});
