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
import SwitchVideoIcon from "@material-ui/icons/SwitchVideo";
import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
import "plyr/src/sass/plyr.scss";
import * as React from "react";
import EpisodePage from "../pages/episode";
import Player, {PlayerProps, PlayerSource} from "./Player";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";
import embedProviders from "./embed-providers";
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
            marginTop: 3 * theme.spacing.unit,
        },
        buttonIconRight: {
            marginLeft: theme.spacing.unit,
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
            marginBottom: theme.spacing.unit,
            justifyContent: "space-between",
            flexWrap: "wrap",
        },
        embedSelect: {
            "& $embedInfoAvatar": {
                display: "none",
            },
            "& $embedInfoText": {
                padding: 0,
            }
        },
        embedInfoAvatar: {
            width: 2 * theme.spacing.unit,
            height: 2 * theme.spacing.unit,
            borderRadius: 0,
        },
        embedInfoText: {},
        flexCenterColumn,
        player: {
            position: "absolute",
            width: "100%",
            height: "100%",
            ...flexCenterColumn,
        },
        playerBar: {
            marginTop: theme.spacing.unit,
            display: "flex",
            justifyContent: "space-between",
        }
    })
};

interface EpisodeEmbedProps extends WithStyles<typeof styles> {
    episodePage: EpisodePage;
}

interface EmbedInfo {
    name: string,
    icon?: string,
    url: string,
}

enum PlayerType {
    NONE,
    DOLOS,
    EMBED
}

interface EpisodeEmbedState {
    playersAvailable: PlayerType[];
    currentPlayer?: PlayerType;
    playerProps?: Partial<PlayerProps>;
    episodeEmbeds?: EmbedInfo[];

    skipButtons?: [SkipButton, SkipButton];

    currentEmbedSelected: number;
    embedSelectionOpen: boolean;
}

