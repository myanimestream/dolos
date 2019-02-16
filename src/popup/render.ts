/**
 * Entry point for rendering the popup.
 * Importing this will immediately cause the popup to be rendered.
 *
 * @module popup/render
 * @preferred
 */

/** @ignore */

import * as React from "react";
import {HashRouter} from "react-router-dom";
import {Popup} from ".";
import dolosTheme from "../theme";
import {reactRenderWithTheme, wrapSentryLogger} from "../utils";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    const el = React.createElement(HashRouter, {}, React.createElement(Popup));

    reactRenderWithTheme(
        wrapSentryLogger(el),
        dolosTheme,
        // @ts-ignore
        document.getElementById("root"),
    );
});
