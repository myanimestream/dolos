/**
 * @module store
 */

/** @ignore */

/**
 * Create a string identifying the given translation configuration.
 *
 * @param language - Language
 * @param dubbed - Dubbed
 */
export function buildLanguageIdentifier(language: string, dubbed: boolean): string {
    return `${language}_${dubbed ? "dub" : "sub"}`;
}

/**
 * Convert a string to a safe identifier.
 *
 * A safe identifier, in this context, is just a string without any special
 * characters such as stop-characters or punctuation. Just alphanumeric text.
 *
 * @param text - Text to convert
 */
export function safeIdentifier(text: string): string {
    let identifier = "";
    for (let i = 0; i < text.length; i++) {
        // apparently this godawful concatenation is faster than
        // joining an array of strings in JS.
        identifier += text.charCodeAt(i).toString(16);
    }

    return identifier;
}

/**
 * Identifier which uniquely identifies a piece of media.
 * It's made up of the service id, the language id and the medium id
 * (in that order).
 */
export class Identifier {
    public readonly serviceID: string;
    public readonly languageID: string;
    public readonly mediumID: string;

    constructor(identifier: string | Identifier);
    constructor(serviceID: string, languageID: string, mediumID: string);
    constructor(...args: any[]) {
        if (args.length === 1) {
            const identifier = args[0];

            if (identifier instanceof Identifier)
                args = identifier.asTuple();
            else
                args = identifier.split("::");
        }

        if (args.length !== 3)
            throw new Error("Invalid identifier");

        this.serviceID = args[0];
        this.languageID = args[1];
        this.mediumID = args[2];
    }

    public asTuple(): [string, string, string] {
        return [this.serviceID, this.languageID, this.mediumID];
    }

    public asString(): string {
        return `${this.serviceID}::${this.languageID}::${this.mediumID}`;
    }
}
