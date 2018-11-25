import $ from "jquery";
import Plyr from "plyr";
import {currentURL} from "./core";

export function sleep(timeout) {
    return new Promise((res) => setTimeout(res, timeout));
}

export function injectBalloonCSS() {
    const link = "<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/balloon-css/0.5.0/balloon.min.css'>";
    $(link).appendTo("head");
}

export function injectNoReferrerMeta() {
    const tag = "<meta name='referrer' content='no-referrer'/>";
    $(tag).appendTo("head");
}


export function versionBiggerThan(a, b) {
    if (a === b) {
        return null;
    }

    const aComponents = a.split(".");
    const bComponents = b.split(".");
    const len = Math.min(aComponents.length, bComponents.length);

    for (let i = 0; i < len; i++) {
        if (parseInt(aComponents[i]) > parseInt(bComponents[i])) {
            return true;
        }
        if (parseInt(aComponents[i]) < parseInt(bComponents[i])) {
            return false;
        }
    }

    if (aComponents.length > bComponents.length) {
        return true;
    }

    if (aComponents.length < bComponents.length) {
        return false;
    }
}

export function safeMongoKey(key) {
    return key.replace(/\./g, "");
}

export function randomItem(list) {
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}

export function setupPlyr(onVideoEnd, onPageLeave, onEmbeddedPlayer) {
    let currentPlayer;

    const playerEl = document.getElementById("player");
    if (playerEl) {
        try {
            currentPlayer = new Plyr("#player");
        } catch (e) {
            console.trace("Plyr crashed for some reason...", e);
            throw e;
        }

        if (currentURL.searchParams.get("autoplay") === "true") {
            currentPlayer.play();
        }

        currentPlayer.on("ended", onVideoEnd);
        window.addEventListener("beforeunload", onPageLeave);
        console.debug("created Plyr player");
    } else {
        console.warn("Couldn't find player, assuming this is an iframe!");
        if (onEmbeddedPlayer) {
            onEmbeddedPlayer();
        }
    }

    return currentPlayer;
}