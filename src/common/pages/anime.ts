import Service from "../service";
import ServicePage from "../service-page";


export default abstract class AnimePage<T extends Service> extends ServicePage<T> {

    constructor(service: T) {
        super(service);
    }

    abstract async getAnimeSearchQuery(): Promise<string | null>;

    abstract async getAnimeIdentifier(): Promise<string | null>;

    async getAnimeUID(forceSearch?: boolean): Promise<string | null> {
        const animeInfo = await this.state.getAnimeInfo(await this.getAnimeIdentifier());
        if (animeInfo.uid && !forceSearch)
            return animeInfo.uid;

        const query = await this.getAnimeSearchQuery();
        const results = await this.state.searchAnime(query);
        if (!results) return null;

        const uid = results[0].anime.uid;
        animeInfo.uid = uid;

        return uid;
    }

    abstract async canSetAnimeProgress(): Promise<boolean>;

    abstract async setAnimeProgress(progress: number): Promise<boolean>;

    abstract async getEpisodesWatched(): Promise<number | null>;

    abstract async getEpisodeCount(): Promise<number | null>;

    async load() {
    }
}