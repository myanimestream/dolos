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
import ListSubheader from "@material-ui/core/ListSubheader";
import Typography from "@material-ui/core/Typography";
import DeleteIcon from "@material-ui/icons/Delete";
import {AnimeSubscriptionInfo} from "dolos/models";
import Store from "dolos/store";
import {useAnimeSubscriptions} from "dolos/subscriptions";
import * as React from "react";
import _ = chrome.i18n.getMessage;

export interface SubscriptionItemProps {
    subscription: AnimeSubscriptionInfo;
}

export function SubscriptionItem(props: SubscriptionItemProps) {
    const {subscription} = props;

    function showAnime(): void {
        chrome.tabs.create({url: subscription.animeURL});
    }

    function unsubscribeAnime(): void {
        Store.getAnimeSubscriptions().then(subs => delete subs[subscription.identifier]);
    }

    let secondaryText = null;
    const unseenEpisodes = subscription.anime.episodes - subscription.episodesWatched;
    if (unseenEpisodes > 0) {
        secondaryText = _("subscriptions__unseen_episodes", [unseenEpisodes]);
    }

    return (
        <ListItem button onClick={showAnime}>
            <ListItemAvatar>
                <Avatar alt={subscription.anime.title} src={subscription.anime.thumbnail}/>
            </ListItemAvatar>
            <ListItemText
                primary={subscription.anime.title}
                secondary={secondaryText}
            />
            <ListItemSecondaryAction>
                <IconButton aria-label={_("subscriptions__remove_subscription")} onClick={unsubscribeAnime}>
                    <DeleteIcon/>
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>
    )
}

function SubscriptionsDisplay() {
    const subscriptions = useAnimeSubscriptions();

    if (subscriptions === undefined)
        return <CircularProgress/>;

    let animeSubscriptions;
    if (Object.values(subscriptions).length > 0) {
        const featuredSubs: AnimeSubscriptionInfo[] = [];
        const subs: AnimeSubscriptionInfo[] = [];

        Object.values(subscriptions).forEach(sub => {
            const unseenEpisodes = sub.anime.episodes - sub.episodesWatched;
            if (unseenEpisodes > 0)
                featuredSubs.push(sub);
            else
                subs.push(sub);
        });

        animeSubscriptions = (
            <>
                {featuredSubs.length > 0 && (
                    <>
                        <ListSubheader>{_("subscriptions__anime__featured_subscriptions")}</ListSubheader>
                        {featuredSubs.map(sub => <SubscriptionItem key={sub.identifier} subscription={sub}/>)}

                        <ListSubheader>{_("subscriptions__anime__all_subscriptions")}</ListSubheader>
                    </>
                )}

                {subs.map(sub => <SubscriptionItem key={sub.identifier} subscription={sub}/>)}
            </>
        );
    } else {
        animeSubscriptions = <Typography>{_("subscriptions__no_active_subscriptions")}</Typography>;
    }

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