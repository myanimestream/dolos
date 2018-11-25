import {anime} from "../../../api";
import {grobberUrl} from "../../../constants";
import {currentURL} from "../../../core";

function fixEpisodePagination(offset) {
    const paginationEl = document.querySelector("div.pagination");
    if (paginationEl) {
        console.log("removing existing pagination");
        paginationEl.parentElement.remove();
    }
    if (anime.episodesAvailable <= 100) {
        console.log("no pagination needed");
        return;
    }
    console.log("building pagination");
    const paginationContainer = $("<div></div>").addClass("pagination ac");
    if (offset > 200) {
        const spanClass = (offset === 0) ? "link current" : "link";
        paginationContainer.append(
            "<a class=\"" + spanClass + "\" href=\"?offset=0\">1 - 100</a><span class=\"skip\">&lt;</span>"
        );
    }

    for (let off = Math.max(offset - 200, 0); off < Math.min(offset + 300, anime.episodesAvailable); off += 100) {
        const aClass = (offset === off) ? "link current" : "link";
        paginationContainer.append(
            "<a class=\"" + aClass + "\" href=\"?offset=" + off + "\">" + (off + 1).toString() + " - " + Math.min(off + 100, anime.episodesAvailable).toString() + "</a>"
        );
    }

    if (anime.episodesAvailable - offset > 300) {
        const tOff = 100 * Math.floor((anime.episodesAvailable - 1) / 100);
        const spanClass = (offset === tOff) ? "link current" : "link";
        paginationContainer.append(
            "<span class=\"skip\">&gt;</span><a class=\"" + spanClass + "\" href=\"?offset=" + tOff + "\">" + tOff.toString() + " - " + anime.episodesAvailable.toString() + "</a>"
        );
    }

    $("<div class=\"mt12 mb12\"></div>")
        .append(paginationContainer)
        .insertAfter("div.js-scrollfix-bottom-rel>div>table");
}

export default async function showAnimeEpisodes() {
    const episodeTable = document.querySelector("table.episode_list");
    const currentEpisodeOffset = parseInt(currentURL.searchParams.get("offset")) || 0;

    if (episodeTable) {
        console.log("Manipulating existing episode table...");
        const episodeCount = episodeTable.querySelectorAll("tr.episode-list-data").length;
        const lastEpisodeIndex = parseInt(episodeTable.querySelector("tr.episode-list-data:last-child td.episode-number").innerText);

        if (episodeCount === 100) {
            console.log("episode table paginated...");
        } else {
            if (lastEpisodeIndex < anime.episodesAvailable) {
                const episodeTableDescendHeader = document.querySelector("table.episode_list.descend tr.episode-list-header");

                const episodePrefab = document.querySelector("tr.episode-list-data").cloneNode(true);
                episodePrefab.querySelector("td.episode-title")
                    .querySelector("span.di-ib")
                    .innerText = "";
                episodePrefab.querySelector("td.episode-aired").remove();
                episodePrefab.querySelector("td.episode-forum").remove();

                for (let i = lastEpisodeIndex + 1; i < anime.episodesAvailable; i++) {
                    let epIdx = (i + 1).toString();
                    let episodeObject = $(episodePrefab).clone();
                    episodeObject.find("td.episode-number").text(epIdx);
                    episodeObject.find("td.episode-title")
                        .find("a")
                        .text("Episode " + epIdx)
                        .attr("href", "episode/" + epIdx);

                    episodeObject.find("td.episode-video>a")
                        .attr("href", "episode/" + epIdx)
                        .find("img")
                        .attr("alt", "Watch Episode #" + epIdx);

                    episodeObject.appendTo(episodeTable);
                    episodeObject.clone().insertAfter(episodeTableDescendHeader);
                }
            } else {
                console.log("They've done their job, this table is complete");
            }
        }
        fixEpisodePagination(currentEpisodeOffset);
    } else {
        console.log("Creating episode table...");
        document.querySelector("div.mb4").outerHTML = await $.get(grobberUrl + "/templates/mal/episode/" + anime.uid, {offset: currentEpisodeOffset});
    }

    const episodeCountDisplay = document.querySelector("h2>span.di-ib");
    episodeCountDisplay.innerText = "(" + anime.episodesAvailable.toString() + "/" + episodeCountDisplay.innerText.split("/")[1];
}
