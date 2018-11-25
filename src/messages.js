import Raven from "raven-js";
import * as Cookies from "js-cookie";

import {anime} from "./api";

export async function showModal(message) {
    alert(message);
}

function shouldShowMessage(id, expiryTime = 1) {
    const cookieName = "msg-" + id;
    if (!Cookies.get(cookieName)) {
        Cookies.set(cookieName, "true", {
            expires: expiryTime
        });
        return true;
    } else {
        return false;
    }
}

export function animeNotFound() {
    const animeProvId = anime.name.replace(/\W+/g, "").toLowerCase();
    const id = `${animeProvId}-not-found`;
    if (shouldShowMessage(id)) {
        let alertMsg = "Couldn't find \"" + anime.name + "\"!";

        if (Raven.isSetup()) {
            alertMsg += " A report has been created for you and you can expect for this anime to be available soon";
            Raven.captureMessage("Anime \"" + anime.name + "\" not found.", {
                level: "info"
            });
        }

        return showModal(alertMsg);
    } else {
        console.log("Already warned about missing anime");
        return Promise.resolve();
    }
}

export function episodeNotFound(episodeIndex) {
    showModal(`Couldn't find episode ${episodeIndex + 1}!`);
}