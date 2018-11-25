import config from "./config";
import {grobberUrl} from "./constants";
import {safeMongoKey} from "./utils";
import * as messages from "./messages";

let _animeUidCache;

export const anime = {
    uid: null,
    name: null,
    episodesAvailable: null,
    status: null
};

export let username;

export function setUsername(name) {
    username = name;
}

export async function findAnimeUID(name) {
    if (!_animeUidCache) {
        _animeUidCache = JSON.parse(localStorage.getItem("AnimeUIDs")) || {};
    }
    const dub = await config.dub;
    const cat = _animeUidCache[dub ? "dub" : "sub"];
    if (cat) {
        return cat[name];
    }
}

export async function setAnimeUID(name, uid) {
    const dub = (await config.dub) ? "dub" : "sub";
    _animeUidCache = JSON.parse(localStorage.getItem("AnimeUIDs")) || {};
    const cat = _animeUidCache[dub];
    if (cat) {
        cat[name] = uid;
    } else {
        _animeUidCache[dub] = {[name]: uid};
    }
    localStorage.setItem("AnimeUIDs", JSON.stringify(_animeUidCache));
}


export async function updateEpisodesAvailable() {
    if (!anime.status) {
        return;
    } else if (anime.status !== "WATCHING") {
        console.log("not watching this anime");
        return;
    }

    console.debug("setting episodesAvailable to", anime.episodesAvailable);
    const name = safeMongoKey(anime.name);
    const update = {};
    update[name + ".uid"] = anime.uid;
    update[name + ".episodesAvailable"] = anime.episodesAvailable;
    await $.postJSON(grobberUrl + "/user/" + username + "/episodes", update);
}

export async function getAnimeInfo(name, status) {
    anime.name = name;
    anime.status = status;
    anime.uid = await findAnimeUID(name);

    let found = false;
    let data;

    if (anime.uid) {
        data = await $.getJSON(grobberUrl + "/anime/" + anime.uid);
        if (data.success) {
            found = true;
        } else {
            console.warn("Unsuccessful request for uid \"" + anime.uid + "\":", data);
        }
    }
    if (!found) {
        console.log("Searching for anime", name);
        const result = await $.getJSON(grobberUrl + "/search/" + name, {
            dub: await config.dub
        });

        if (result.success) {
            console.log("got answer", result);
            data = result.anime[0].anime;
            anime.uid = data.uid;
            setAnimeUID(name, anime.uid);
            found = true;
        } else {
            console.error("Couldn't find anime \"" + name + "\"");
        }
    }

    if (found) {
        anime.episodesAvailable = data.episodes;
        updateEpisodesAvailable();
        return true;
    } else {
        messages.animeNotFound();
        return false;
    }
}

export function prefetchNextEpisode(episodeIndex) {
    console.log("prefetching next episode");
    $.get(grobberUrl + "/anime/" + anime.uid + "/" + (episodeIndex + 1).toString() + "/preload");
}
