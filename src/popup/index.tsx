import * as React from "react";
import dolosTheme from "../theme";
import {reactRenderWithTeme} from "../utils";
import Popup from "./Popup";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    reactRenderWithTeme(<Popup/>, dolosTheme, document.getElementById("root"));
});