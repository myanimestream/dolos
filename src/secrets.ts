/**
 * Exposes the secrets passed by Webpack with the benefit of being definitely typed.
 *
 * @module secrets
 */

/** Dark secrets of Dolos */
export interface Secrets {
    sentryDSN?: string;
    keenProjectID?: string;
    keenWriteKey?: string;
}

// @ts-ignore
const secrets = WEBPACK_SECRETS as Secrets;

export default secrets;