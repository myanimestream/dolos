/**
 * @module components
 */

import * as React from "react";
import {IframeHTMLAttributes} from "react";

type StableIFrameProps = IframeHTMLAttributes<any>;

export class StableIFrame extends React.Component<StableIFrameProps> {
    public shouldComponentUpdate(nextProps: Readonly<StableIFrameProps>): boolean {
        return nextProps !== this.props;
    }

    public render() {
        return <iframe {...this.props}/>;
    }
}
