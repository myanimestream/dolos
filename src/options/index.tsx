import * as React from "react";
import dolosTheme from "../theme";
import {reactRenderWithTheme, wrapSentryLogger} from "../utils";
import Settings from "./Settings";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    reactRenderWithTheme(
        wrapSentryLogger(<Settings/>),
        dolosTheme,
        // @ts-ignore
        document.getElementById("root")
    );
});