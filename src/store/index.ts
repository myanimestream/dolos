/**
 * Tools for interacting with the browser storage.
 *
 * @module store
 * @preferred
 */

/** @ignore */

import {DolosStore} from "./dolos-store";
import {StorageAreaName} from "./storage";

export * from "./area-adapter";
export * from "./dolos-store";
export * from "./item";
export {Path} from "./namespace";
export {ItemObservable} from "./root";
export {StorageAreaName} from "./storage";

export const STORE = new DolosStore(StorageAreaName.Sync);
export default STORE;
