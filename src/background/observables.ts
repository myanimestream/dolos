/**
 * @module background
 */

if (!chrome.browserAction) throw new Error("Background imported in non-background page context!");

import {BehaviorSubject, Subject} from "rxjs";
import {NewEpisodeEvent} from "./update-check";

export const hasNewVersion$ = new BehaviorSubject(false);
// @ts-ignore
window.hasNewVersion$ = hasNewVersion$;

export const hasNewEpisode$: Subject<NewEpisodeEvent> = new Subject();
// @ts-ignore
window.hasNewEpisode$ = hasNewEpisode$;
