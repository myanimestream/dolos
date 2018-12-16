import MuiThemeProvider from "@material-ui/core/styles/MuiThemeProvider";
import * as React from "react";
import * as ReactDOM from "react-dom";
import dolosTheme from "../theme";
import Settings from "./Settings";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    ReactDOM.render(<MuiThemeProvider theme={dolosTheme}><Settings/></MuiThemeProvider>, document.getElementById("root"));
});