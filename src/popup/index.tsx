import * as React from "react";
import {HashRouter} from "react-router-dom";
import dolosTheme from "../theme";
import {reactRenderWithTheme, wrapSentryLogger} from "../utils";
import Popup from "./Popup";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    reactRenderWithTheme(
        wrapSentryLogger(<HashRouter><Popup/></HashRouter>),
        dolosTheme,
        document.getElementById("root")
    );
});