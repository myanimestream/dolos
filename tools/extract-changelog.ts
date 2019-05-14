/**
 * Extract Dolos' changelog and write it to the console.
 * The changelog is formatted as Markdown.
 */

/** @ignore */

import CHANGELOG, {Change} from "../src/changelog";

function formatChanges(changes: Change[]): string {
    return changes
        .map(change => `- ${change}`)
        .join("\n");
}

function extractChangelog(): string {
    const versions = [];

    for (const [version, changes] of CHANGELOG.entries()) {
        versions.push(`## ${version}\n${formatChanges(changes)}`);
    }

    return versions.join("\n\n");
}

function extractVersion(version: string): string {
    const changes = CHANGELOG.get(version);
    if (!changes)
        return "**No changes found**";
    else
        return formatChanges(changes);
}

async function main() {
    let versionInput = process.argv[2];
    let out;
    if (versionInput) {
        if (versionInput === "auto") {
            // @ts-ignore
            const manifest = await import("../dist/manifest");
            versionInput = manifest.version;
        }

        out = extractVersion(versionInput);
    } else
        out = extractChangelog();

    console.info(out);
}

main()
    .catch(console.error);
