/**
 * @module background
 */

/** @ignore */

/**
 * Updater performs the necessary steps to perform an update from the given version.
 * It returns the version it updated to.
 */
export type Updater = (version: string) => string | undefined | PromiseLike<string | undefined>;

/**
 * Perform a series of updates to update the extension context.
 * This includes performing
 */
export async function performExtensionUpdate(fromVersion: string): Promise<void> {
    console.info(`[update] starting update from version ${fromVersion}`);
    let version: string | undefined = fromVersion;

    while (true) {
        let updater = getUpdater(version);
        if (!updater) break;

        let before = version;

        version = await Promise.resolve(updater(version));
        if (!version) break;

        console.info(`[update] updated from version ${before} to ${version}`);
    }

    console.info(`[update] done`);
}

/** @ignore */
const updaters: Map<string | RegExp, Updater> = new Map([
    /**
     * From versions 0.0.1 to 0.1.1 the storage structure differs from later versions.
     * This updater fixes this and cleans up as well.
     */
    [/0\.[01]\.\d+/, async (v: string) => {
        console.info(`[${v} -> 0.2.0] performing storage update`);

        const newStorage: { [key: string]: any } = {};

        const idMatcher = /^(\w+)::(\w+)::([0-9a-f]+)$/;

        const storage = await new Promise(res => chrome.storage.sync.get(res));
        for (const [key, value] of Object.entries(storage)) {
            if (key === "config") {
                newStorage["config"] = value;
                continue;
            }

            const match = idMatcher.exec(key);
            if (!match) continue;

            const [service, language, animeHexID] = match.slice(1);

            // convert hex to normal id
            let animeID = "";
            for (let i = 0; (i < animeHexID.length && animeHexID.substr(i, 2) !== "00"); i += 2)
                animeID += String.fromCharCode(parseInt(animeHexID.substr(i, 2), 16));

            let serviceStorage = newStorage[`${service}::anime`];
            if (!serviceStorage) serviceStorage = newStorage[`${service}::anime`] = {};

            let languageStorage = serviceStorage[language];
            if (!languageStorage) languageStorage = serviceStorage[language] = {};

            languageStorage[animeID] = value;
        }

        console.info(`[${v} -> 0.2.0] clearing storage`);
        await new Promise(res => chrome.storage.sync.clear(res));
        console.info(`[${v} -> 0.2.0] setting new storage`);
        await new Promise(res => chrome.storage.sync.set(newStorage, res));

        return "0.2.0";
    }],
]);

/**
 * Get the updater for a given version.
 */
export function getUpdater(version: string): Updater | undefined {
    const match = updaters.get(version);
    if (match) return match;

    for (const [matcher, updater] of updaters.entries()) {
        if (matcher instanceof RegExp) {
            if (matcher.test(version))
                return updater;
        }
    }

    return;
}
