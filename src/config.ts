import Language from "./language";

export default interface Config {
    grobberUrl: string;

    autoplay: boolean;
    autoNext: boolean;

    language: Language;
    dubbed: boolean;
}

const DEFAULT_CONFIG: Config = {
    grobberUrl: "https://mas.dokkeral.com",

    autoplay: true,
    autoNext: true,

    language: Language.ENGLISH,
    dubbed: false
};

export function buildConfig(data: Object): Config {
    return Object.assign({}, DEFAULT_CONFIG, data);
}