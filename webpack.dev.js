const merge = require("webpack-merge");
const common = require("./webpack.common.js");

common.module.rules[0].use.options.transpileOnly = true;

module.exports = merge(common, {
    devtool: "inline-source-map",
    mode: "development",
    output: {
        pathinfo: false,
    },
    stats: {
        // suppress "export not found" warnings about re-exported types
        warningsFilter: /export .* was not found in/,
    },
});
