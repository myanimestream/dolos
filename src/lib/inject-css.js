/*
 * jquery.injectCSS.js - jquery css injection plugin
 * Copyright (C) 2013, Robert Kajic (robert@kajic.com)
 * http://kajic.com
 *
 * https://github.com/kajic/jquery-injectCSS
 * Allows for injection of CSS defined as javascript JSS objects.
 *
 * Based on JSS (http://jss-lang.org/).
 *
 * Licensed under the MIT License.
 *
 * Date: 2013-01-08
 * Version: 0.1
 */

import jQuery from "jquery";

function toCSS(jss, options) {
    function jsonToCSS(scope, css) {
        if (scope && !result[scope]) {
            result[scope] = {};
        }
        for (const property of Object.keys(css)) {
            const value = css[property];
            if (value instanceof Array) {
                const values = value;
                for (let i = 0; i < values.length; i++) {
                    addProperty(scope, property, values[i]);
                }
            }
            else {
                switch (typeof(value)) {
                    case "number":
                    case "string":
                        addProperty(scope, property, value);
                        break;
                    case "object": {
                        const endChar = property.charAt(property.length - 1);
                        if (scope && (endChar === "_" || endChar === "-")) {
                            const constiants = value;
                            for (const key of Object.keys(constiants)) {
                                // key may be a comma separted list
                                const list = key.split(/\s*,\s*/);
                                for (let j = 0; j < list.length; j++) {
                                    const valueconstiant = constiants[key];
                                    if (valueconstiant instanceof Array) {
                                        const valuesconstiant = valueconstiant;
                                        for (let k = 0; k < valuesconstiant.length; k++) {
                                            addProperty(scope, property + list[j], valuesconstiant[k]);
                                        }
                                    }
                                    else {
                                        addProperty(scope, property + list[j], constiants[key]);
                                    }
                                }
                            }
                        }
                        else {
                            jsonToCSS(makeSelectorName(scope, property), value);
                        }
                        break;
                    }
                }
            }
        }
    }

    function makePropertyName(n) {
        return n.replace(/_/g, "-");
    }

    function makeSelectorName(scope, name) {
        const snames = [];
        const names = name.split(/\s*,\s*/);
        const scopes = scope.split(/\s*,\s*/);
        for (let s = 0; s < scopes.length; s++) {
            const currentScope = scopes[s];
            for (let i = 0; i < names.length; i++) {
                const currentName = names[i];
                if (currentName.charAt(0) === "&") {
                    snames.push(currentScope + currentName.substr(1));
                } else {
                    snames.push(currentScope ? currentScope + " " + currentName : currentName);
                }
            }
        }
        return snames.join(", ");
    }

    function addProperty(scope, property, value) {
        property = property.replace(/([a-z]*)([A-Z])([a-z]+)/g, (match, pre, mid, post) => `${pre}-${mid.toLowerCase()}${post}`);

        if (typeof(value) === "number" && !options.useRawValues) {
            value = value + "px";
        }

        const properties = property.split(/\s*,\s*/);
        for (let i = 0; i < properties.length; i++) {
            const currentProperty = makePropertyName(properties[i]);

            if (result[scope][currentProperty]) {
                result[scope][currentProperty].push(value);
            } else {
                result[scope][currentProperty] = [value];
            }
        }
    }

    // --------------


    const result = {};

    jsonToCSS("", jss);

    // output result:
    let ret = "";
    for (const a of Object.keys(result)) {
        const css = result[a];
        ret += a + " {\n";
        for (const i of Object.keys(css)) {
            const values = css[i];    // this is an array !
            for (let j = 0; j < values.length; j++) {
                ret += "\t" + i + ": " + values[j] + ";\n";
            }
        }
        ret += "}\n";
    }
    return ret;
}

const defaults = {
    truncateFirst: false,
    container: null,
    containerName: "injectCSSContainer",
    useRawValues: true
};


(function (jQuery) {
    jQuery.injectCSS = function (jss, options) {
        options = jQuery.extend({}, defaults, options);

        options.media = options.media || "all";

        let container = (options.container && jQuery(options.container)) || jQuery("#" + options.containerName);
        if (!container.length) {
            container = jQuery("<style></style>").appendTo("head").attr({
                media: options.media,
                id: options.containerName,
                type: "text/css"
            });
        }

        let css = "";
        if (!options.truncateFirst) {
            css += container.text();
        }
        css += toCSS(jss, options);

        container.text(css);
        return container;
    };
}(jQuery));
