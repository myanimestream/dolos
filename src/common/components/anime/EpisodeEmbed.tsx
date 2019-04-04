/**
 * @module common/components/anime
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
import {EmbedInfo, prepareEmbedInfos} from "dolos/common";
import {OpenDebugDialogButton} from "dolos/common/components";
import {EpisodePage} from "dolos/common/pages";
import {AnimeInfo} from "dolos/grobber";
import "plyr/src/sass/plyr.scss";
import * as React from "react";
import * as rxjs from "rxjs";
import {EmbedPlayer, Player, PlayerProps, PlayerSource, Toggle, WithRatio} from "..";
import _ = chrome.i18n.getMessage;

export interface SkipButton {
    href?: string;
    onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
}

/** @ignore */
const styles = (theme: Theme) => {
    const flexCenterColumn: CSSProperties = {
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-evenly",
    };

    return createStyles({
        buttonIconRight: {
            marginLeft: theme.spacing(1),
        },
        flexCenterColumn,
        playerBar: {
            display: "flex",
            justifyContent: "space-between",
            marginTop: theme.spacing(1),
        },
        root: {
            marginTop: theme.spacing(3),
        },
    });
};

function getPlayerTypeName(type: PlayerType): string | null {
    switch (type) {
        case PlayerType.DOLOS:
            return _("episode__player_type_name__dolos");
        case PlayerType.EMBED:
            return _("episode__player_type_name__embed");
    }

    return null;
}

export interface EpisodeEmbedProps extends WithStyles<typeof styles> {
    episodePage: EpisodePage<any>;
}

export enum PlayerType {
    NONE,
    DOLOS,
    EMBED,
}

interface EpisodeEmbedState {
    debugMode: boolean;

    playersAvailable: PlayerType[];
    failReason?: "episode_unavailable" | "no_streams";
    currentPlayer?: PlayerType;
    playerProps?: Partial<PlayerProps>;
    episodeEmbeds?: EmbedInfo[];

    skipButtons?: [SkipButton, SkipButton];
    canSetProgress: boolean;
    bookmarked: boolean;

    menuAnchorElement?: HTMLElement;
}

