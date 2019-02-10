/**
 * Exposes the secrets passed by Webpack with the benefit of being definitely typed.
 *
 * @module secrets
 */

/** Dark secrets of Dolos */
export interface Secrets {
    sentryDSN?: string;
    sentryEnvironment?: string;
    keenProjectID?: string;
    keenWriteKey?: string;
}

let secrets: Secrets;

try {
    // @ts-ignore
    secrets = WEBPACK_SECRETS;
} catch {
    secrets = {};
}

export default secrets;
