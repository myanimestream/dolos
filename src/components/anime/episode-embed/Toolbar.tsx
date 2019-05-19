/**
 * @module components/anime/episode-embed
 */

/** @ignore */

import Paper from "@material-ui/core/Paper";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import makeStyles from "@material-ui/styles/makeStyles";
import {EpisodePage} from "dolos/common/pages";
import {SmartOpenDebugDialogButton} from "dolos/components";
import {useObservableMemo, usePromiseMemo} from "dolos/hooks";
import * as React from "react";
import {BookmarkToggle} from "./BookmarkToggle";
import {EmbedMenu} from "./EmbedMenu";
import {PlayerTypeSelect} from "./PlayerTypeSelect";
import {SkipButtons} from "./SkipButtons";
import {PlayerType} from "./Video";

/** @ignore */
const useStyles = makeStyles((theme: Theme) => ({
    segment: {
        display: "flex",
    },
    toolbar: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: theme.spacing(1),
    },
}));

/**
 * @see [[Toolbar]]
 */
export interface ToolbarProps {
    episodePage: EpisodePage<any>;

    playerType: PlayerType;
    availablePlayerTypes: PlayerType[];
    setPlayerType: (type: PlayerType) => any;
}

/**
 * Player toolbar containing skip buttons, player type selection and the embed menu.
 */
export function Toolbar({episodePage, playerType, availablePlayerTypes, setPlayerType}: ToolbarProps) {
    const classes = useStyles();

    // TODO sanity check for these!
    const skipPrevData = usePromiseMemo(() => episodePage.prevEpisodeButton(), [episodePage]);
    const skipNextData = usePromiseMemo(() => episodePage.nextEpisodeButton(), [episodePage]);

    // TODO this observable doesn't emit anything by itself!
    const bookmarked = useObservableMemo(() => episodePage.episodeBookmarked$, [episodePage]);
    const canSetBookmark = usePromiseMemo(() => episodePage.animePage.canSetEpisodesWatched(), [episodePage], false);
    const setBookmark = (marked: boolean) => {
        if (marked)
            return episodePage.markEpisodeWatched();
        else
            return episodePage.markEpisodeUnwatched();
    };

    const handleSearchAnime = React.useCallback(() => {
        return episodePage.animePage.openAnimeSearchDialog(async (anime) => {
            if (!anime) return;
            await episodePage.animePage.setAnimeUID(anime);
        });
    }, [episodePage]);

    return (
        <Paper className={classes.toolbar}>
            <div className={classes.segment}>
                <SkipButtons previous={skipPrevData} next={skipNextData}/>
                <BookmarkToggle bookmarked={bookmarked} canSetBookmark={canSetBookmark} setBookmark={setBookmark}/>
            </div>

            <div className={classes.segment}>
                <PlayerTypeSelect current={playerType} availableTypes={availablePlayerTypes} setType={setPlayerType}/>
                <EmbedMenu onSearchAnime={handleSearchAnime}/>

                <SmartOpenDebugDialogButton service={episodePage.service}/>
            </div>
        </Paper>
    );
}
