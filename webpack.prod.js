const SentryCliPlugin = require("@sentry/webpack-plugin");
const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const manifest = require("./dist/manifest.json");

const plugins = [];

if (["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"].every(key => key in process.env)) {
    if (!("NO_SENTRY_UPLOAD" in process.env)) {
        console.info("uploading source maps to Sentry!");

        const sentryPlugin = new SentryCliPlugin({
            release: `dolos@${manifest.version}`,
            include: "dist/",
        });

        plugins.push(sentryPlugin);
    } else {
        console.info(`Not uploading source maps to Sentry because "NO_SENTRY_UPLOAD" present!`);
    }
} else {
    console.info("Not uploading source maps to Sentry because credentials are missing!");
}

module.exports = merge(common, {
    mode: "production",
    devtool: "source-map",
    plugins
});
