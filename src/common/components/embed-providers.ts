/**
 * @module common/components
 */

/**
 * Metadata for a website providing embedded streams
 */
export interface EmbedProvider {
    hostname: string;
    match: string | RegExp;
    name: string;
    icon: string;
}

export const embedProviders: EmbedProvider[] = fillEmbedProviders([
    {
        hostname: "mystream.to",
        match: /(\w+\.)?mystream.to/,
        name: "MyStream",
    },
    {
        hostname: "fembed.com",
        icon: "https://www.fembed.com/asset/default/img/favicon.png",
        name: "Fembed",
    },
    {
        hostname: "mp4upload.com",
        name: "Mp4Upload",
    },
    {
        hostname: "oload.tv",
        name: "openload",
    },
    {
        hostname: "rapidvideo.com",
        name: "RapidVideo",
    },
    {
        hostname: "stream.moe",
        icon: "https://stream.moe/themes/flow/frontend_assets/images/icons/favicon/favicon.ico",
        name: "Stream.moe",
    },
]);

const wwwMatcher = /^www\./;
const tldMatcher = /\.\w+$/;

export function createEmbedProvider(hostname: string): EmbedProvider {
    return {
        hostname,
        icon: `https://${hostname}/favicon.ico`,
        match: hostname,
        name: getDomain(hostname),
    };
}

function fillEmbedProviders(providers: Array<{ hostname: string } & Partial<EmbedProvider>>): EmbedProvider[] {
    return providers.map(provider => Object.assign(createEmbedProvider(provider.hostname), provider));
}

function cleanHostname(hostname: string): string {
    return hostname
        .replace(wwwMatcher, "")
        .toLowerCase();
}

function getDomain(hostname: string): string {
    return cleanHostname(hostname)
        .replace(tldMatcher, "");
}

function getEmbedProvider(hostname: string): EmbedProvider | undefined {
    const domain = getDomain(hostname);
    hostname = cleanHostname(hostname);

    let domainMatch: EmbedProvider | undefined;

    for (const provider of embedProviders) {
        const match = provider.match;

        if (match instanceof RegExp) {
            if (match.test(hostname)) return provider;
        } else if (match === hostname) {
            return provider;
        } else if (match === domain) {
            domainMatch = provider;
        }
    }

    return domainMatch;
}

export interface EmbedInfo extends EmbedProvider {
    url: string;
}

export function getEmbedInfo(rawUrl: string | URL): EmbedInfo {
    const url = rawUrl instanceof URL ? rawUrl : new URL(rawUrl);

    const info: Partial<EmbedInfo> = {
        url: url.href,
    };

    const providerInfo = getEmbedProvider(url.hostname);
    if (providerInfo) Object.assign(info, providerInfo);
    else Object.assign(info, createEmbedProvider(url.hostname));

    return info as EmbedInfo;
}
