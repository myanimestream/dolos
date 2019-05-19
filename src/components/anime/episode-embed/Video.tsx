/**
 * Displays the streams/embeds.
 *
 * @module components/anime/episode-embed
 */

/** @ignore */

import Typography from "@material-ui/core/Typography";
import MoodBadIcon from "@material-ui/icons/MoodBad";
import makeStyles from "@material-ui/styles/makeStyles";
import {EmbedInfo} from "dolos/common";
import {EmbedPlayer, Player, PlayerProps, WithRatio} from "dolos/components";
import * as React from "react";
import _ = chrome.i18n.getMessage;

/**
 * Player type to show
 */
export enum PlayerType {
    None,
    Dolos,
    Embed,
}

/** @ignore */
const useStyles = makeStyles({
    flexCenterColumn: {
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-evenly",
    },
});

/**
 * Reason why no player exists.
 */
export type FailReason = "episode_unavailable" | "no_streams";

/**
 * Props for [[Video]]
 */
export interface VideoProps {
    playerType: PlayerType;
    playerProps?: PlayerProps;
    embeds?: EmbedInfo[];
    failReason?: FailReason;
}

/**
 * Component to display a stream/embed.
 */
export function Video({playerType, playerProps, embeds, failReason}: VideoProps) {
    const classes = useStyles();

    switch (playerType) {
        case PlayerType.Dolos:
            if (!playerProps) throw new Error("playerProps needs to be passed for player type Dolos");

            return (
                <Player {...playerProps}/>
            );
        case PlayerType.Embed:
            if (!embeds) throw new Error("embeds needs to be passed for player type Embed");

            return (
                <EmbedPlayer embeds={embeds}/>
            );
        case PlayerType.None:
            const msgName = failReason ? `episode__error__${failReason}` : "episode__error__general";

            return (
                <WithRatio ratio={16 / 9}>
                    <div className={classes.flexCenterColumn}>
                        <MoodBadIcon fontSize="large" color="primary"/>
                        <Typography variant="h4" color="textPrimary">
                            {_(msgName)}
                        </Typography>
                    </div>
                </WithRatio>
            );

        default:
            throw new Error(`Unknown player type passed! (${playerType})`);
    }
}
