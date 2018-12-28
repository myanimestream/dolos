/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/background/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/background/background-state.ts":
/*!********************************************!*\
  !*** ./src/background/background-state.ts ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Observable = /** @class */ (function () {
    function Observable(container) {
        this.listeners = {};
        this.container = container || {};
    }
    Observable.prototype.onChange = function (key, handler) {
        if (key in this.listeners) {
            this.listeners[key].push(handler);
        }
        else {
            this.listeners[key] = [handler];
        }
        return this;
    };
    Observable.prototype.updateOn = function (key, handler) {
        this.onChange(key, handler);
        handler(this.get(key), key);
        return this;
    };
    Observable.prototype.set = function (key, value) {
        this.container[key] = value;
        var listeners = this.listeners[key];
        if (listeners)
            listeners.forEach(function (listener) { return listener(value, key); });
        return true;
    };
    Observable.prototype.get = function (key) {
        return this.container[key];
    };
    return Observable;
}());
var BackgroundStateContainer = {
    hasNewVersion: false
};
var BackgroundState = new Observable(BackgroundStateContainer);
window["STATE"] = new Proxy(BackgroundState, {
    get: function (target, p) {
        if (p in target) {
            return target[p];
        }
        return target.get(p);
    },
    set: function (target, p, value) {
        return target.set(p, value);
    }
});


/***/ }),

/***/ "./src/background/events.ts":
/*!**********************************!*\
  !*** ./src/background/events.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = __webpack_require__(/*! ./utils */ "./src/background/utils.ts");
var _ = chrome.i18n.getMessage;
chrome.runtime.onInstalled.addListener(function (details) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(details.reason == "update")) return [3 /*break*/, 2];
                return [4 /*yield*/, utils_1.getState()];
            case 1:
                (_a.sent()).hasNewVersion = true;
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
function setup() {
    return __awaiter(this, void 0, void 0, function () {
        var state;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, utils_1.getState()];
                case 1:
                    state = _a.sent();
                    state.onChange("hasNewVersion", function (value) {
                        return chrome.browserAction.setBadgeText({ text: value ? _("ext_badge__new_version") : "" });
                    });
                    return [2 /*return*/];
            }
        });
    });
}
setup();


/***/ }),

/***/ "./src/background/index.ts":
/*!*********************************!*\
  !*** ./src/background/index.ts ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(/*! ./background-state */ "./src/background/background-state.ts");
__webpack_require__(/*! ./events */ "./src/background/events.ts");
__export(__webpack_require__(/*! ./utils */ "./src/background/utils.ts"));


/***/ }),

