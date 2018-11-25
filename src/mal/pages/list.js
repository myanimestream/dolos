import {findAnimeUID, username} from "../../api";
import {grobberUrl} from "../../constants";
import {currentURL} from "../../core";
import {injectBalloonCSS, randomItem, safeMongoKey, sleep} from "../../utils";

class AnimeListEntry {
    constructor(el) {
        this.el = el;
    }

    get name() {
        return this.el.find("td.title a.link").text();
    }

    get safeName() {
        return safeMongoKey(this.name);
    }

    get link() {
        return this.el.find("td.title a.link").attr("href");
    }

    get uid() {
        return (async () => {
            if (!this._uid) {
                this._uid = await findAnimeUID(this.name);
            }
            return this._uid;
        })();
    }

    get uidValid() {
        return (async () => await this.uid && this.episodesAvailable >= 0)();
    }

    get episodesPreviouslyAvailable() {
        return this._episodesPreviouslyAvailable;
    }

    set episodesPreviouslyAvailable(value) {
        this._episodesPreviouslyAvailable = value;
    }

    get episodesAvailable() {
        return isNaN(this._episodesAvailable) ? this.episodesPreviouslyAvailable : this._episodesAvailable;
    }

    set episodesAvailable(value) {
        this._episodesAvailable = value;
    }

    get currentEpisode() {
        const episode = this.el.find("td.progress span a").text();
        return parseInt(episode) || 0;
    }

    get nUnseenEpisodes() {
        return (this.episodesAvailable - this.currentEpisode) || 0;
    }

    get nNewEpisodes() {
        return (this.episodesAvailable - this.episodesPreviouslyAvailable) || 0;
    }

    removePrevious() {
        this.el.find(".episode-status").remove();
    }

    async show() {
        let text;
        let explanation;
        let onClick;
        let href;
        const classList = ["content-status", "episode-status"];

        if (await this.uidValid) {
            if (this.nNewEpisodes > 0) {
                text = (this.nNewEpisodes === 1) ? "new episode!" : "new episodes!";
                classList.push("new-episode");
                explanation = "There " +
                    ((this.nNewEpisodes === 1) ? "is an episode" : ("are " + this.nNewEpisodes.toString() + " episodes")) +
                    " you haven't watched yet!";
                href = this.link + "/episode/" + (this.currentEpisode + 1).toString();
            } else if (this.nUnseenEpisodes > 0) {
                text = (this.nUnseenEpisodes === 1) ? "unseen episode!" : "unseen episodes!";
                classList.push("unseen-episode");
                explanation = "There " +
                    ((this.nUnseenEpisodes === 1) ? "is an episode" : ("are " + this.nUnseenEpisodes.toString() + " episodes")) +
                    " you haven't watched yet!";
                href = this.link + "/episode/" + (this.currentEpisode + 1).toString();
            }
        }
        else if (await this.uid) {
            text = "uid invalid";
            explanation = "There was a UID cached but the server didn't accept it. Just open the anime page and it should fix itself";
        } else {
            text = "unknown uid";
            explanation = "There was no UID cached. Just open the anime page and it should fix itself";
        }
        if (text) {
            const beforeElement = this.el.find("td.title span.content-status");
            this.removePrevious();
            if (beforeElement.is(":visible")) {
                text = "| " + text;
            }
            let el;
            if (href) {
                el = $("<a></a>").attr("href", href);
            } else {
                el = $("<span></span>");
            }
            el.text(text);
            classList.forEach((cls) => el.addClass(cls));
            if (explanation) {
                el.attr("data-balloon-pos", "up");
                el.attr("data-balloon", explanation);
            }
            if (onClick) {
                el.click(onClick);
            }
            beforeElement.after(el);
        }
    }
}

async function getCurrentlyWatchingAnimeList() {
    let allEntries;
    while (!allEntries || allEntries.length <= 1) {
        allEntries = $("table.list-table tbody.list-item");
        await sleep(100);
    }
    const watching = allEntries.filter((idx, el) => $(el).find("td.data.status").hasClass("watching"));
    const watchingList = [];
    for (const el of watching) {
        watchingList.push(new AnimeListEntry($(el)));
    }
    return watchingList;
}

async function displayCachedAnimeList(cachedList, watchingList) {
    if (!username) {
        console.log("not logged in -> not caching anime list");
    }
    if (!cachedList) {
        console.debug("No Anime List cached");
        return;
    }
    for (const anime of watchingList) {
        const cachedAnime = cachedList[anime.safeName];
        if (cachedAnime) {
            anime._uid = cachedAnime.uid;
            anime.episodesPreviouslyAvailable = cachedAnime.episodesAvailable;
            anime.show();
        }
    }
}

async function cacheAnimeList(list) {
    if (!username) {
        console.log("not logged in -> not caching anime list");
    }

    const cachedList = {};
    for (const anime of list) {
        cachedList[anime.safeName] = {
            uid: anime._uid,
            episodesAvailable: anime.episodesAvailable
        };
    }
    await $.postJSON(grobberUrl + "/user/" + username + "/episodes", cachedList);
}

async function highlightAnimeWithUnwatchedEpisodes() {
    injectBalloonCSS();
    $.injectCSS({
        ".episode-status.new-episode": {
            "font-weight": "bolder",
            color: "#787878" + " !important"
        }
    });

    const [cachedList, watchingList] = await Promise.all([
        $.getJSON(grobberUrl + "/user/" + username + "/episodes"),
        getCurrentlyWatchingAnimeList()
    ]);

    const showCachePromise = displayCachedAnimeList(cachedList, watchingList);

    const uids = {};
    for (const item of watchingList) {
        if (await item.uid) {
            uids[await item.uid] = item;
        }
    }
    const resp = await $.postJSON(grobberUrl + "/anime/episode-count", Object.keys(uids));
    if (!resp.success) {
        console.warn("Got turned down when asking for episode counts: ", resp);
        return;
    }

    await showCachePromise;
    Object.entries(resp.anime).forEach(([uid, epCount]) => uids[uid].episodesAvailable = epCount);
    watchingList.forEach((anime) => anime.show());

    await cacheAnimeList(watchingList);
}

function injectRandomAnimeButton() {
    function openRandomAnimePage() {
        let chosenAnime;
        while (true) {
            const item = $(randomItem($("tbody.list-item td.title")));

            if (item.find("span.content-status").text().trim() !== "Not Yet Aired") {
                chosenAnime = item.find("a.link");
                break;
            }
        }
        console.log("randomly selected \"", chosenAnime.text(), "\"");
        window.location.href = chosenAnime.attr("href");
    }

    const showStatsBtn = $("#show-stats-button");
    showStatsBtn
        .clone()
        .attr("id", "open-random-anime")
        .html("<i class=\"fa fa-random\"></i> Random Anime")
        .click(openRandomAnimePage)
        .insertBefore(showStatsBtn);
}

export default function showAnimeList() {
    const statusPage = parseInt(currentURL.searchParams.get("status"));

    highlightAnimeWithUnwatchedEpisodes();
    if (statusPage === 6) {
        injectRandomAnimeButton();
    }
}