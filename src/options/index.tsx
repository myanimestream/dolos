import * as React from "react";
import dolosTheme from "../theme";
import {reactRenderWithTeme} from "../utils";
import Settings from "./Settings";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    reactRenderWithTeme(<Settings/>, dolosTheme, document.getElementById("root"));
});