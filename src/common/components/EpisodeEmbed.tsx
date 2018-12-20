import CircularProgress from "@material-ui/core/CircularProgress";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {CSSProperties, WithStyles} from "@material-ui/core/styles/withStyles";
import Toolbar from "@material-ui/core/Toolbar";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import MoodBadIcon from "@material-ui/icons/MoodBad";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
import "plyr/src/sass/plyr.scss";
import * as React from "react";
import EpisodePage from "../pages/episode";
import Player, {PlayerProps, PlayerSource} from "./Player";
import _ = chrome.i18n.getMessage;

export interface SkipButton {
    href?: string;
    onClick?: (e?: React.MouseEvent<HTMLElement>) => any;
}

const styles = (theme: Theme) => {
    const flexCenterColumn: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-evenly"
    };

    return createStyles({
        root: {
            marginTop: 3 * theme.spacing.unit
        },
        playerContainer: {
            position: "relative",
            width: "100%",
            paddingBottom: `${100 * 9 / 16}%`,
        },
        embedIFrame: {
            width: "100%",
            height: "100%",
            border: "none",
        },
        flexCenterColumn,
        player: {
            position: "absolute",
            width: "100%",
            height: "100%",
            ...flexCenterColumn,
        },
        playerBar: {
            marginTop: theme.spacing.unit,
        }
    })
};

interface EpisodeEmbedProps extends WithStyles<typeof styles> {
    episodePage: EpisodePage;
}

interface EpisodeEmbedState {
    noEpisode?: boolean;
    playerProps?: PlayerProps;
    episodeEmbed?: string;
    skipButtons?: [SkipButton, SkipButton];
}

export default withStyles(styles)(class EpisodeEmbed extends React.Component<EpisodeEmbedProps, EpisodeEmbedState> {
    constructor(props: EpisodeEmbedProps) {
        super(props);
        this.state = {};
    }

    async componentDidMount() {
        const {episodePage} = this.props;

        const [config, epIndex, episode] = await Promise.all([
            episodePage.state.config,
            episodePage.getEpisodeIndex(),
            episodePage.getEpisode()
        ]);

        if (!episode) {
            this.setState({noEpisode: true});
            return;
        }

        if (episode.stream && episode.stream.links) {
            const sources: PlayerSource[] = episode.stream.links.map(link => {
                return {url: link};
            });

            this.setState({
                playerProps: {
                    sources,
                    poster: episode.poster,
                    options: {
                        title: _("player__video_title_format", [episode.anime.title, epIndex + 1]),
                        autoplay: config.autoplay
                    },
                    eventListener: {"ended": () => episodePage.onEpisodeEnd()}
                }
            });
        } else {
            this.setState({episodeEmbed: episode.embed});
        }

        const loadSkipButtons = (async () => {
            let prevEpPromise = epIndex > 0 ? episodePage.prevEpisodeButton() : Promise.resolve(null);
            let nextEpPromise = epIndex < episode.anime.episodes - 1 ? episodePage.nextEpisodeButton() : Promise.resolve(null);

            const skipButtons = await Promise.all([prevEpPromise, nextEpPromise]) as [SkipButton, SkipButton];

            this.setState({skipButtons});
        })();

        await Promise.all([loadSkipButtons]);
    }

    renderPlayer(): React.ReactElement<any> {
        const {classes} = this.props;
        const {episodeEmbed, noEpisode, playerProps} = this.state;

        if (noEpisode === true) {
            return (
                <div className={classes.flexCenterColumn}>
                    <MoodBadIcon fontSize="large" color="primary"/>
                    <Typography variant="h4" color="textPrimary">{_("episode__error")}</Typography>
                </div>
            );
        } else if (playerProps) {
            return (<Player {...playerProps as PlayerProps}/>);
        } else if (episodeEmbed) {
            return (
                <>
                    <Toolbar>
                        <Tooltip title={_("episode__embedded_stream")} placement="bottom">
                        <span>
                            <Typography variant="h6" color="textSecondary" style={{display: "inline"}}>Embedded Stream </Typography>
                            <HelpOutlineIcon fontSize="small" color="secondary"/>
                        </span>
                        </Tooltip>
                    </Toolbar>
                    <iframe src={episodeEmbed} className={classes.embedIFrame} allowFullScreen/>
                </>
            );
        } else {
            return (<CircularProgress/>);
        }
    }

    renderSkipButtons() {
        const {skipButtons} = this.state;
        const [skipPrev, skipNext] = skipButtons || [null, null];

        return (
            <>
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
            </>
        );
    }

    render() {
        const {classes} = this.props;

        return (
            <div className={classes.root}>
                <Paper className={classes.playerContainer}>
                    <div className={classes.player}>
                        {this.renderPlayer()}
                    </div>
                </Paper>
                <Paper className={classes.playerBar}>
                    {this.renderSkipButtons()}
                </Paper>
            </div>
        );
    }
});