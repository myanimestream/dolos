/**
 * @module background
 */

import {Episode, grobberClient} from "dolos/grobber";
import {getVersion} from "dolos/info";
import {getItem$, setItem, StorageAreaName, store} from "dolos/store";
import {getBlobURL} from "dolos/utils";
import {Observable} from "rxjs";
import {filter} from "rxjs/operators";
import {performExtensionUpdate} from "./extension-update";
import {BrowserNotification} from "./notifications";
import * as state from "./observables";
import {hasNewVersion$} from "./observables";
import {performUpdateCheck} from "./update-check";
import Alarm = alarms.Alarm;
import alarms = chrome.alarms;
import browserAction = chrome.browserAction;
import _ = chrome.i18n.getMessage;
import runtime = chrome.runtime;
import tabs = chrome.tabs;
import InstalledDetails = runtime.InstalledDetails;

const K_EXT_UPDATE = "ext::updated";

runtime.onInstalled.addListener(async (details: InstalledDetails) => {
    if (details.reason === "update" && details.previousVersion && details.previousVersion !== getVersion()) {
        // because we will immediately restart, store a value so we know whether we updated
        await setItem(StorageAreaName.Sync, K_EXT_UPDATE, true);
        await performExtensionUpdate(details.previousVersion);
    }
});

// check whether we updated
(getItem$(StorageAreaName.Sync, K_EXT_UPDATE)
    .pipe(filter(updated => !!updated)) as Observable<boolean>)
    .subscribe(hasNewVersion$);

alarms.onAlarm.addListener((alarm: Alarm) => {
    switch (alarm.name) {
        case "UpdateCheck":
            performUpdateCheck();
            break;
    }
});

alarms.create("UpdateCheck", {
    periodInMinutes: 60,
});
// since the alarm doesn't trigger immediately and the delay can't be set to 0 perform a check right away!
performUpdateCheck();

/**
 * Show the given text on the popup badge.
 * If the concept of a badge text does not exist
 * (i.e. on mobile) the text is shown in the title.
 *
 * Passing a falsy value or omitting the text altogether
 * will reset the text.
 */
function setBadgeText(text?: string): void {
    if (browserAction.setBadgeText)
        browserAction.setBadgeText({text: text || ""});
    else {
        let title = _("__MSG_ext_tooltip__");
        if (text) title = `${title} [${text}]`;

        browserAction.setTitle({title});
    }
}

state.hasNewVersion$.subscribe(async newVersion => {
    if (!newVersion)
        await setItem(StorageAreaName.Sync, K_EXT_UPDATE, undefined);

    const text = newVersion ? _("ext_badge__new_version") : undefined;
    setBadgeText(text);
});

state.hasNewEpisode$.subscribe(async e => {
    // ignore event if there's no unseen episode
    if (e.unseenEpisodes <= 0)
        return;

    const subscription = e.subscription;
    const anime = subscription.anime;
    const nextEpisodeIndex = subscription.episodesWatched;

    const getEpisodePoster = async () => {
        let episode: Episode;
        try {
            episode = await grobberClient.getEpisode(anime.uid, nextEpisodeIndex);
        } catch (e) {
            console.warn("Couldn't get episode", nextEpisodeIndex + 1, "for", anime.title, e);
            return undefined;
        }

        const poster = episode.poster;
        if (poster) return await getBlobURL(poster);
        else return undefined;
    };

    const thumbnailPromise = anime.thumbnail ? getBlobURL(anime.thumbnail) : Promise.resolve(undefined);

    const [thumbnailBlob, episodePoster] = await Promise.all([thumbnailPromise, getEpisodePoster()]);

    const notification = await BrowserNotification.create({
        buttons: [
            {title: _("notification__new_episodes__watch"), iconUrl: "img/play_arrow.svg"},
            {title: _("notification__new_episodes__unsubscribe"), iconUrl: "img/notifications_off.svg"},
        ],
        contextMessage: _("ext_name"),
        iconUrl: thumbnailBlob,
        imageUrl: episodePoster,
        message: _("notification__new_episodes", [e.unseenEpisodes]),
        title: anime.title,
        type: episodePoster ? "image" : "basic",
    });

    const sub = notification.onButtonClicked$.subscribe(async event => {
        switch (event.buttonIndex) {
            case 0:
                const url = subscription.nextEpisodeURL || subscription.animeURL;
                tabs.create({url});
                break;
            case 1:
                await store.unsubscribeAnime(subscription);
                break;
        }
    });

    // this might cause a small memory leak because waitRemoved doesn't capture all means of closing a notification
    // but at least it's better than having the buttons not work
    await notification.waitRemoved();
    sub.unsubscribe();
});
