import {anime} from "../../../api";

export default function showAnimeDetails() {
    const atEpisodeContainer = document.getElementById("myinfo_watchedeps");
    const userStatusBar = $("div.user-status-block.js-user-status-block");
    const nextEpisode = (parseInt(atEpisodeContainer.getAttribute("value")) + 1) || 1;

    if (nextEpisode <= anime.episodesAvailable) {
        const epUrl = new URL(window.location.href);
        epUrl.pathname += "/episode/" + nextEpisode.toString();
        epUrl.searchParams.set("autoplay", "true");

        $("<a></a>")
            .text(((nextEpisode === 1) ? "Start" : "Continue") + " Watching")
            .addClass("inputButton btn-middle")
            .css("padding", "4px 12px")
            .css("margin-left", "8px")
            .css("color", "white")
            .attr("href", epUrl.toString())
            .appendTo(userStatusBar);
    }
}
