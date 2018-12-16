import MuiThemeProvider from "@material-ui/core/styles/MuiThemeProvider";
import * as React from "react";
import * as ReactDOM from "react-dom";
import dolosTheme from "../theme";
import Popup from "./Popup";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    ReactDOM.render(<MuiThemeProvider theme={dolosTheme}><Popup/></MuiThemeProvider>, document.getElementById("root"));
});