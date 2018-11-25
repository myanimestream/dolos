import config from "../../config";
import SettingsPage from "../../lib/pages/settings";
import {grobberUrl} from "../../constants";

export default class KitsuSettings extends SettingsPage {
    static addSettingsButton() {
        if (document.querySelector("ul.settings--navigation li.myanimestream")) {
            console.log("myanimestream tab already exists");
            return;
        }

        const nav = document.querySelector("ul.settings--navigation");
        if (nav) {
            console.log("Attaching MyAnimeStream settings");
            const liEl = document.createElement("li");
            liEl.classList.add("list-item", "ember-view", "myanimestream");
            const aEl = document.createElement("a");
            aEl.setAttribute("href", "javascript:;");
            aEl.innerText = "MyAnimeStream";
            aEl.addEventListener("click", () => history.pushState(null, null, "/settings/account?myanimestream"));
            liEl.appendChild(aEl);
            nav.appendChild(liEl);
        }
    }

    static hide() {
        document.querySelector("ul.settings--navigation li.myanimestream").classList.remove("active");
    }

    async showSettings() {
        console.log("Building settings page");
        document.querySelector("ul.settings--navigation li.active").classList.remove("active");
        document.querySelector("ul.settings--navigation li.myanimestream").classList.add("active");

        const container = document.querySelector("div.settings-container");

        container.innerHTML = await $.get(grobberUrl + "/templates/kitsu/settings", await config.all);

        document.querySelector("input[name=submit]")
            .addEventListener("click", this.submitSettings);
    }
}
