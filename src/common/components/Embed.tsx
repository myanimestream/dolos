import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import Tooltip from "@material-ui/core/Tooltip";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
import "plyr/src/sass/plyr.scss";
import * as React from "react";
import Player, {PlayerProps} from "./Player";
import _ = chrome.i18n.getMessage;

export interface SkipButton {
    href?: string;
    onClick?: (e?: React.MouseEvent<HTMLElement>) => any;
}

interface EmbedProps extends PlayerProps {
    skipNext?: SkipButton;
    skipPrev?: SkipButton;
}

export default class Embed extends React.Component<EmbedProps> {
    render() {
        const {skipPrev, skipNext, sources} = this.props;

        return (
            <>
                <Player sources={sources}/>
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