/***/ "./src/background/utils.ts":
/*!*********************************!*\
  !*** ./src/background/utils.ts ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
function getBackgroundWindow() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (res, rej) {
                        return chrome.runtime.getBackgroundPage(function (window) {
                            if (window)
                                res(window);
                            else
                                rej(new Error("background page not found"));
                        });
                    })];
                case 1: 
                // @ts-ignore
                return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.getBackgroundWindow = getBackgroundWindow;
function getState() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getBackgroundWindow()];
                case 1: return [2 /*return*/, (_a.sent())["STATE"]];
            }
        });
    });
}
exports.getState = getState;


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vc3JjL2JhY2tncm91bmQvYmFja2dyb3VuZC1zdGF0ZS50cyIsIndlYnBhY2s6Ly8vLi9zcmMvYmFja2dyb3VuZC9ldmVudHMudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2JhY2tncm91bmQvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2JhY2tncm91bmQvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esa0RBQTBDLGdDQUFnQztBQUMxRTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdFQUF3RCxrQkFBa0I7QUFDMUU7QUFDQSx5REFBaUQsY0FBYztBQUMvRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQXlDLGlDQUFpQztBQUMxRSx3SEFBZ0gsbUJBQW1CLEVBQUU7QUFDckk7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7O0FBR0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7O0FDNUVBO0lBSUksb0JBQVksU0FBc0I7UUFDOUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDcEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLElBQUksRUFBRSxDQUFDO0lBQ3JDLENBQUM7SUFFRCw2QkFBUSxHQUFSLFVBQVMsR0FBcUIsRUFBRSxPQUFnQztRQUM1RCxJ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QUN0RixDQUFDOzs7OztDQUNMO0FBRUQsS0FBSyxFQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2pCUixzRkFBNEI7QUFDNUIsa0VBQWtCO0FBR2xCLDBFQUF3Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNGeEI7Ozs7d0JBRVcscUJBQU0sSUFBSSxPQUFPLENBQUMsVUFBQyxHQUFHLEVBQUUsR0FBRzt3QkFDOUIsYUFBTSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBTTs0QkFDbkMsSUFBSSxNQUFNO2dDQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7Z0NBQ25CLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7d0JBQ3JELENBQUMsQ0FBQztvQkFIRixDQUdFLENBQ0w7O2dCQU5ELGFBQWE7Z0JBQ2Isc0JBQU8sU0FLTixFQUFDOzs7O0NBQ0w7QUFSRCxrREFRQztBQUVEOzs7O3dCQUNZLHFCQUFNLG1CQUFtQixFQUFFO3dCQUFuQyxzQkFBTyxDQUFDLFNBQTJCLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBQzs7OztDQUNqRDtBQUZELDRCQUVDIiwiZmlsZSI6ImJhY2tncm91bmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3NyYy9iYWNrZ3JvdW5kL2luZGV4LnRzXCIpO1xuIiwiaW50ZXJmYWNlIE9ic2VydmFibGVDb250YWluZXIge1xyXG4gICAgW2tleTogc3RyaW5nXTogYW55O1xyXG59XHJcblxyXG50eXBlIE9ic2VydmFibGVDaGFuZ2VIYW5kbGVyID0gKHZhbHVlOiBhbnksIGtleTogc3RyaW5nKSA9PiB2b2lkO1xyXG5cclxuY2xhc3MgT2JzZXJ2YWJsZTxUIGV4dGVuZHMgT2JzZXJ2YWJsZUNvbnRhaW5lcj4ge1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBsaXN0ZW5lcnM6IHsgW2tleTogc3RyaW5nXTogT2JzZXJ2YWJsZUNoYW5nZUhhbmRsZXJbXSB9O1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBjb250YWluZXI6IE9ic2VydmFibGVDb250YWluZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY29udGFpbmVyPzogUGFydGlhbDxUPikge1xyXG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0ge307XHJcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXIgfHwge307XHJcbiAgICB9XHJcblxyXG4gICAgb25DaGFuZ2Uoa2V5OiBzdHJpbmcgJiBrZXlvZiBULCBoYW5kbGVyOiBPYnNlcnZhYmxlQ2hhbmdlSGFuZGxlcikge1xyXG4gICAgICAgIGlmIChrZXkgaW4gdGhpcy5saXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnNba2V5XS5wdXNoKGhhbmRsZXIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzW2tleV0gPSBbaGFuZGxlcl07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVPbihrZXk6IHN0cmluZyAmIGtleW9mIFQsIGhhbmRsZXI6IE9ic2VydmFibGVDaGFuZ2VIYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy5vbkNoYW5nZShrZXksIGhhbmRsZXIpO1xyXG5cclxuICAgICAgICBoYW5kbGVyKHRoaXMuZ2V0KGtleSksIGtleSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHNldChrZXk6IHN0cmluZyAmIGtleW9mIFQsIHZhbHVlOiBhbnkpOiBib29sZWFuIHtcclxuICAgICAgICB0aGlzLmNvbnRhaW5lcltrZXldID0gdmFsdWU7XHJcblxyXG4gICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzW2tleV07XHJcbiAgICAgICAgaWYgKGxpc3RlbmVycykgbGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIodmFsdWUsIGtleSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQoa2V5OiBzdHJpbmcgJiBrZXlvZiBUKTogYW55IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXJba2V5XTtcclxuICAgIH1cclxufVxyXG5cclxuY29uc3QgQmFja2dyb3VuZFN0YXRlQ29udGFpbmVyID0ge1xyXG4gICAgaGFzTmV3VmVyc2lvbjogZmFsc2VcclxufTtcclxuXHJcbmNvbnN0IEJhY2tncm91bmRTdGF0ZSA9IG5ldyBPYnNlcnZhYmxlPHR5cGVvZiBCYWNrZ3JvdW5kU3RhdGVDb250YWluZXI+KEJhY2tncm91bmRTdGF0ZUNvbnRhaW5lcik7XHJcbnR5cGUgQmFja2dyb3VuZFN0YXRlVHlwZSA9IHR5cGVvZiBCYWNrZ3JvdW5kU3RhdGUgJiB0eXBlb2YgQmFja2dyb3VuZFN0YXRlQ29udGFpbmVyO1xyXG5cclxud2luZG93W1wiU1RBVEVcIl0gPSBuZXcgUHJveHkoQmFja2dyb3VuZFN0YXRlLCB7XHJcbiAgICBnZXQodGFyZ2V0OiBPYnNlcnZhYmxlPHR5cGVvZiBCYWNrZ3JvdW5kU3RhdGVDb250YWluZXI+LCBwOiBrZXlvZiB0eXBlb2YgQmFja2dyb3VuZFN0YXRlQ29udGFpbmVyKTogYW55IHtcclxuICAgICAgICBpZiAocCBpbiB0YXJnZXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtwXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0YXJnZXQuZ2V0KHApO1xyXG4gICAgfSxcclxuICAgIHNldCh0YXJnZXQ6IE9ic2VydmFibGU8dHlwZW9mIEJhY2tncm91bmRTdGF0ZUNvbnRhaW5lcj4sIHA6IGtleW9mIHR5cGVvZiBCYWNrZ3JvdW5kU3RhdGVDb250YWluZXIsIHZhbHVlOiBhbnkpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGFyZ2V0LnNldChwLCB2YWx1ZSk7XHJcbiAgICB9XHJcbn0pIGFzIEJhY2tncm91bmRTdGF0ZVR5cGU7XHJcblxyXG5leHBvcnQge0JhY2tncm91bmRTdGF0ZVR5cGV9OyIsImltcG9ydCB7Z2V0U3RhdGV9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCBfID0gY2hyb21lLmkxOG4uZ2V0TWVzc2FnZTtcclxuXHJcbmNocm9tZS5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKGFzeW5jIGRldGFpbHMgPT4ge1xyXG4gICAgaWYgKGRldGFpbHMucmVhc29uID09IFwidXBkYXRlXCIpIHtcclxuICAgICAgICAoYXdhaXQgZ2V0U3RhdGUoKSkuaGFzTmV3VmVyc2lvbiA9IHRydWU7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2V0dXAoKSB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGF3YWl0IGdldFN0YXRlKCk7XHJcblxyXG4gICAgc3RhdGUub25DaGFuZ2UoXCJoYXNOZXdWZXJzaW9uXCIsIHZhbHVlID0+XHJcbiAgICAgICAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0QmFkZ2VUZXh0KHt0ZXh0OiB2YWx1ZSA/IF8oXCJleHRfYmFkZ2VfX25ld192ZXJzaW9uXCIpIDogXCJcIn0pXHJcbiAgICApO1xyXG59XHJcblxyXG5zZXR1cCgpOyIsImltcG9ydCBcIi4vYmFja2dyb3VuZC1zdGF0ZVwiO1xyXG5pbXBvcnQgXCIuL2V2ZW50c1wiO1xyXG5cclxuZXhwb3J0IHtCYWNrZ3JvdW5kU3RhdGVUeXBlfSBmcm9tIFwiLi9iYWNrZ3JvdW5kLXN0YXRlXCI7XHJcbmV4cG9ydCAqIGZyb20gXCIuL3V0aWxzXCI7IiwiaW1wb3J0IHtCYWNrZ3JvdW5kU3RhdGVUeXBlfSBmcm9tIFwiLi9iYWNrZ3JvdW5kLXN0YXRlXCI7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QmFja2dyb3VuZFdpbmRvdygpOiBQcm9taXNlPFdpbmRvdz4ge1xyXG4gICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT5cclxuICAgICAgICBjaHJvbWUucnVudGltZS5nZXRCYWNrZ3JvdW5kUGFnZSh3aW5kb3cgPT4ge1xyXG4gICAgICAgICAgICBpZiAod2luZG93KSByZXMod2luZG93KTtcclxuICAgICAgICAgICAgZWxzZSByZWoobmV3IEVycm9yKFwiYmFja2dyb3VuZCBwYWdlIG5vdCBmb3VuZFwiKSk7XHJcbiAgICAgICAgfSlcclxuICAgICk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdGF0ZSgpOiBQcm9taXNlPEJhY2tncm91bmRTdGF0ZVR5cGU+IHtcclxuICAgIHJldHVybiAoYXdhaXQgZ2V0QmFja2dyb3VuZFdpbmRvdygpKVtcIlNUQVRFXCJdO1xyXG59Il0sInNvdXJjZVJvb3QiOiIifQ==