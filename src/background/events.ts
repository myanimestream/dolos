import axios from "axios";
import {GrobberClient} from "dolos/grobber";
import {BrowserNotification, NotificationButtonEvent} from "./notifications";
import * as state from "./observables";
import {performUpdateCheck} from "./update-check";
import Alarm = chrome.alarms.Alarm;
import _ = chrome.i18n.getMessage;
import InstalledDetails = chrome.runtime.InstalledDetails;

chrome.runtime.onInstalled.addListener(async (details: InstalledDetails) => {
    if (details.reason == "update") {
        state.hasNewVersion$.next(true);
    }
});

chrome.alarms.onAlarm.addListener((alarm: Alarm) => {
    switch (alarm.name) {
        case "UpdateCheck":
            performUpdateCheck();
            break;
        default:
            console.warn("Unknown Alarm:", alarm);
            break;
    }
});

chrome.alarms.create("UpdateCheck", {
    periodInMinutes: 60,
});
// since the alarm doesn't trigger immediately and the delay can't be set to 0 perform a check right away!
performUpdateCheck();

state.hasNewVersion$.subscribe(
    val => chrome.browserAction.setBadgeText({text: val ? _("ext_badge__new_version") : ""})
);

async function getBlobURL(url: string): Promise<string> {
    const resp = await axios.get(url, {responseType: "blob"});
    return URL.createObjectURL(resp.data);
}

state.hasNewEpisode$.subscribe(async e => {
    const anime = e.anime;
    const epDiff = anime.episodes - (e.previousEpisodes || 0);
    const nextEpisodeIndex = e.previousEpisodes || anime.episodes - 1;

    const getEpisodePoster = async () => {
        const episode = await GrobberClient.getEpisode(anime.uid, nextEpisodeIndex);
        const poster = episode.poster;
        if (poster) return await getBlobURL(poster);
        else return;
    };

    const [thumbnail, poster] = await Promise.all([getBlobURL(anime.thumbnail), getEpisodePoster()]);

    const notification = await BrowserNotification.create({
        type: "image",
        title: anime.title,
        iconUrl: thumbnail,
        imageUrl: poster,
        message: _("notification__new_episodes", [epDiff]),
        contextMessage: _("ext_name"),
        buttons: [
            {title: _("notification__new_episodes__watch"), iconUrl: "img/play_arrow.svg"},
            {title: _("notification__new_episodes__unsubscribe"), iconUrl: "img/notifications_off.svg"}
        ],
    });

    notification.onButtonClicked.addEventListener((event: NotificationButtonEvent) => console.log(event));
});