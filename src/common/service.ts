import {Type} from "../utils";
import {EpisodePage, OverviewPage} from "./pages";
import State from "./state";

export default abstract class Service {
    OverviewPage: Type<OverviewPage>;
    EpisodePage: Type<EpisodePage>;

    state: State;

    protected constructor(service_id: string, episodePage: Type<EpisodePage>,) {
        this.state = new State(service_id);

        this.OverviewPage = null;
        this.EpisodePage = episodePage;
    }

    abstract async route(url: URL);

    abstract async getAnimeSearchQuery(): Promise<string | null>;

    abstract async getAnimeIdentifier(): Promise<string | null>;

    async load(noRoute?: boolean) {
        this.insertNoReferrerPolicy();

        if (!noRoute) await this.route(new URL(location.href));
    }

    insertNoReferrerPolicy() {
        const temp = document.createElement("template");
        temp.innerHTML = `<meta name="referrer" content="never">`;
        this.state.injected(document.head.appendChild(temp.content.firstElementChild));
    }

    async getAnimeUID(): Promise<string | null> {
        const animeInfo = await this.state.getAnimeInfo(await this.getAnimeIdentifier());
        if (animeInfo.uid)
            return animeInfo.uid;

        const query = await this.getAnimeSearchQuery();
        const results = await this.state.searchAnime(query);
        if (!results) return null;

        const uid = results[0].anime.uid;
        animeInfo.uid = uid;

        return uid;
    }


    async showEpisodePage() {
        await this.state.loadPage(new this.EpisodePage(this));
    }
}