/**
 * @module components
 */

import {Config} from "dolos/models";

/**
 * Metadata for a website providing embedded streams
 */
export interface EmbedProvider {
    hostname: string;
    match: string | RegExp;
    id: string;
    name: string;
    icon: string;

    /**
     * Whether the embed provider information was generated.
     *
     * This is false for all known embed providers.
     * @see [[embedProviders]]
     */
    external: boolean;
}

const wwwMatcher = /^www\./;
const tldMatcher = /\.\w+$/;

/**
 * Create an [[EmbedProvider]] information just from the hostname.
 *
 * Defaults:
 * [[EmbedProvider.match]]: provided hostname
 * [[EmbedProvider.name]]: [[getDomain]]
 * [[EmbedProvider.id]]: lowercase name
 * [[EmbedProvider.icon]]: default "favicon.ico" location
 */
export function createEmbedProvider(hostname: string, info?: Partial<EmbedProvider>): EmbedProvider {
    info = info || {};

    const name = info.name || getDomain(hostname);
    return {
        external: true,
        hostname,
        icon: info.icon || `https://${hostname}/favicon.ico`,
        id: info.id || name.toLowerCase(),
        match: info.match || hostname,
        name,
    };
}

/**
 * Clean the given hostname.
 *
 * - Removes "www."
 * - Converts the hostname to lowercase
 *
 * @param hostname - Hostname to clean.
 */
function cleanHostname(hostname: string): string {
    return hostname
        .replace(wwwMatcher, "")
        .toLowerCase();
}

/**
 * Get the domain of the hostname.
 * The domain is the hostname without any sub-domain or top-level domain.
 *
 * @param hostname - Hostname to get domain from
 *
 * @example
 * ```ts
 *
 * getDomain("www.google.com") // google
 * ```
 */
function getDomain(hostname: string): string {
    return cleanHostname(hostname)
        .replace(tldMatcher, "");
}

/**
 * Get the [[EmbedProvider]] information for the given hostname.
 *
 * Selects the first provider whose [[EmbedProvider.match]] matches the given
 * hostname or the domain extracted using [[getDomain]].
 * The hostname is cleaned using [[cleanHostname]].
 *
 * @param hostname - Hostname to get info for.
 */
