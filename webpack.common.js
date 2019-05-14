const webpack = require("webpack");
const path = require("path");
const glob = require("glob");
// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

// load the config from the file
const secrets = require("./dolos-secrets");

// override with env variables.
for (const key of Object.keys(secrets)) {
    const envKey = `DOLOS_${key.toString().toUpperCase()}`;
    const envValue = process.env[envKey];

    if (envValue) {
        secrets[key] = envValue;
    }
}

const contentScripts = {};

// dynamically detect and load content scripts
const serviceDirs = glob.sync("src/services/*/");
for (const serviceDir of serviceDirs) {
    const name = path.basename(serviceDir);
    contentScripts[`service/${name}`] = path.join(__dirname, serviceDir, "index");
}

module.exports = {
    entry: {
        background: path.join(__dirname, "src/background"),

        options: path.join(__dirname, "src/options/render"),
        popup: path.join(__dirname, "src/popup/render"),

        debug: path.join(__dirname, "src/debug/render"),

        // Content Scripts:
        ...contentScripts,
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.tsx?$/,
                use: "ts-loader",
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: "style-loader",
                    },
                    {
                        loader: "css-loader",
                    },
                    {
                        loader: "sass-loader",
                    },
                ],
            },
        ],
    },
    output: {
        filename: "[name].js",
        path: path.join(__dirname, "dist/js"),
    },
    plugins: [
        new webpack.DefinePlugin({
            WEBPACK_SECRETS: JSON.stringify(secrets),
        }),
        // new BundleAnalyzerPlugin(),
    ],
    resolve: {
        alias: {
            "dolos": path.join(__dirname, "src"),
        },
        extensions: [".ts", ".tsx", ".js"],
    },
    watchOptions: {
        ignored: [
            "node_modules",
            "tools"
        ],
    },
};
