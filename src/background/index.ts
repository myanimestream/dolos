if (!chrome.browserAction) throw new Error("Background imported in non-background page context!");

import "./events";
import "./telemetry";