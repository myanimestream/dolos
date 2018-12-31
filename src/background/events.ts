import * as state from "./observables";
import _ = chrome.i18n.getMessage;

chrome.runtime.onInstalled.addListener(async details => {
    if (details.reason == "update") {
        state.hasNewVersion$.next(true);
    }
});

state.hasNewVersion$.subscribe(
    val => chrome.browserAction.setBadgeText({text: val ? _("ext_badge__new_version") : ""})
);