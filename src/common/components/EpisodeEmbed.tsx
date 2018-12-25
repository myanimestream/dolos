import CircularProgress from "@material-ui/core/CircularProgress";
import FormControl from "@material-ui/core/FormControl";
import IconButton from "@material-ui/core/IconButton";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
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
        embedToolbar: {
            width: "100%",
            justifyContent: "space-between",
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

interface EmbedInfo {
    name: string,
    url: string,
}

const KNOWN_EMBEDS = {
    "mp4upload.com": "Mp4Upload",
    "stream.moe": "StreamMoe",
};

interface EpisodeEmbedState {
    noEpisode?: boolean;
    playerProps?: PlayerProps;
    episodeEmbeds?: EmbedInfo[];
    skipButtons?: [SkipButton, SkipButton];

    currentEmbedSelected: number;
    embedSelectionOpen: boolean;
}

export default withStyles(styles)(class EpisodeEmbed extends React.Component<EpisodeEmbedProps, EpisodeEmbedState> {
    constructor(props: EpisodeEmbedProps) {
        super(props);
        this.state = {
            currentEmbedSelected: 0,
            embedSelectionOpen: false,
        };
    }

    getEmbedInfos(urls: string[]): EmbedInfo[] {
        const embeds: EmbedInfo[] = [];
        const embedUrls = urls.filter(url => url.startsWith("https://")).sort().map(url => new URL(url));
        const nameCounter = {};

        for (const url of embedUrls) {
            let name = KNOWN_EMBEDS[url.host] || url.host.replace(/\.\w+$/, "");
            const count = (nameCounter[name] || 0) + 1;
            nameCounter[name] = count;

            embeds.push({
                name: `${name} ${count}`,
                url: url.href,
            });
        }

        return embeds;
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
            this.setState({episodeEmbeds: this.getEmbedInfos(episode.embeds)});
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
        const {
            currentEmbedSelected, embedSelectionOpen, episodeEmbeds,
            noEpisode, playerProps
        } = this.state;

        if (noEpisode === true) {
            return (
                <div className={classes.flexCenterColumn}>
                    <MoodBadIcon fontSize="large" color="primary"/>
                    <Typography variant="h4" color="textPrimary">{_("episode__error")}</Typography>
                </div>
            );
        } else if (playerProps) {
            return (<Player {...playerProps as PlayerProps}/>);
        } else if (episodeEmbeds) {
            return (
                <>
                    <Toolbar className={classes.embedToolbar}>
                        <Tooltip title={_("episode__embedded_stream")} placement="bottom">
                        <span>
                            <Typography variant="h6" color="textSecondary" style={{display: "inline"}}>Embedded Stream </Typography>
                            <HelpOutlineIcon fontSize="small" color="secondary"/>
                        </span>
                        </Tooltip>

                        <FormControl>
                            <InputLabel htmlFor="embed-selection-control">{_("episode__switch_embed")}</InputLabel>
                            <Select
                                open={embedSelectionOpen}
                                onOpen={() => this.setState({embedSelectionOpen: true})}
                                onClose={() => this.setState({embedSelectionOpen: false})}
                                value={currentEmbedSelected}
                                onChange={event => this.setState({currentEmbedSelected: parseInt(event.target.value)})}
                                inputProps={{
                                    name: _("episode__switch_embed"),
                                    id: "embed-selection-control"
                                }}
                            >
                                {episodeEmbeds.map((embed, index) => (
                                    <MenuItem value={index} key={embed.url}>{embed.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Toolbar>

                    <iframe src={episodeEmbeds[currentEmbedSelected].url} className={classes.embedIFrame} allowFullScreen/>
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