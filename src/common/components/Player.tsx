/**
 * @module common/components
 */

import {WithStyles} from "@material-ui/core/styles";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles from "@material-ui/core/styles/withStyles";
// @ts-ignore
import Plyr from "plyr/src/js/plyr";
import "plyr/src/sass/plyr.scss";
import * as React from "react";
import * as ReactDOM from "react-dom";

/** @ignore */
const styles = () => createStyles({
    plyrContainer: {
        "& .plyr": {
            height: "100%",
            width: "100%",
        },
        "height": "100%",
        "width": "100%",
    },
});

export interface PlayerSource {
    url: string;
    type?: string;
}

export type PlyrEvents = Plyr.StandardEvent | Plyr.Html5Event;

export interface PlayerProps extends WithStyles<typeof styles> {
    options?: any;
    eventListener?: Partial<{ [key in PlyrEvents]: (event: CustomEvent) => any }>;
    poster?: string;
    sources: PlayerSource[];
}

// tslint:disable-next-line:variable-name
export const Player = withStyles(styles)(
    class extends React.Component<PlayerProps> {
        public player?: Plyr;

        public componentDidMount() {
            const {eventListener, options} = this.props;
            // normal autoplay only works when muted and doesn't fire "ended" event!
            const autoplay = options.autoplay;
            options.autoplay = false;

            const domNode = ReactDOM.findDOMNode(this);
            if (!(domNode && domNode.firstChild))
                throw new Error("Couldn't find dom node");

            this.player = new Plyr(domNode.firstChild as HTMLElement, options);

            if (eventListener) {
                for (const [event, handler] of Object.entries(eventListener)) {
                    if (!handler) continue;
                    this.player.on(event as PlyrEvents, handler);
                }
            }

            if (autoplay) Promise.resolve(this.player.play()).catch();
        }

        public componentWillUnmount() {
            if (this.player) this.player.destroy();
        }

        public renderSource(): Array<React.ReactElement<any>> {
            // currently plyr breaks when not supplying a video type, this defaulting to video/mp4
            return this.props.sources.map((source, index) => (
                <source
                    key={index}
                    src={source.url}
                    type={source.type || "video/mp4"}
                />
            ));
        }

        public render() {
            const {classes} = this.props;

            return (
                <div className={classes.plyrContainer}>
                    <video poster={this.props.poster} playsInline={true} controls={true}>
                        {this.renderSource()}
                    </video>
                </div>
            );
        }
    },
);
