import Plyr from "plyr/src/js/plyr.js";
import "plyr/src/sass/plyr.scss";
import * as React from "react";
import * as ReactDOM from "react-dom";

export interface PlayerSource {
    url: string;
    type?: string;
}

export interface PlayerProps {
    options?: any;
    eventListener?: { [key: string]: (event: CustomEvent) => any };
    poster?: string;
    sources: PlayerSource[];
}

export default class Player extends React.Component<PlayerProps> {
    player?: Plyr;

    componentDidMount() {
        const {eventListener, options} = this.props;
        // normal autoplay doesn't fire ended event!
        const autoplay = options.autoplay;
        options.autoplay = false;

        this.player = new Plyr(ReactDOM.findDOMNode(this), options);

        if (eventListener) {
            for (const [event, handler] of Object.entries(eventListener)) {
                this.player.on(event, handler);
            }
        }

        if (autoplay) this.player.play();
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