const SentryCliPlugin = require("@sentry/webpack-plugin");
const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const manifest = require("./dist/manifest.json");

const plugins = [];

if (["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"].every(key => key in process.env)) {
    plugins.push(
        new SentryCliPlugin({
            release: `dolos@${manifest.version}`,
            include: ".",
            ignore: ["node_modules", "webpack.common.js", "webpack.dev.js", "webpack.prod.js",],
        }));
    console.info("uploading source maps to Sentry!");
} else {
    console.info("Not uploading source maps to Sentry!");
}

module.exports = merge(common, {
    mode: "production",
    devtool: "source-map",
    plugins
});