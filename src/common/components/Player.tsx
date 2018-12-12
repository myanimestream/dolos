import Plyr from "plyr/src/js/plyr.js";
import "plyr/src/sass/plyr.scss";
import * as React from "react";
import * as ReactDOM from "react-dom";

export interface PlayerSource {
    url: string;
    type?: string;
}

export interface PlayerProps {
    options?: Object;
    poster?: string;
    sources: PlayerSource[];
}

export default class Player extends React.Component<PlayerProps> {
    player?: Plyr;

    componentDidMount() {
        this.player = new Plyr(ReactDOM.findDOMNode(this), this.props.options);
    }

    componentWillUnmount() {
        if (this.player) this.player.destroy();
    }

    renderSource(): React.ReactElement<any>[] {
        // currently plyr breaks when not supplying a video type, this defaulting to video/mp4
        return this.props.sources.map((source, index) => <source key={index} src={source.url} type={source.type || "video/mp4"}/>);
    }

    render() {
        return (
            <video poster={this.props.poster} playsInline controls>
                {this.renderSource()}
            </video>
        );
    }
}