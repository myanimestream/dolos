import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import Tooltip from "@material-ui/core/Tooltip";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
import Plyr from "plyr/src/js/plyr.js";
import "plyr/src/sass/plyr.scss";
import * as React from "react";
import * as ReactDOM from "react-dom";

const _ = chrome.i18n.getMessage;

export interface SkipButton {
    href?: string;
    onClick?: (e?: React.MouseEvent<HTMLElement>) => any;
}

export interface PlayerSource {
    url: string;
    type?: string;
}

interface PlayerProps {
    options?: Object;
    poster?: string;
    sources: PlayerSource[];

    skipNext?: SkipButton;
    skipPrev?: SkipButton;
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
        const {skipPrev, skipNext} = this.props;

        return (
            <>
                <video poster={this.props.poster} playsInline controls>
                    {this.renderSource()}
                </video>
                <Paper>
                    <Tooltip title={_("player__skip_previous")}>
                        <span>
                        <IconButton color="primary" aria-label={_("player__skip_previous")} disabled={!skipPrev} href={skipPrev && skipPrev.href}
                                    onClick={skipPrev && skipPrev.onClick && ((e) => {
                                        e.preventDefault();
                                        skipPrev.onClick(e);
                                    })}>
                            <SkipPreviousIcon/>
                        </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={_("player__skip_next")}>
                        <span>
                        <IconButton color="primary" aria-label={_("player__skip_next")} disabled={!skipNext} href={skipNext && skipNext.href}
                                    onClick={skipNext && skipNext.onClick && ((e) => {
                                        e.preventDefault();
                                        skipNext.onClick(e);
                                    })}>
                            <SkipNextIcon/>
                        </IconButton>
                        </span>
                    </Tooltip>
                </Paper>
            </>
        );
    }
}