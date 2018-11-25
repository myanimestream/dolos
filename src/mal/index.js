import startAdObserver from "./ad-remove";
import showAnimeList from "./pages/list";

import {setUsername} from "../api";
import {addUserContext, currentURL} from "../core";
import {isMobilePage} from "./platform";
import {addSettingsButton, showSettings} from "./pages/settings";
import * as animePage from "./pages/anime/_router";

const settingPaths = ["/editprofile.php", "/notification/setting", "/ownlist/style", "/account/payment"];


export async function route() {
    setUsername(unsafeWindow.MAL.USER_NAME);
    addUserContext(isMobilePage());

    startAdObserver();
    const path = currentURL.pathname;

    if (settingPaths.indexOf(path) > -1) {
        addSettingsButton();
    }

    if (path.match(/^\/anime\/\d+\/[\w-]+\/?/)) {
        await animePage.route();
    } else if (path.match(/^\/animelist\/\w+$/)) {
        showAnimeList();
    } else if (path.match(/^\/editprofile\.php$/) && currentURL.searchParams.get("go") === "myanimestream") {
        await showSettings();
    }
}
