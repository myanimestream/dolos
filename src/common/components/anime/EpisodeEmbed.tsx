/**
 * @module common.components.anime
 */

import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {CSSProperties, WithStyles} from "@material-ui/core/styles/withStyles";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import BookmarkIcon from "@material-ui/icons/Bookmark";
import BookmarkBorderIcon from "@material-ui/icons/BookmarkBorder";
import MoodBadIcon from "@material-ui/icons/MoodBad";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
import SwitchVideoIcon from "@material-ui/icons/SwitchVideo";
import {AnimeInfo} from "dolos/grobber";
import "plyr/src/sass/plyr.scss";
import * as React from "react";
import * as rxjs from "rxjs";
import {EpisodePage} from "../../pages";
import embedProviders from "../embed-providers";
import EmbedPlayer, {EmbedInfo} from "../EmbedPlayer";
import Player, {PlayerProps, PlayerSource} from "../Player";
import SnackbarQueue from "../SnackbarQueue";
import WithRatio from "../WithRatio";
import AnimeSearchResultDialog from "./AnimeSearchResultDialog";
import _ = chrome.i18n.getMessage;

export interface SkipButton {
    href?: string;
    onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
}

/** @ignore */
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
    failReason?: "episode_unavailable" | "no_streams"
    currentPlayer?: PlayerType;
    playerProps?: Partial<PlayerProps>;
    episodeEmbeds?: EmbedInfo[];

    skipButtons?: [SkipButton, SkipButton];
    canSetProgress: boolean;
    bookmarked: boolean;

    menuAnchorElement?: HTMLElement;
    searchDialogOpen: boolean;
}

