/**
 * @module common.components
 */

import * as React from "react";
import {IframeHTMLAttributes} from "react";

interface StableIFrameProps extends IframeHTMLAttributes<any> {
}

export default class StableIFrame extends React.Component<StableIFrameProps> {
    shouldComponentUpdate(nextProps: Readonly<StableIFrameProps>): boolean {
        return nextProps != this.props;
    }

    render() {
        return <iframe {...this.props}/>;
    }
}