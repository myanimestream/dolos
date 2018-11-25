import $ from "jquery";

import config from "../../../config";
import {anime, prefetchNextEpisode} from "../../../api";
import {grobberUrl} from "../../../constants";
import {setupPlyr as _setupPlyr} from "../../../utils";

let currentPlayer;
let currentEpisodeIndex;

async function updateAnimeStatus(update) {
    const status = $("#myinfo_status");
    const score = $("#myinfo_score");
    const numWatchedEps = $("#myinfo_watchedeps");
    const data = {
        csrf_token: $("meta[name=\"csrf_token\"]").attr("content"),
        anime_id: parseInt($("#myinfo_anime_id").val()),
        status: parseInt(status.val()),
        score: parseInt(score.val()),
        num_watched_episodes: parseInt(numWatchedEps.val()) || 0
    };
    Object.assign(data, update);

    navigator.sendBeacon("/ownlist/anime/edit.json", JSON.stringify(data));
    status.val(data.status);
    score.val(data.score);
    numWatchedEps.val(data.num_watched_episodes);
}

async function finishedEpisode() {
    if (!await config.updateAnimeStatus) {
        console.log("Not updating anime status because of user settings");
    }

    const totalEpisodes = parseInt($("#curEps").text());

    const data = {
        status: (currentEpisodeIndex >= totalEpisodes) ? 2 : 1
    };

    const numWatched = parseInt($("#myinfo_watchedeps").val()) || 0;
    if (currentEpisodeIndex >= numWatched) {
        data.num_watched_episodes = currentEpisodeIndex;
    }
    console.log("updating data to:", data);
    await updateAnimeStatus(data);
}

async function onVideoEnd() {
    await finishedEpisode();
    if (currentEpisodeIndex + 1 <= anime.episodesAvailable) {
        const url = new URL((currentEpisodeIndex + 1).toString(), window.location.href);
        url.searchParams.set("autoplay", "true");
        window.location.href = url.toString();
    } else {
        console.log("reached the last episode");
    }
}

async function onPageLeave() {
    console.debug("detected page unload");

    if (!currentPlayer.ended) {
        const percentage = currentPlayer.currentTime / currentPlayer.duration;
        const minPercentage = await config.minWatchPercentageForSeen;

        if (percentage > minPercentage) {
            console.log("Left page with video at " + Math.round(100 * percentage).toString() + "% Counting as finished!");
            await finishedEpisode();
        }

        const url = new URL(window.location.href);
        url.searchParams.delete("autoplay");
        history.pushState(null, null, url.toString());
    }
}

function setupPlyr() {
    console.debug("setting up Plyr");
    return _setupPlyr(onVideoEnd, onPageLeave, () => {
        if (document.querySelector("div#embed-warning")) {
            return;
        }

        $(
            "<div id='embed-warning' class='initialize-tutorial'>" +
            "<i class='fa fa-exclamation' style='margin-right: 10px;'></i>" +
            "<span>" +
            "This is an embedded stream. Please mind that MyAnimeStream won't be able to update your episode status because of this!" +
            "</span>" +
            "</div>"
        ).insertBefore($("div.contents-video-embed"));
    });
}

async function createPlayer(container) {
    const html = await $.get(grobberUrl + "/templates/player/" + anime.uid + "/" + (currentEpisodeIndex - 1).toString());
    container.html(html);
    currentPlayer = setupPlyr();
}


export default async function showAnimeEpisode() {
    currentEpisodeIndex = parseInt(window.location.pathname.match(/^\/anime\/\d+\/[\w-]+\/episode\/(\d+)\/?$/)[1]);
    const embedContainer = $("div.video-embed.clearfix");

    if (embedContainer.length > 0) {
        document.querySelector("div.di-b>a").setAttribute("href", "../episode"); // show all episodes shouldn't link to "videos"

        const episodeSlideCount = parseInt($("li.btn-anime:last span.episode-number")[0].innerText.split(" ")[1]);

        if (episodeSlideCount < anime.episodesAvailable) {
            const episodeSlide = document.querySelector("#vue-video-slide");

            const episodePrefab = $("li.btn-anime:last")
                .clone()
                .removeClass("play")
                .remove("span.icon-pay");
            episodePrefab.find("div.text")
                .html("<span class=\"episode-number\"></span>");
            episodePrefab.find("img.fl-l")
                .attr("src", grobberUrl + "/images/default_poster");

            for (let i = episodeSlideCount; i < anime.episodesAvailable; i++) {
                const episodeObject = episodePrefab.clone();
                const epIdx = (i + 1).toString();
                episodeObject.find("span.episode-number")
                    .text("Episode " + epIdx);
                episodeObject.find("a.link")
                    .attr("href", epIdx);

                episodeObject.appendTo(episodeSlide);
            }
        }

        if (await config.replaceStream) {
            console.log("Manipulating player");
            createPlayer(embedContainer);

            $("div.information-right.fl-r.clearfix").remove(); // "Provided by Crunchyroll" removal
        } else {
            console.info("Not changing player because of user settings");
        }
    } else {
        console.log("Creating new video embed and page content");
        document.querySelector("td>div.js-scrollfix-bottom-rel>div>div>table>tbody")
            .innerHTML = await $.get(grobberUrl + "/templates/mal/episode/" + anime.uid + "/" + (currentEpisodeIndex - 1).toString());
        setupPlyr();
    }
    // Scroll the video slide to the correct position!
    document.querySelector("#vue-video-slide")
        .style.left = (-document.querySelector("li.btn-anime.play").offsetLeft)
        .toString() + "px";

    prefetchNextEpisode(currentEpisodeIndex - 1);
}
