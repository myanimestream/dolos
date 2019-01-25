/**
 * @module popup
 */

import Avatar from "@material-ui/core/Avatar";
import CircularProgress from "@material-ui/core/CircularProgress";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";
import DeleteIcon from "@material-ui/icons/Delete";
import {makeStyles} from "@material-ui/styles";
import {AnimeSubscriptionInfo, SubscribedAnimes} from "dolos/models";
import Store, {StoreElementProxy} from "dolos/store";
import * as React from "react";
import {Subscription} from "rxjs";
import _ = chrome.i18n.getMessage;


function SubscriptionItem(subscription: AnimeSubscriptionInfo) {
    function showAnime(): void {
        chrome.tabs.create({url: subscription.animeURL});
    }

    function unsubscribeAnime(): void {
        Store.getAnimeSubscriptions().then(subs => delete subs[subscription.identifier]);
    }

    return (
        <ListItem button onClick={showAnime}>
            <ListItemAvatar>
                <Avatar alt={subscription.anime.title} src={subscription.anime.thumbnail}/>
            </ListItemAvatar>
            <ListItemText
                primary={subscription.anime.title}
            />
            <ListItemSecondaryAction>
                <IconButton aria-label={_("subscriptions__remove_subscription")} onClick={unsubscribeAnime}>
                    <DeleteIcon/>
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>
    )
}

/** @ignore */
const useStyles = makeStyles(() => ({}));

function useSubscriptions(): StoreElementProxy<SubscribedAnimes> | undefined {
    const [subscriptions, setSubscriptions] = React.useState(undefined as StoreElementProxy<SubscribedAnimes> | undefined);

    React.useEffect(() => {
        let valueSub: Subscription;

        (async () => {
            const subs = await Store.getAnimeSubscriptions();
            valueSub = subs.value$.subscribe(setSubscriptions);
        })();

        return () => {
            if (valueSub) valueSub.unsubscribe();
        };
    }, []);

    return subscriptions;
}

function SubscriptionsDisplay() {
    const subscriptions = useSubscriptions();

    if (subscriptions === undefined)
        return <CircularProgress/>;

    let animeSubscriptions;
    if (Object.values(subscriptions).length > 0) {
        animeSubscriptions = Object.entries(subscriptions).map(([id, subscription]) => (
            <SubscriptionItem key={id} {...subscription}/>
        ));
    } else
        animeSubscriptions = <Typography>{_("subscriptions__no_active_subscriptions")}</Typography>;

    return (
        <>
            <Typography variant="h5">{_("subscriptions__anime__subscription_header")}</Typography>
            <List>
                {animeSubscriptions}
            </List>
        </>
    );
}

export default SubscriptionsDisplay;