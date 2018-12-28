import * as React from "react";
import {IframeHTMLAttributes} from "react";

interface StableIFrameProps extends IframeHTMLAttributes<any> {
}

export default class StableIFrame extends React.Component<StableIFrameProps> {
    shouldComponentUpdate(): boolean {
        return false;
    }

    render() {
        return <iframe {...this.props}/>;
    }
}