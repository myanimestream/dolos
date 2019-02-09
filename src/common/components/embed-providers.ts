/**
 * @module common/components
 */

export interface EmbedProvider {
    name?: string;
    icon?: string;
}

const embedProviders: Map<string | RegExp, EmbedProvider> = new Map([
    [/(\w+\.)?mystream.to/, {name: "MyStream"}],
    ["fembed", {name: "Fembed", icon: "https://www.fembed.com/asset/default/img/favicon.png"}],
    ["mp4upload.com", {name: "Mp4Upload"}],
    ["oload.tv", {name: "Openload"}],
    ["rapidvideo.com", {name: "RapidVideo"}],
    ["stream.moe", {name: "StreamMoe"}],
] as Array<[string | RegExp, EmbedProvider]>);

const wwwMatcher = /^www\./;

function cleanHostname(hostname: string): string {
    return hostname.replace(wwwMatcher, "");
}

function getEmbedProvider(hostname: string): EmbedProvider | undefined {
    hostname = cleanHostname(hostname);
    const info = embedProviders.get(hostname);
    if (info) return info;

    for (const [key, value] of embedProviders.entries()) {
        if (key instanceof RegExp) {
            if (key.test(hostname)) return value;
        }
    }

    return undefined;
}

export interface EmbedInfo extends EmbedProvider {
    name: string;
    url: string;
}

const tldMatcher = /\.\w+$/;

export function getEmbedInfo(rawUrl: string | URL): EmbedInfo {
    const url = rawUrl instanceof URL ? rawUrl : new URL(rawUrl);

    const info: Partial<EmbedInfo> = {
        url: url.href,
    };

    const providerInfo = getEmbedProvider(url.hostname);
    if (providerInfo) Object.assign(info, providerInfo);

    if (!info.name) info.name = url.hostname.replace(tldMatcher, "");
    if (!info.icon) info.icon = new URL("/favicon.ico", url).href;

    return info as EmbedInfo;
}
