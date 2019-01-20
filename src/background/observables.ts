if (!chrome.browserAction) throw new Error("Background imported in non-background page context!");

import * as rxjs from "rxjs"
import {NewEpisodeEvent} from "./update-check";

export const hasNewVersion$ = new rxjs.BehaviorSubject(false);
// @ts-ignore
window["hasNewVersion$"] = hasNewVersion$;

export const hasNewEpisode$: rxjs.Subject<NewEpisodeEvent> = new rxjs.Subject();
// @ts-ignore
window["hasNewEpisode$"] = hasNewEpisode$;