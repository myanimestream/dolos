import * as React from "react";
import dolosTheme from "../theme";
import {reactRenderWithTheme, wrapSentryLogger} from "../utils";
import Popup from "./Popup";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    reactRenderWithTheme(wrapSentryLogger(<Popup/>), dolosTheme, document.getElementById("root"));
});