export default withStyles(styles)(class EpisodeEmbed extends React.Component<EpisodeEmbedProps, EpisodeEmbedState> {
    constructor(props: EpisodeEmbedProps) {
        super(props);
        this.state = {
            currentPlayer: null,
            playersAvailable: [],
            currentEmbedSelected: 0,
            embedSelectionOpen: false,
        };
    }

    static getPlayerTypeName(type: PlayerType): string | null {
        switch (type) {
            case PlayerType.DOLOS:
                return _("episode__player_type_name__dolos");
            case PlayerType.EMBED:
                return _("episode__player_type_name__embed");
        }
    }

    getNextPlayerType(): PlayerType {
        switch (this.state.currentPlayer) {
            case PlayerType.DOLOS:
                return PlayerType.EMBED;
            case PlayerType.EMBED:
                return PlayerType.DOLOS;
            default:
                throw new Error(`Unhandled playertype: ${this.state.currentPlayer} cannot switch!`);
        }
    }

    switchPlayerType() {
        this.setState({currentPlayer: this.getNextPlayerType()});
    }

    getEmbedInfos(urls: string[]): EmbedInfo[] {
        const embeds: EmbedInfo[] = [];
        const embedUrls = urls.filter(url => url.startsWith("https://")).sort().map(url => new URL(url));
        const nameCounter = {};

        for (const url of embedUrls) {
            let providerInfo = embedProviders[url.host] || {};

            let name = providerInfo.name || url.host.replace(/(^www\.)|(\.\w+$)/, "");
            let icon = providerInfo.icon || new URL("/favicon.ico", url).href;

            const count = (nameCounter[name] || 0) + 1;
            nameCounter[name] = count;

            embeds.push({
                name: `${name} ${count}`,
                icon,
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
            this.setState({currentPlayer: PlayerType.NONE});
            return;
        }

        const updateState = {
            playerProps: null,
            episodeEmbeds: this.getEmbedInfos(episode.embeds),
            playersAvailable: [PlayerType.EMBED],
            currentPlayer: PlayerType.EMBED
        };

        if (episode.stream && episode.stream.links) {
            const sources: PlayerSource[] = episode.stream.links.map(link => {
                return {url: link};
            });

            updateState.currentPlayer = PlayerType.DOLOS;
            updateState.playersAvailable.push(PlayerType.DOLOS);
            updateState.playerProps = {
                sources,
                poster: episode.poster,
                options: {
                    title: _("player__video_title_format", [episode.anime.title, epIndex + 1]),
                    autoplay: config.autoplay
                },
                eventListener: {"ended": () => episodePage.onEpisodeEnd()}
            };
        }

        this.setState(updateState);


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
            currentPlayer,
            currentEmbedSelected, embedSelectionOpen, episodeEmbeds,
            playerProps
        } = this.state;

        const WithRatio = props => (
            <Paper className={classes.playerContainer}>
                <div className={classes.player}>
                    {props.children}
                </div>
            </Paper>
        );

        if (currentPlayer === PlayerType.NONE) {
            return (
                <WithRatio>
                    <div className={classes.flexCenterColumn}>
                        <MoodBadIcon fontSize="large" color="primary"/>
                        <Typography variant="h4" color="textPrimary">{_("episode__error")}</Typography>
                    </div>
                </WithRatio>
            );
        } else if (currentPlayer === PlayerType.DOLOS) {
            return (
                <WithRatio>
                    <Player {...playerProps as PlayerProps}/>
                </WithRatio>
            );
        } else if (currentPlayer === PlayerType.EMBED) {
            return (
                <>
                    <Paper>
                        <Toolbar className={classes.embedToolbar}>
                            <Tooltip title={_("episode__embedded_stream__warning")} placement="bottom">
                                <span>
                                    <Typography variant="h6" color="textSecondary"
                                                style={{display: "inline"}}
                                                noWrap
                                    >
                                        {_("episode__embedded_stream")}&nbsp;
                                        <HelpOutlineIcon fontSize="small" color="secondary"/>
                                    </Typography>
                                </span>
                            </Tooltip>

                            <FormControl>
                                <InputLabel htmlFor="embed-selection-control">{_("episode__switch_embed")}</InputLabel>
                                <Select
                                    className={classes.embedSelect}
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
                                        <MenuItem value={index} key={embed.url}>
                                            {embed.icon &&
                                            <ListItemAvatar>
                                                <Avatar src={embed.icon} className={classes.embedInfoAvatar}
                                                        onError={event => (event.target as Element).remove()}/>
                                            </ListItemAvatar>
                                            }
                                            <ListItemText className={classes.embedInfoText}>{embed.name}</ListItemText>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Toolbar>
                    </Paper>

                    <WithRatio>
                        <iframe src={episodeEmbeds[currentEmbedSelected].url} className={classes.embedIFrame}
                                allowFullScreen/>
                    </WithRatio>
                </>
            );
        } else {
            return (<WithRatio><CircularProgress/></WithRatio>);
        }
    }

    renderSkipButtons() {
        const {skipButtons} = this.state;
        const [skipPrev, skipNext] = skipButtons || [null, null];

        return (
            <span>
                <Tooltip title={_("episode__skip_previous")}>
                        <span>
                        <IconButton color="primary" aria-label={_("episode__skip_previous")} disabled={!skipPrev}
                                    href={skipPrev && skipPrev.href}
                                    onClick={skipPrev && skipPrev.onClick && ((e) => {
                                        e.preventDefault();
                                        skipPrev.onClick(e);
                                    })}>
                            <SkipPreviousIcon/>
                        </IconButton>
                        </span>
                </Tooltip>
                <Tooltip title={_("episode__skip_next")}>
                        <span>
                        <IconButton color="primary" aria-label={_("episode__skip_next")} disabled={!skipNext}
                                    href={skipNext && skipNext.href}
                                    onClick={skipNext && skipNext.onClick && ((e) => {
                                        e.preventDefault();
                                        skipNext.onClick(e);
                                    })}>
                            <SkipNextIcon/>
                        </IconButton>
                        </span>
                </Tooltip>
            </span>
        );
    }

    render() {
        const {classes} = this.props;
        const {playersAvailable} = this.state;

        return (
            <div className={classes.root}>
                {this.renderPlayer()}

                <Paper className={classes.playerBar}>
                    {this.renderSkipButtons()}

                    {playersAvailable.length > 1 &&
                    <Tooltip title={_("episode__switch_player_type")}>
                        <Button type="contained" color="primary" onClick={() => this.switchPlayerType()}>
                            {EpisodeEmbed.getPlayerTypeName(this.getNextPlayerType())}
                            <SwitchVideoIcon className={classes.buttonIconRight}/>
                        </Button>
                    </Tooltip>
                    }
                </Paper>
            </div>
        );
    }
});