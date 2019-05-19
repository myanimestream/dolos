/**
 * @module components/anime/episode-embed/episode-embed
 */

/** @ignore */

import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import * as React from "react";
import _ = chrome.i18n.getMessage;

/**
 * @see [[EmbedMenu]]
 */
export interface EmbedMenuProps {
    onSearchAnime: (event: React.MouseEvent<HTMLElement>) => any;
}

/**
 * Embed menu.
 */
export function EmbedMenu({onSearchAnime}: EmbedMenuProps) {
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | undefined>(undefined);

    const onMenuClick = (event: React.MouseEvent<HTMLElement>) => setAnchorElement(event.currentTarget);
    const onMenuClose = () => setAnchorElement(undefined);

    const open = !!anchorElement;

    return (
        <>
            <IconButton
                aria-label={_("episode__menu__label")}
                aria-owns={open ? "episode-embed-menu" : undefined}
                aria-haspopup="true"
                color="primary"
                onClick={onMenuClick}
            >
                <MoreVertIcon/>
            </IconButton>

            <Menu
                id="episode-embed-menu"
                anchorEl={anchorElement}
                open={open}
                onClose={onMenuClose}
            >
                <MenuItem onClick={onSearchAnime}>
                    {_("episode__menu__search_anime")}
                </MenuItem>
            </Menu>
        </>
    );
}
