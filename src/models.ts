export enum Language {
    ENGLISH = "en",
    GERMAN = "de",
}


export interface Config {
    grobberUrl: string;

    autoplay: boolean;
    autoNext: boolean;

    language: Language;
    dubbed: boolean;

    updateAnimeProgress: boolean;
}

export const DEFAULT_CONFIG: Config = {
    grobberUrl: "https://mas.dokkeral.com",

    autoplay: true,
    autoNext: true,

    language: Language.ENGLISH,
    dubbed: false,

    updateAnimeProgress: true,
};


export interface StoredAnimeInfo {
    uid?: string;
}

export const DEFAULT_STORED_ANIME_INFO: StoredAnimeInfo = {
    uid: null,
};