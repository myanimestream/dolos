import * as React from "react";

import DolosAppBar from "./AppBar";


interface AppProps {
}

interface AppState {
}

export default class Popup extends React.Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
    }

    componentDidMount() {
        // Example of how to send a message to background.ts.
        chrome.runtime.sendMessage({popupMounted: true});
    }

    render() {
        return (
            <DolosAppBar/>
        )
    }
}