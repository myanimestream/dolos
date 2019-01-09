import {Type} from "../utils";
import {EpisodePage, OverviewPage} from "./pages";
import AnimePage from "./pages/anime";
import ServicePage from "./service-page";
import State from "./state";

export default abstract class Service {
    OverviewPage: Type<OverviewPage<this>>;
    AnimePage: Type<AnimePage<this>>;
    EpisodePage: Type<EpisodePage<this>>;

    state: State<this>;

    protected constructor(service_id: string, animePage: Type<AnimePage<any>>, episodePage: Type<EpisodePage<any>>,) {
        this.state = new State(service_id);

        this.OverviewPage = null;
        this.AnimePage = animePage;
        this.EpisodePage = episodePage;
    }

    abstract async route(url: URL);

    async load(noRoute?: boolean) {
        this.insertNoReferrerPolicy();

        if (!noRoute) await this.route(new URL(location.href));
    }

    // noinspection JSMethodCanBeStatic
    insertNoReferrerPolicy() {
        const temp = document.createElement("template");
        temp.innerHTML = `<meta name="referrer" content="never">`;
        document.head.appendChild(temp.content.firstElementChild);
    }

    buildServicePage<T extends ServicePage<any>>(cls: Type<T>, memory?: { [key: string]: any }): T {
        const page = new cls(this);
        if (memory) {
            for (let [key, value] of Object.entries(memory))
                page.remember(key, value);
        }

        return page;
    }


    async showAnimePage(memory?: { [key: string]: any }) {
        await this.state.loadPage(this.buildServicePage(this.AnimePage, memory));
    }


    async showEpisodePage(memory?: { [key: string]: any }) {
        await this.state.loadPage(this.buildServicePage(this.EpisodePage, memory));
    }
}