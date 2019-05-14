/**
 * @module components/anime
 */

/** @ignore */

import {Theme} from "@material-ui/core/styles/createMuiTheme";
import makeStyles from "@material-ui/styles/makeStyles";
import {AnimePage} from "dolos/common/pages";
import {SmartOpenDebugDialogButton} from "dolos/components";
import * as React from "react";
import {ContinueWatchingButton, SubscriptionToggle} from "./index";

/** @ignore */
const useStyles = makeStyles((theme: Theme) => ({
    bar: {
        "& > * + *": {
            marginTop: theme.spacing(1),
        },
        "display": "flex",
        "flexDirection": "column" as "column",
        "justifyContent": "space-between",
        "width": "100%",
    },
}));

export interface AnimeStatusBarProps {
    animePage: AnimePage<any>;
}

/** Simple component combining [[ContinueWatchingButton]] and [[SubscriptionToggle]] */
export function AnimeStatusBar({animePage}: AnimeStatusBarProps) {
    const classes = useStyles();

    return (
        <span className={classes.bar}>
            <ContinueWatchingButton animePage={animePage}/>
            <SubscriptionToggle animePage={animePage}/>
            <SmartOpenDebugDialogButton service={animePage.service}/>
        </span>
    );
}
