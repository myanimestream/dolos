/**
 * @module components/anime/episode-embed
 */

/** @ignore */

import Button from "@material-ui/core/Button";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import Tooltip from "@material-ui/core/Tooltip";
import SwitchVideoIcon from "@material-ui/icons/SwitchVideo";
import makeStyles from "@material-ui/styles/makeStyles";
import * as React from "react";
import {PlayerType} from "./Video";
import _ = chrome.i18n.getMessage;

/** @ignore */
const useStyles = makeStyles((theme: Theme) => ({
    buttonIconRight: {
        marginLeft: theme.spacing(1),
    },
}));

/**
 * Get the element following the current one in the array.
 * The next element of the last one, is the first element.
 *
 * @param items - Elements to choose next from
 * @param current - Current element
 */
function getNextElementInSequence<T>(items: T[], current: T): T | undefined {
    const index = items.indexOf(current);
    if (index < 0) return undefined;

    return items[(index + 1) % items.length];
}

/**
 * Get the string representation of the given player type.
 *
 * @param type - Player type to get name for
 */
function getPlayerTypeName(type: PlayerType | undefined): string {
    switch (type) {
        case PlayerType.Dolos:
            return _("episode__player_type_name__dolos");
        case PlayerType.Embed:
            return _("episode__player_type_name__embed");
        default:
            return _("episode__player_type_name__unknown");
    }
}

/**
 * @see [[PlayerTypeSelect]]
 */
export interface PlayerTypeSelectProps {
    current: PlayerType;
    availableTypes: PlayerType[];
    setType: (type: PlayerType) => any;
}

/**
 * Selection for the player type.
 */
export function PlayerTypeSelect({current, availableTypes, setType}: PlayerTypeSelectProps) {
    const classes = useStyles();

    const nextType = React.useMemo(
        () => getNextElementInSequence(availableTypes, current),
        [availableTypes, current],
    );
    const nextTypeName = React.useMemo(() => getPlayerTypeName(nextType), [nextType]);
    const handleClick = () => setType(nextType!);

    // no need to switch if there's only 1 or even none at all
    if (availableTypes.length < 2)
        return null;

    return (
        <Tooltip title={_("episode__switch_player_type")}>
            <Button color="primary" onClick={handleClick}>
                {nextTypeName}
                <SwitchVideoIcon className={classes.buttonIconRight}/>
            </Button>
        </Tooltip>
    );
}
