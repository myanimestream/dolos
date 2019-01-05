import {Type} from "../utils";
import {EpisodePage, OverviewPage} from "./pages";
import AnimePage from "./pages/anime";
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


    async showAnimePage() {
        await this.state.loadPage(new this.AnimePage(this));
    }


    async showEpisodePage() {
        await this.state.loadPage(new this.EpisodePage(this));
    }
}