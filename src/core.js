import "./lib/index";

import $ from "jquery";
import Raven from "raven-js";

import checkForUpdate from "./changelog";
import * as kitsu from "./kitsu/index";
import * as mal from "./mal/index";
import {username} from "./api";
import {ravenDSN} from "./constants";
import {injectNoReferrerMeta} from "./utils";


export const currentURL = new URL(window.location.href);


function init() {
    let router;

    switch (currentURL.hostname) {
        case "myanimelist.net":
            console.info("routing MyAnimeList");
            router = mal.route;
            break;
        case "kitsu.io":
            console.info("routing Kitsu");
            router = kitsu.route;
            break;
    }

    if (router) {
        try {
            router(currentURL.pathname);
        } catch (e) {
            console.trace("Routing error:", e);
        }
    }

    checkForUpdate();
}

function _init() {
    injectNoReferrerMeta();
    $(init);
}

export function addUserContext(mobile) {
    if (Raven.isSetup()) {
        if (username) {
            console.log("Set user context for", username);
            Raven.setUserContext({
                username,
                mobile
            });
        } else {
            console.log("Not logged in");
        }
    }
}

if (ravenDSN) {
    Raven.config(ravenDSN, {
        release: GM_info.script.version,
        tags: {
            manager_version: GM_info.version
        },
        whitelistUrls: [/userscript\.html/g]
    }).install();

    console.info("Using Raven DSN!");
    Raven.context(_init);
} else {
    console.warn("No Raven DSN provided, not installing!");
    _init();
}