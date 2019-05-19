/**
 * @module components/anime/episode-embed
 */

/** @ignore */

import CircularProgress from "@material-ui/core/CircularProgress";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import makeStyles from "@material-ui/styles/makeStyles";
import {EmbedInfo, prepareEmbedInfos} from "dolos/common";
import {EpisodePage} from "dolos/common/pages";
import {PlayerProps, PlayerSource, WithRatio} from "dolos/components";
import {Episode} from "dolos/grobber";
import {useSubscriptionMemo} from "dolos/hooks";
import {Config} from "dolos/models";
import * as React from "react";
import {combineLatest, defer} from "rxjs";
import {Toolbar} from "./Toolbar";
import {FailReason, PlayerType, Video} from "./Video";
import _ = chrome.i18n.getMessage;

/** @ignore */
const useStyles = makeStyles((theme: Theme) => ({
    root: {
        marginTop: theme.spacing(3),
    },
}));

/**
 * @see [[EpisodeEmbed]]
 */
export interface EmbedProps {
    episodePage: EpisodePage<any>;
}

/**
 * Episode embed.
 */
export function EpisodeEmbed({episodePage}: EmbedProps) {
    const classes = useStyles();

    const [playerType, setPlayerType] = React.useState(PlayerType.None);
    const [availablePlayerTypes, setAvailablePlayerTypes] = React.useState<PlayerType[]>([]);

    return (
        <div className={classes.root}>
            <VideoLoader
                episodePage={episodePage}
                playerType={playerType}
                setPlayerType={setPlayerType}
                setAvailablePlayerTypes={setAvailablePlayerTypes}
            />

            <Toolbar
                episodePage={episodePage}
                playerType={playerType}
                availablePlayerTypes={availablePlayerTypes}
                setPlayerType={setPlayerType}
            />
        </div>
    );
}

/**
 * @see [[VideoLoader]]
 */
export interface VideoLoaderProps {
    episodePage: EpisodePage<any>;
    playerType: PlayerType;
    setPlayerType: (type: PlayerType) => any;
    setAvailablePlayerTypes: (types: PlayerType[]) => any;
}

/**
 * Component that shows a loading animation while it loads the episode data
 * and then switches to the [[Video]].
 */
function VideoLoader({
                         episodePage,
                         playerType, setPlayerType,
                         setAvailablePlayerTypes,
                     }: VideoLoaderProps) {

    const [failReason, setFailReason] = React.useState<FailReason | undefined>(undefined);
    const [embeds, setEmbeds] = React.useState<EmbedInfo[] | undefined>(undefined);
    const [playerProps, setPlayerProps] = React.useState<PlayerProps | undefined>(undefined);

    const firstLoadComplete = Boolean(failReason || embeds || playerProps);

    const observer = React.useMemo(() => ({
        error: () => {
            // don't destroy our nice little player if we already got it
            if (!firstLoadComplete) {
                setFailReason("episode_unavailable");
                setPlayerType(PlayerType.None);
            }
        },
        next: ([episodeIndex, episode, config]: [number | undefined, Episode, Config]) => {
            const epEmbeds = episode.embeds;
            const epStream = episode.stream;

            if (epEmbeds.length === 0 && !(epStream && epStream.links.length > 0)) {
                setPlayerType(PlayerType.None);
                setFailReason("no_streams");
                return;
            }

            let nextPlayerType: PlayerType = PlayerType.None;
            const nextAvailablePlayerTypes: PlayerType[] = [];

            if (epEmbeds.length > 0) {
                const embedInfos = prepareEmbedInfos(epEmbeds, config.embedProviders);

                if (embedInfos.length > 0) {
                    setEmbeds(embedInfos);

                    nextPlayerType = PlayerType.Embed;
                    nextAvailablePlayerTypes.push(PlayerType.Embed);
                }
            }

            if (epStream && epStream.links.length > 0) {
                const sources: PlayerSource[] = epStream.links.map(link => {
                    return {url: link};
                });

                setPlayerProps({
                    eventListener: {ended: () => episodePage.onEpisodeEnd()},
                    options: {
                        autoplay: config.autoplay,
                        title: _("player__video_title_format", [
                            episode.anime.title,
                            episodeIndex !== undefined ? episodeIndex + 1 : "?",
                        ]),
                    },
                    poster: episode.poster,
                    sources,
                });

                if (config.preferDolosPlayer || nextPlayerType === PlayerType.None) {
                    nextPlayerType = PlayerType.Dolos;
                }

                nextAvailablePlayerTypes.push(PlayerType.Dolos);
            }

            if (nextPlayerType === PlayerType.None) {
                setFailReason("no_streams");
            }

            setAvailablePlayerTypes(nextAvailablePlayerTypes);
            setPlayerType(nextPlayerType);
        },
    }), [episodePage, setPlayerType, setAvailablePlayerTypes]);

    useSubscriptionMemo(() => combineLatest([
        defer(() => episodePage.getEpisodeIndex()),
        episodePage.getEpisode$(),
        episodePage.state.config$,
    ]), [episodePage], observer);

    // show loading animation
    if (!firstLoadComplete) {
        return (
            <WithRatio ratio={16 / 9}><CircularProgress/></WithRatio>
        );
    }

    return (
        <Video
            playerType={playerType}
            playerProps={playerProps}
            embeds={embeds}
            failReason={failReason}
        />
    );
}
