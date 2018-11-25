import showAnimeDetails from "./details";
import showAnimeEpisode from "./episode";
import showAnimeEpisodes from "./episodes";

import {getAnimeInfo} from "../../../api";
import {currentURL} from "../../../core";


function determineAnimeStatus() {
    const element = document.querySelector("#myinfo_status option[selected]");
    if (element) {
        return element.innerHTML.toUpperCase();
    } else {
        return "ABSENT";
    }
}

function patchNoEpisodeTab() {
    const episodeTab = document.querySelector("li a[href$=\"/episode\"]");
    if (!episodeTab) {
        console.log("No Episodes tab found, building my own");
        const preEpisodeTab = document.querySelector("div#horiznav_nav li:nth-child(2)");
        const tab = $("<li><a href=" + window.location.pathname + "/episode/1" + ">Watch</a></li>");

        if (!document.querySelector("a.horiznav_active")) {
            tab.find("a").addClass("horiznav_active");
        }

        tab.insertAfter(preEpisodeTab);
    }
}

export async function route() {
    const path = currentURL.pathname;

    const name = document.querySelector("h1>span[itemprop=name]").innerText;
    const status = determineAnimeStatus();
    await getAnimeInfo(name, status);

    patchNoEpisodeTab();

    if (path.match(/^\/anime\/\d+\/[\w-]+\/?$/)) {
        showAnimeDetails();
    } else if (path.match(/^\/anime\/\d+\/[\w-]+\/episode\/?$/)) {
        await showAnimeEpisodes();
    } else if (path.match(/^\/anime\/\d+\/[\w-]+\/episode\/\d+\/?$/)) {
        await showAnimeEpisode();
    } else {
        console.warn("Unknown anime page");
    }
}