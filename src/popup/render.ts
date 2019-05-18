/**
 * Entry point for rendering the popup.
 * Importing this will immediately cause the popup to be rendered.
 *
 * @module popup/render
 * @preferred
 */

/** @ignore */

import {wrapSentryLogger} from "dolos/SentryLogger";
import {createElement} from "react";
import {HashRouter} from "react-router-dom";
import {Popup} from ".";
import dolosTheme from "../theme";
import {reactRenderWithTheme} from "../utils";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    const el = createElement(HashRouter, {}, createElement(Popup));

    reactRenderWithTheme(
        wrapSentryLogger(el),
        dolosTheme,
        document.getElementById("root")!,
    );
});
