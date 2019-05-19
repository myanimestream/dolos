/**
 * @module components/anime/episode-embed
 */

/** @ignore */

import BookmarkIcon from "@material-ui/icons/Bookmark";
import BookmarkBorderIcon from "@material-ui/icons/BookmarkBorder";
import {Toggle} from "dolos/components";
import * as React from "react";
import _ = chrome.i18n.getMessage;

/**
 * @see [[BookmarkToggle]]
 */
export interface BookmarkProps {
    bookmarked: boolean;
    canSetBookmark: boolean;
    setBookmark: (bookmarked: boolean) => any;
}

/**
 * Bookmark indicator.
 */
export function BookmarkToggle({bookmarked, canSetBookmark, setBookmark}: BookmarkProps) {
    const handleToggle = () => setBookmark(!bookmarked);

    return (
        <Toggle
            tooltip={_("episode__bookmark_unseen")}
            tooltipToggled={_("episode__bookmark_seen")}

            icon={<BookmarkBorderIcon/>}
            iconToggled={<BookmarkIcon/>}

            toggled={bookmarked}
            canToggle={canSetBookmark}
            onToggle={handleToggle}
        />
    );
}