export default withStyles(styles)(class EpisodeEmbed extends React.Component<EpisodeEmbedProps, EpisodeEmbedState> {
    episodeBookmarkedSubscription?: rxjs.Subscription;

    constructor(props: EpisodeEmbedProps) {
        super(props);
        this.state = {
            playersAvailable: [],
            canSetProgress: false,
            bookmarked: false,
            searchDialogOpen: false,
        };
    }

    static getPlayerTypeName(type: PlayerType): string | null {
        switch (type) {
            case PlayerType.DOLOS:
                return _("episode__player_type_name__dolos");
            case PlayerType.EMBED:
                return _("episode__player_type_name__embed");
        }

        return null;
    }

    getNextPlayerType(): PlayerType {
        switch (this.state.currentPlayer) {
            case PlayerType.DOLOS:
                return PlayerType.EMBED;
            case PlayerType.EMBED:
                return PlayerType.DOLOS;
            default:
                throw new Error(`Unhandled player type: ${this.state.currentPlayer} cannot switch!`);
        }
    }

    switchPlayerType() {
        const nextPlayerType = this.getNextPlayerType();
        this.setState({currentPlayer: nextPlayerType});
    }

    getEmbedInfos(urls: string[]): EmbedInfo[] {
        const embeds: EmbedInfo[] = [];
        let embedRawURLs = urls.filter(url => url.startsWith("https://"));
        if (embedRawURLs.length < 3) {
            // maybe they support https anyway, who knows?
            embedRawURLs = urls;
        }

        const embedURLs = embedRawURLs.sort().map(rawUrl => {
            const url = new URL(rawUrl);
            url.protocol = "https:";
            return url;
        });

        const nameCounter = {};
        for (const url of embedURLs) {
            let providerInfo = embedProviders[url.hostname] || {};

            let name = providerInfo.name || url.hostname.replace(/(^www\.)|(\.\w+$)/, "");
            let icon = providerInfo.icon || new URL("/favicon.ico", url).href;

            // @ts-ignore
            const count = nameCounter[name] = (nameCounter[name] || 0) + 1;

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

        const canSetProgress = await episodePage.animePage.canSetEpisodesWatched();
        this.setState({canSetProgress});

        const [config, epIndex, episode] = await Promise.all([
            episodePage.state.config,
            episodePage.getEpisodeIndex(),
            episodePage.getEpisode()
        ]);

        if (!episode) {
            this.setState({currentPlayer: PlayerType.NONE, failReason: "episode_unavailable"});
            return;
        }

        const updateState: Partial<EpisodeEmbedState> = {
            playersAvailable: [],
        };

        if (episode.embeds.length > 0) {
            const embedInfos = this.getEmbedInfos(episode.embeds);
            if (embedInfos.length > 0) {
                updateState.currentPlayer = PlayerType.EMBED;
                // @ts-ignore
                updateState.playersAvailable.push(PlayerType.EMBED);
                updateState.episodeEmbeds = embedInfos;
            }
        }

        if (episode.stream && episode.stream.links.length > 0) {
            const sources: PlayerSource[] = episode.stream.links.map(link => {
                return {url: link};
            });

            updateState.currentPlayer = PlayerType.DOLOS;
            // @ts-ignore
            updateState.playersAvailable.push(PlayerType.DOLOS);
            updateState.playerProps = {
                sources,
                poster: episode.poster,
                options: {
                    title: _("player__video_title_format", [
                        episode.anime.title,
                        epIndex !== undefined ? epIndex + 1 : "?"
                    ]),
                    autoplay: config.autoplay
                },
                eventListener: {"ended": () => episodePage.onEpisodeEnd()}
            };
        }

        if (updateState.currentPlayer === PlayerType.NONE)
            updateState.failReason = "no_streams";

        this.setState(updateState as EpisodeEmbedState);


        const loadSkipButtons = (async () => {
            if (epIndex === undefined) return;

            const prevEpPromise = epIndex > 0 ? episodePage.prevEpisodeButton() : Promise.resolve(null);
            const nextEpPromise = epIndex < episode.anime.episodes - 1 ? episodePage.nextEpisodeButton() : Promise.resolve(null);

            const skipButtons = await Promise.all([prevEpPromise, nextEpPromise]) as [SkipButton, SkipButton];

            this.setState({skipButtons});
        })();

        await Promise.all([loadSkipButtons]);
    }

    renderPlayer(): React.ReactElement<any> {
        const {classes} = this.props;
        const {
            currentPlayer,
            failReason,
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
                        // @ts-ignore
                        <EmbedPlayer embeds={episodeEmbeds}/>
                    );
                case PlayerType.NONE:
                    const msgName = failReason ? `episode__error__${failReason}` : "episode__error__general";

                    return (
                        <WithRatio ratio={16 / 9}>
                            <div className={classes.flexCenterColumn}>
                                <MoodBadIcon fontSize="large" color="primary"/>
                                <Typography variant="h4" color="textPrimary">{_(msgName)}</Typography>
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
        const [skipPrev, skipNext] = skipButtons || [undefined, undefined];

        return (
            <span>
                <Tooltip title={_("episode__skip_previous")}>
                        <span>
                        <IconButton color="primary" aria-label={_("episode__skip_previous")} disabled={!skipPrev}
                                    href={skipPrev && skipPrev.href}
                                    onClick={skipPrev && skipPrev.onClick && ((e) => {
                                        e.preventDefault();
                                        // @ts-ignore
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
                                        // @ts-ignore
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

    renderSwitchPlayerTypeButton() {
        const {classes} = this.props;
        const {playersAvailable} = this.state;

        if (playersAvailable.length > 1) {
            return (
                <Tooltip title={_("episode__switch_player_type")}>
                    <Button type="contained" color="primary" onClick={() => this.switchPlayerType()}>
                        {EpisodeEmbed.getPlayerTypeName(this.getNextPlayerType())}
                        <SwitchVideoIcon className={classes.buttonIconRight}/>
                    </Button>
                </Tooltip>
            );
        }

        return;
    }

    async handleSearchDialogClose(anime?: AnimeInfo) {
        // close dialog AND the menu because it's served its purpose
        this.setState({searchDialogOpen: false, menuAnchorElement: undefined});
        if (!anime) return;

        const {episodePage} = this.props;
        await episodePage.setAnimeUID(anime.uid);
    }


    renderMenuButton() {
        const {episodePage} = this.props;
        const {menuAnchorElement, searchDialogOpen} = this.state;

        return (
            <div>
                <IconButton
                    aria-label="More"
                    aria-owns={open ? "episode-embed-menu" : undefined}
                    aria-haspopup="true"
                    color="primary"
                    onClick={(event: React.MouseEvent<HTMLElement>) => this.setState({menuAnchorElement: event.currentTarget})}
                >
                    <MoreVertIcon/>
                </IconButton>
                <Menu
                    id="episode-embed-menu"
                    anchorEl={menuAnchorElement}
                    open={!!menuAnchorElement}
                    onClose={() => this.setState({menuAnchorElement: undefined})}
                >
                    <MenuItem onClick={() => this.setState({searchDialogOpen: true})}>
                        {_("episode__menu__search_anime")}
                    </MenuItem>
                </Menu>

                <AnimeSearchResultDialog
                    open={searchDialogOpen}
                    onClose={(anime) => this.handleSearchDialogClose(anime)}
                    animePage={episodePage.animePage}
                />
            </div>
        );
    }

    render() {
        const {classes, episodePage} = this.props;

        return (
            <div className={classes.root}>
                {this.renderPlayer()}

                <Paper className={classes.playerBar}>
                    <span>
                        {this.renderSkipButtons()}
                        {this.renderBookmarkButton()}
                    </span>

                    <span style={{display: "flex"}}>
                        {this.renderSwitchPlayerTypeButton()}
                        {this.renderMenuButton()}
                    </span>
                </Paper>
                <SnackbarQueue snackbarMessage$={episodePage.snackbarMessage$}/>
            </div>
        );
    }
});