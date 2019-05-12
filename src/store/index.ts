/**
 * Tools for interacting with the browser storage.
 *
 * @module store
 * @preferred
 */

/** @ignore */
export * from "./area-adapter";
export * from "./dolos-store";
export * from "./item";
export * from "./mut-item";
export {Path} from "./namespace";
export {ItemObservable} from "./root";
export {StorageAreaName} from "./storage";

import {DolosStore} from "./dolos-store";
import {StorageAreaName} from "./storage";

export const store = new DolosStore(StorageAreaName.Sync);
