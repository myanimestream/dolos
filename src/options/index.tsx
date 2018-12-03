import * as React from "react";
import * as ReactDOM from "react-dom";
import Settings from "./Settings";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    ReactDOM.render(<Settings/>, document.getElementById("root"));
});