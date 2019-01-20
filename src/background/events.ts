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

state.hasNewVersion$.subscribe(
    val => chrome.browserAction.setBadgeText({text: val ? _("ext_badge__new_version") : ""})
);

chrome.alarms.create("UpdateCheck", {
    periodInMinutes: 60,
});
// since the alarm doesn't trigger immediately and the delay can't be set to 0 perform a check right away!
performUpdateCheck();