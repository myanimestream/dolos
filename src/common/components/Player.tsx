import {WithStyles} from "@material-ui/core/styles";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles from "@material-ui/core/styles/withStyles";
import Plyr from "plyr/src/js/plyr.js";
import "plyr/src/sass/plyr.scss";
import * as React from "react";
import * as ReactDOM from "react-dom";

const styles = () => createStyles({
    plyrContainer: {
        width: "100%",
        height: "100%",

        "& .plyr": {
            width: "100%",
            height: "100%",
        }
    }
});

export interface PlayerSource {
    url: string;
    type?: string;
}

export interface PlayerProps extends WithStyles<typeof styles> {
    options?: any;
    eventListener?: { [key: string]: (event: CustomEvent) => any };
    poster?: string;
    sources: PlayerSource[];
}

export default withStyles(styles)(class Player extends React.Component<PlayerProps> {
    player?: Plyr;

    componentDidMount() {
        const {eventListener, options} = this.props;
        // normal autoplay only works when muted and doesn't fire "ended" event!
        const autoplay = options.autoplay;
        options.autoplay = false;

        this.player = new Plyr(ReactDOM.findDOMNode(this).firstChild, options);

        if (eventListener) {
            for (const [event, handler] of Object.entries(eventListener)) {
                this.player.on(event, handler);
            }
        }

        if (autoplay) Promise.resolve(this.player.play()).catch();
    }

    componentWillUnmount() {
        if (this.player) this.player.destroy();
    }

    renderSource(): React.ReactElement<any>[] {
        // currently plyr breaks when not supplying a video type, this defaulting to video/mp4
        return this.props.sources.map((source, index) => <source key={index} src={source.url}
                                                                 type={source.type || "video/mp4"}/>);
    }

    render() {
        const {classes} = this.props;

        return (
            <div className={classes.plyrContainer}>
                <video poster={this.props.poster} playsInline controls>
                    {this.renderSource()}
                </video>
            </div>
        );
    }
});