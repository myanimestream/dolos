/**
 * @module common/components
 */

/** @ignore */

import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import {Theme} from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";
import NotificationsActiveIcon from "@material-ui/icons/NotificationsActive";
import NotificationsNoneIcon from "@material-ui/icons/NotificationsNone";
import {makeStyles} from "@material-ui/styles";
import {Service} from "dolos/common";
import {AnimePage} from "dolos/common/pages";
import {useObservablePromiseMemo} from "dolos/hooks";
import * as React from "react";
import _ = chrome.i18n.getMessage;

/** @ignore */
const useStyles = makeStyles((theme: Theme) => ({
    buttonIconLeft: {
        marginRight: theme.spacing.unit,
    },
    container: {
        display: "inline-block",
        position: "relative",
    },
    progress: {
        left: "50%",
        marginLeft: -12,
        marginTop: -12,
        position: "absolute",
        top: "50%",
    },
}));

export interface SubscriptionToggleProps {
    animePage: AnimePage<Service>;
}

/**
 * A simple button which toggles the subscription for an Anime.
 */
export function SubscriptionToggle(props: SubscriptionToggleProps) {
    const {animePage} = props;

    const classes = useStyles();
    const [loading, setLoading] = React.useState(false);

    const canSubscribe = useObservablePromiseMemo(() => animePage.canSubscribeAnime$(), false);
    const subscribed = useObservablePromiseMemo(() => animePage.getSubscribed$());

    async function toggleSubscription(): Promise<void> {
        // still loading
        if (subscribed === undefined) return;

        setLoading(true);
        let success;

        if (subscribed)
            success = await animePage.unsubscribeAnime();
        else
            success = await animePage.subscribeAnime();

        if (!success)
            animePage.service.showErrorSnackbar(_(
                "anime__" +
                (subscribed ? "unsubscribe" : "subscribe") +
                "__failed",
            ));

        setLoading(false);
    }

    const icon = subscribed
        ? (<NotificationsActiveIcon className={classes.buttonIconLeft}/>)
        : (<NotificationsNoneIcon className={classes.buttonIconLeft}/>);

    // only disable button if the user isn't already subscribed.
    const disableAction = !subscribed && !canSubscribe;

    const buttonDisabled = loading || disableAction;
    const tooltipText = disableAction
        ? _("anime__subscription_not_possible")
        : _("anime__" + (subscribed ? "unsubscribe" : "subscribe") + "__help");

    return (
        <Tooltip title={tooltipText}>
            <div className={classes.container}>
                <Button
                    variant="contained"
                    color="secondary"
                    fullWidth={true}
                    disabled={buttonDisabled}
                    onClick={toggleSubscription}
                >
                    {icon}
                    {_("anime__" + (subscribed ? "unsubscribe" : "subscribe"))}
                </Button>
                {loading && <CircularProgress size={24} className={classes.progress}/>}
            </div>
        </Tooltip>
    );
}
