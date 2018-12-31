import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {CSSProperties, WithStyles} from "@material-ui/core/styles/withStyles";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import BookmarkIcon from "@material-ui/icons/Bookmark";
import BookmarkBorderIcon from "@material-ui/icons/BookmarkBorder";
import MoodBadIcon from "@material-ui/icons/MoodBad";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
import SwitchVideoIcon from "@material-ui/icons/SwitchVideo";
import "plyr/src/sass/plyr.scss";
import * as React from "react";
import * as rxjs from "rxjs";
import EpisodePage from "../pages/episode";
import embedProviders from "./embed-providers";
import EmbedPlayer, {EmbedInfo} from "./EmbedPlayer";
import Player, {PlayerProps, PlayerSource} from "./Player";
import WithRatio from "./WithRatio";
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
        flexCenterColumn,
        playerBar: {
            marginTop: theme.spacing.unit,
            display: "flex",
            justifyContent: "space-between",
        }
    })
};

interface EpisodeEmbedProps extends WithStyles<typeof styles> {
    episodePage: EpisodePage<any>;
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
    canSetProgress: boolean;
    bookmarked: boolean;
}

export default withStyles(styles)(class EpisodeEmbed extends React.Component<EpisodeEmbedProps, EpisodeEmbedState> {
    episodeBookmarkedSubscription?: rxjs.Subscription;

    constructor(props: EpisodeEmbedProps) {
        super(props);
        this.state = {
            currentPlayer: null,
            playersAvailable: [],
            canSetProgress: false,
            bookmarked: false,
        };

        this.episodeBookmarkedSubscription = null;
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

    componentWillUnmount() {
        if (this.episodeBookmarkedSubscription) this.episodeBookmarkedSubscription.unsubscribe();
    }

    async componentDidMount() {
        const {episodePage} = this.props;


        this.episodeBookmarkedSubscription = episodePage.episodeBookmarked$.subscribe({
            next: (episodeBookmarked) => this.setState({bookmarked: episodeBookmarked})
        });

        const canSetProgress = await episodePage.canSetAnimeProgress();
        this.setState({canSetProgress});

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
            episodeEmbeds,
            playerProps
        } = this.state;

        const view = () => {
            switch (currentPlayer) {
                case PlayerType.DOLOS:
                    return (
                        <Player {...playerProps as PlayerProps}/>
                    );
                case PlayerType.EMBED:
                    return (
                        <EmbedPlayer embeds={episodeEmbeds}/>
                    );
                case PlayerType.NONE:
                    return (
                        <WithRatio ratio={16 / 9}>
                            <div className={classes.flexCenterColumn}>
                                <MoodBadIcon fontSize="large" color="primary"/>
                                <Typography variant="h4" color="textPrimary">{_("episode__error")}</Typography>
                            </div>
                        </WithRatio>
                    );

                default:
                    return (
                        <WithRatio ratio={16 / 9}><CircularProgress/></WithRatio>
                    );
            }
        };

        return view();
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

    async toggleBookmark() {
        const {episodePage} = this.props;
        const {bookmarked} = this.state;

        if (bookmarked) await episodePage.markEpisodeUnwatched();
        else await episodePage.markEpisodeWatched();
    }

    renderBookmarkButton() {
        const {bookmarked, canSetProgress} = this.state;

        return (
            <Tooltip title={_(`episode__bookmark_${bookmarked ? "seen" : "unseen"}`)}>
                <span>
                    <IconButton onClick={() => this.toggleBookmark()} color="primary" disabled={!canSetProgress}>
                        {bookmarked ? <BookmarkIcon/> : <BookmarkBorderIcon/>}
                    </IconButton>
                </span>
            </Tooltip>
        );
    }

    render() {
        const {classes} = this.props;
        const {playersAvailable} = this.state;

        return (
            <div className={classes.root}>
                {this.renderPlayer()}

                <Paper className={classes.playerBar}>
                    <span>
                        {this.renderSkipButtons()}
                        {this.renderBookmarkButton()}
                    </span>

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