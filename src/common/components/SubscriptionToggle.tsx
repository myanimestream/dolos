/**
 * @module common.components
 */

/** @ignore */

import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Tooltip from "@material-ui/core/Tooltip";
import NotificationsActiveIcon from "@material-ui/icons/NotificationsActive";
import NotificationsNoneIcon from "@material-ui/icons/NotificationsNone";
import {makeStyles} from "@material-ui/styles";
import {useObservable, usePromise} from "dolos/hooks";
import * as React from "react";
import {EMPTY} from "rxjs";
import AnimePage from "../pages/anime";
import _ = chrome.i18n.getMessage;

/** @ignore */
const useStyles = makeStyles(() => ({
    container: {
        position: "relative",
        display: "inline-block",
    },
    progress: {
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12,
    },
}));

export interface SubscriptionToggleProps {
    animePage: AnimePage<any>;
}

/**
 * A simple button which toggles the subscription for an Anime.
 */
export default function SubscriptionToggle(props: SubscriptionToggleProps) {
    const {animePage} = props;

    const classes = useStyles();
    const [loading, setLoading] = React.useState(false);

    const subscribed$Promise = React.useState(animePage.getSubscribed$())[0];
    const subscribed$ = usePromise(subscribed$Promise);
    const subscribed = useObservable(subscribed$ || EMPTY, false);

    async function toggleSubscription(): Promise<void> {
        // still loading
        if (!subscribed$) return;

        setLoading(true);
        if (subscribed) await animePage.unsubscribeAnime();
        else await animePage.subscribeAnime();

        setLoading(false);
    }

    return (
        <Tooltip title={_("anime__" + (subscribed ? "unsubscribe" : "subscribe"))}>
            <div className={classes.container}>
                <Button variant="contained" color="primary" disabled={loading} onClick={toggleSubscription}>
                    {subscribed ? <NotificationsActiveIcon/> : <NotificationsNoneIcon/>}
                </Button>
                {loading && <CircularProgress size={24} className={classes.progress}/>}
            </div>
        </Tooltip>
    )
}