// tslint:disable-next-line:variable-name
export const EpisodeEmbed = withStyles(styles)(
    class extends React.Component<EpisodeEmbedProps, EpisodeEmbedState> {
        public episodeBookmarkedSubscription?: rxjs.Subscription;

        constructor(props: EpisodeEmbedProps) {
            super(props);
            this.state = {
                debugMode: false,

                bookmarked: false,
                canSetProgress: false,
                playersAvailable: [],
            };
        }

        public componentWillUnmount() {
            if (this.episodeBookmarkedSubscription) this.episodeBookmarkedSubscription.unsubscribe();
        }

        public async componentDidMount() {
            const {episodePage} = this.props;

            this.episodeBookmarkedSubscription = episodePage.episodeBookmarked$.subscribe({
                next: (episodeBookmarked) => this.setState({bookmarked: episodeBookmarked}),
            });

            const config = await episodePage.state.config;
            this.setState({debugMode: config.debugMode});

            const canSetProgress = await episodePage.animePage.canSetEpisodesWatched();
            this.setState({canSetProgress});

            const [epIndex, episode] = await Promise.all([
                episodePage.getEpisodeIndex(),
                episodePage.getEpisode(),
            ]);

            if (!episode) {
                this.setState({currentPlayer: PlayerType.NONE, failReason: "episode_unavailable"});
                return;
            }

            const updateState: Partial<EpisodeEmbedState> = {
                playersAvailable: [],
            };

            if (episode.embeds.length > 0) {
                const embedInfos = prepareEmbedInfos(episode.embeds, config.embedProviders);
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

                if (config.preferDolosPlayer)
                    updateState.currentPlayer = PlayerType.DOLOS;

                // @ts-ignore
                updateState.playersAvailable.push(PlayerType.DOLOS);
                updateState.playerProps = {
                    eventListener: {ended: () => episodePage.onEpisodeEnd()},
                    options: {
                        autoplay: config.autoplay,
                        title: _("player__video_title_format", [
                            episode.anime.title,
                            epIndex !== undefined ? epIndex + 1 : "?",
                        ]),
                    },
                    poster: episode.poster,
                    sources,
                };
            }

            if (updateState.currentPlayer === PlayerType.NONE)
                updateState.failReason = "no_streams";

            this.setState(updateState as EpisodeEmbedState);

            const loadSkipButtons = (async () => {
                if (epIndex === undefined) return;

                const prevEpPromise = epIndex > 0 ? episodePage.prevEpisodeButton() : Promise.resolve(null);
                const nextEpPromise = epIndex < episode.anime.episodes - 1
                    ? episodePage.nextEpisodeButton()
                    : Promise.resolve(null);

                const skipButtons = await Promise.all([prevEpPromise, nextEpPromise]) as [SkipButton, SkipButton];

                this.setState({skipButtons});
            })();

            await Promise.all([loadSkipButtons]);
        }

        public render() {
            const {classes} = this.props;

            return (
                <div className={classes.root}>
                    {this.renderPlayer()}

                    <Paper className={classes.playerBar}>
                        <div>
                            {this.renderSkipButtons()}
                            {this.renderBookmarkButton()}
                        </div>

                        <div style={{display: "flex"}}>
                            {this.renderSwitchPlayerTypeButton()}
                            {this.renderMenuButton()}

                            {this.renderOpenDebugDialogButton()}
                        </div>
                    </Paper>
                </div>
            );
        }

        private getNextPlayerType(): PlayerType {
            switch (this.state.currentPlayer) {
                case PlayerType.DOLOS:
                    return PlayerType.EMBED;
                case PlayerType.EMBED:
                    return PlayerType.DOLOS;
                default:
                    throw new Error(`Unhandled player type: ${this.state.currentPlayer} cannot switch!`);
            }
        }

        private switchPlayerType(): void {
            const nextPlayerType = this.getNextPlayerType();
            this.setState({currentPlayer: nextPlayerType});
        }

        private renderPlayer(): React.ReactElement<any> {
            const {classes} = this.props;
            const {
                currentPlayer,
                failReason,
                episodeEmbeds,
                playerProps,
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

        private renderSkipButtons() {
            const {skipButtons} = this.state;
            const [skipPrev, skipNext] = skipButtons || [undefined, undefined];

            let handleSkipPrevClick;
            if (skipPrev && skipPrev.onClick)
                handleSkipPrevClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    // @ts-ignore
                    skipPrev.onClick(e);
                };

            let handleSkipNextClick;
            if (skipNext && skipNext.onClick)
                handleSkipNextClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    // @ts-ignore
                    skipNext.onClick(e);
                };

            return (
                <span>
                <Tooltip title={_("episode__skip_previous")}>
                        <span>
                        <IconButton
                            color="primary"
                            aria-label={_("episode__skip_previous")}
                            disabled={!skipPrev}
                            href={skipPrev && skipPrev.href}
                            onClick={handleSkipPrevClick}
                        >
                            <SkipPreviousIcon/>
                        </IconButton>
                        </span>
                </Tooltip>
                <Tooltip title={_("episode__skip_next")}>
                        <span>
                        <IconButton
                            color="primary"
                            aria-label={_("episode__skip_next")}
                            disabled={!skipNext}
                            href={skipNext && skipNext.href}
                            onClick={handleSkipNextClick}
                        >
                            <SkipNextIcon/>
                        </IconButton>
                        </span>
                </Tooltip>
            </span>
            );
        }

        private async toggleBookmark() {
            const {episodePage} = this.props;
            const {bookmarked} = this.state;
            if (bookmarked) await episodePage.markEpisodeUnwatched();
            else await episodePage.markEpisodeWatched();
        }

        private renderBookmarkButton() {
            const {bookmarked, canSetProgress} = this.state;

            const handleToggle = () => this.toggleBookmark();

            return (
                <Toggle
                    tooltip={_("episode__bookmark_unseen")}
                    tooltipToggled={_("episode__bookmark_seen")}

                    icon={<BookmarkBorderIcon/>}
                    iconToggled={<BookmarkIcon/>}

                    toggled={bookmarked}
                    canToggle={canSetProgress}
                    onToggle={handleToggle}
                />
            );
        }

        private renderSwitchPlayerTypeButton() {
            const {classes} = this.props;
            const {playersAvailable} = this.state;

            if (playersAvailable.length > 1) {
                const handleClick = this.switchPlayerType.bind(this);

                return (
                    <Tooltip title={_("episode__switch_player_type")}>
                        <Button color="primary" onClick={handleClick}>
                            {getPlayerTypeName(this.getNextPlayerType())}
                            <SwitchVideoIcon className={classes.buttonIconRight}/>
                        </Button>
                    </Tooltip>
                );
            }

            return undefined;
        }

        private async handleSearchDialogClose(anime?: AnimeInfo) {
            // close the menu because it's served its purpose
            this.setState({menuAnchorElement: undefined});

            if (!anime) return;

            const {episodePage} = this.props;

            await episodePage.animePage.setAnimeUID(anime);
        }

        private renderMenuButton() {
            const {episodePage} = this.props;
            const {menuAnchorElement} = this.state;

            const handleSearchAnimeClick = async () => {
                await episodePage.animePage.openAnimeSearchDialog(
                    this.handleSearchDialogClose.bind(this));
            };

            const onMenuClick = (event: React.MouseEvent<HTMLElement>) =>
                this.setState({menuAnchorElement: event.currentTarget});
            const onMenuClose = () => this.setState({menuAnchorElement: undefined});

            return (
                <div>
                    <IconButton
                        aria-label="More"
                        aria-owns={open ? "episode-embed-menu" : undefined}
                        aria-haspopup="true"
                        color="primary"
                        onClick={onMenuClick}
                    >
                        <MoreVertIcon/>
                    </IconButton>
                    <Menu
                        id="episode-embed-menu"
                        anchorEl={menuAnchorElement}
                        open={!!menuAnchorElement}
                        onClose={onMenuClose}
                    >
                        <MenuItem onClick={handleSearchAnimeClick}>
                            {_("episode__menu__search_anime")}
                        </MenuItem>
                    </Menu>
                </div>
            );
        }

        private renderOpenDebugDialogButton() {
            const {debugMode} = this.state;

            if (!debugMode) return undefined;

            const {episodePage} = this.props;
            return (<OpenDebugDialogButton service={episodePage.service}/>);
        }
    },
);
