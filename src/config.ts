export default interface Config {
    autoplay: boolean;
    autoNext: boolean;

    language: string;
    dubbed: boolean;
}

const DEFAULT_CONFIG: Config = {
    autoplay: true,
    autoNext: true,

    language: "en",
    dubbed: false
};

export function buildConfig(data: Object): Config {
    return Object.assign({}, DEFAULT_CONFIG, data);
}