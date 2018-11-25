import $ from "jquery";

import {username} from "./api";
import config from "./config";
import {grobberUrl} from "./constants";
import {versionBiggerThan} from "./utils";

async function closeChangelog() {
    $(".changelog-popup-container").remove();
    $("body").removeClass("frozen");

    await config.set("lastVersion", GM_info.script.version);
    console.log("updated version");
}

async function showChangelog(toVersion, fromVersion) {
    const html = await $.get(grobberUrl + "/templates/changelog/" + fromVersion + "/" + toVersion);
    if (html.success === false) {
        console.log("no changes to show");
        return;
    }
    $.injectCSS({
        "body.frozen": {
            overflow: "hidden"
        },
        ".changelog-popup-container": {
            display: "flex",
            "justifyContent, alignItems": "center",
            position: "absolute",
            "top, left": 0,
            "width, height": "100%",
            zIndex: 1000,
            backgroundColor: "hsla(0, 0%, 0%, 0.5)"
        },
        ".changelog-popup": {
            zIndex: 2000,
            minWidth: "30vw",
            height: "90%"
        }
    });
    const changelogContainer = $("<div class='changelog-popup-container'></div>")
        .appendTo("body");
    $("<div class='changelog-popup'></div>")
        .html(html)
        .appendTo(changelogContainer);
    $("body").addClass("frozen");
    $("button.close-changelog-btn").click(closeChangelog);
}


export default async function checkForUpdate() {
    const localVersion = GM_info.script.version;
    if (username) {
        const remoteVersion = await config.lastVersion;
        if (!remoteVersion) {
            console.log("No remote version... Setting to", localVersion);
            await config.set("lastVersion", localVersion);
            return;
        }

        if (versionBiggerThan(localVersion, remoteVersion)) {
            console.log("showing changelog");
            await showChangelog(localVersion, remoteVersion);
        } else {
            console.debug("no new version");
        }
    } else {
        console.log("not checking for update because user isn't logged in");
    }

}