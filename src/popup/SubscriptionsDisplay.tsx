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
import Store, {StoreProxyObject} from "dolos/store";
import * as React from "react";
import {Subscription} from "rxjs";


function SubscriptionItem(subscription: AnimeSubscriptionInfo) {
    function showAnime(): void {
        chrome.tabs.create({url: subscription.animeURL});
    }

    function unsubscribeAnime(): void {
        Store.getSubscribedAnimes().then(subs => delete subs[subscription.identifier]);
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
                <IconButton aria-label="Delete Subscription" onClick={unsubscribeAnime}>
                    <DeleteIcon/>
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>
    )
}

/** @ignore */
const useStyles = makeStyles(() => ({}));

function useSubscriptions(): StoreProxyObject<SubscribedAnimes> | undefined {
    const [subscriptions, setSubscriptions] = React.useState(undefined as StoreProxyObject<SubscribedAnimes> | undefined);

    React.useEffect(() => {
        let valueSub: Subscription;

        (async () => {
            const subs = await Store.getSubscribedAnimes();
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

    if (Object.values(subscriptions).length === 0)
        return <Typography>No active subscriptions</Typography>;

    return (
        <List>
            {Object.entries(subscriptions).map(([id, subscription]) => (
                <SubscriptionItem key={id} {...subscription}/>
            ))}
        </List>
    );
}

export default SubscriptionsDisplay;