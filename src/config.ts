import Language from "./language";

export default interface Config {
    grobberUrl: string;

    autoplay: boolean;
    autoNext: boolean;

    language: Language;
    dubbed: boolean;
}

export const DEFAULT_CONFIG: Config = {
    grobberUrl: "https://mas.dokkeral.com",

    autoplay: true,
    autoNext: true,

    language: Language.ENGLISH,
    dubbed: false
};