import {getAnimeInfo} from "../../../api";
import showAnimeEpisode from "./episode";

export async function route(path) {
    const name = document.querySelector("meta[property='og:title']").getAttribute("content");
    const status = "ABSENT";
    await getAnimeInfo(name, status);

    if (path.match(/^\/episodes\/\d+\/?$/)) {
        const epIndex = parseInt(path.match(/^\/episodes\/(\d+)\/?$/)[1]);
        await showAnimeEpisode(epIndex - 1);
    }
}