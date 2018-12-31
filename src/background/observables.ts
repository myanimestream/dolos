if (!chrome.browserAction) throw new Error("Background imported in non-background page context!");

import * as rxjs from "rxjs"

export const hasNewVersion$ = new rxjs.BehaviorSubject(false);
window["hasNewVersion$"] = hasNewVersion$;