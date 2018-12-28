import {getState} from "./utils";
import _ = chrome.i18n.getMessage;

chrome.runtime.onInstalled.addListener(async details => {
    if (details.reason == "update") {
        (await getState()).hasNewVersion = true;
    }
});

async function setup() {
    const state = await getState();

    state.onChange("hasNewVersion", value =>
        chrome.browserAction.setBadgeText({text: value ? _("ext_badge__new_version") : ""})
    );
}

setup();