function getEmbedProviderFromHostname(hostname: string): EmbedProvider | undefined {
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

/**
 * Get the internal embed provider with the provided id.
 */
export function getEmbedProviderFromID(id: string): EmbedProvider | undefined {
    return embedProvidersByID[id];
}

/**
 * Like [[EmbedProvider]] but for a specific embed.
 */
export interface EmbedInfo extends EmbedProvider {
    url: string;
    number?: number;
}

export function getEmbedInfo(rawUrl: string | URL, allowUnknown: boolean): EmbedInfo | undefined;
export function getEmbedInfo(rawUrl: string | URL): EmbedInfo;
/**
 * Build an [[EmbedInfo]] from an embed url.
 *
 * @param allowUnknown - when false, returns undefined if the embed is unknown.
 */
export function getEmbedInfo(rawUrl: string | URL, allowUnknown?: boolean): EmbedInfo | undefined {
    const url = rawUrl instanceof URL ? rawUrl : new URL(rawUrl);

    const info: Partial<EmbedInfo> = {
        url: url.href,
    };

    const providerInfo = getEmbedProviderFromHostname(url.hostname);
    if (providerInfo) Object.assign(info, providerInfo);
    else if (allowUnknown) Object.assign(info, createEmbedProvider(url.hostname));
    else return undefined;

    return info as EmbedInfo;
}

/**
 * Filter out the [[EmbedInfo]] based on a blacklist.
 * Returns all embeds if there wouldn't be any embeds otherwise!
 *
 * The blacklist is an array of embed ids.
 */
function filterBlockedEmbedInfos(embedInfos: EmbedInfo[], blocked: Set<string>): EmbedInfo[] {
    const filteredEmbedInfos = embedInfos.filter(embedInfo => !blocked.has(embedInfo.id));

    // make sure there's still at least one embed available
    if (filteredEmbedInfos.length > 0)
        return filteredEmbedInfos;

    return embedInfos;
}

/**
 * Sort the list of [[EmbedInfo]]s in-place according to a template.
 *
 * The template is an array of embed ids.
 *
 * Order rules:
 * - template (sorted by template)
 * - internal (sorted by id)
 * - external (sorted by id)
 */
function sortEmbedInfos(embedInfos: EmbedInfo[], order: string[]): void {
    // map name -> index
    const orderMap = order.reduce((prev, current, index) => {
        prev[current] = index;
        return prev;
    }, {} as { [id: string]: number });

    // respect user preferred order
    embedInfos.sort((a, b) => {
        const aIndex = orderMap[a.id];
        const bIndex = orderMap[b.id];

        // if the user hasn't provided an ordering...
        if (aIndex === undefined && bIndex === undefined)
        // if they're both either internal or external
            if (a.external === b.external)
            // compare based on their id
                return a.id.localeCompare(b.id);
            else
            // order internal one first
                return a.external ? 1 : -1;
        // if b has a user-defined order, prefer b
        else if (aIndex === undefined)
            return 1;
        // if a has a user-defined order, prefer a
        else if (bIndex === undefined)
            return -1;

        // order whichever has the lower index first
        return aIndex - bIndex;
    });
}

/**
 * Based on the current order, number the embeds based
 * on their id such that embeds with the same id have
 * a different number.
 */
function addEmbedInfoNumbers(embedInfos: EmbedInfo[]): void {
    const idCounts: { [id: string]: number } = {};

    // keeps track of embeds which are the only one with a given id
    const singleEmbed: { [id: string]: EmbedInfo | null } = {};

    // add numbers to all embeds
    for (const embedInfo of embedInfos) {
        const id = embedInfo.id;

        const prevCount = idCounts[id] || 0;
        embedInfo.number = idCounts[id] = prevCount + 1;

        if (id in singleEmbed)
            singleEmbed[id] = null;
        else
            singleEmbed[id] = embedInfo;
    }

    // set number to undefined for embeds with a unique id
    for (const embed of Object.values(singleEmbed))
        if (embed) embed.number = undefined;
}

/**
 * Create [[EmbedInfo]]s from urls and use the user config
 * to sort and filter them.
 */
export function prepareEmbedInfos(urls: string[], embedConfig: Config["embedProviders"]): EmbedInfo[] {
    // filter non-https urls unless we don't have enough embeds otherwise
    let embedRawURLs = urls.filter(url => url.startsWith("https://"));
    if (embedRawURLs.length < 5) {
        // maybe they support https anyway, who knows?
        embedRawURLs = urls;
    }

    const embedURLs = embedRawURLs.map(rawUrl => {
        const url = new URL(rawUrl);
        url.protocol = "https:";
        return url;
    });

    let embedInfos = embedURLs
        .map(url => getEmbedInfo(url, embedConfig.allowUnknown))
        .filter(Boolean) as EmbedInfo[];

    embedInfos = filterBlockedEmbedInfos(embedInfos, new Set(embedConfig.blocked));

    sortEmbedInfos(embedInfos, embedConfig.order);
    addEmbedInfoNumbers(embedInfos);

    return embedInfos;
}

/**
 * List of [[EmbedProvider]] which are supported by default.
 */
export const embedProviders: EmbedProvider[] = [
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
        hostname: "openload.co",
        match: /(oload\.tv)|(openload\.co)/,
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
    {
        hostname: "streamango.com",
        match: /streamango\.(com|tv)/,
        name: "streamango",
    },
].map(provider => {
    const embed = createEmbedProvider(provider.hostname, provider);
    embed.external = false;
    return embed;
});

const embedProvidersByID = embedProviders.reduce((prev, current) => {
    prev[current.id] = current;
    return prev;
}, {} as { [id: string]: EmbedProvider });
