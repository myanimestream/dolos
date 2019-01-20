const path = require("path");

module.exports = {
    entry: {
        popup: path.join(__dirname, "src/popup/index.tsx"),
        options: path.join(__dirname, "src/options/index.tsx"),
        background: path.join(__dirname, "src/background/index.ts"),
        // Content Scripts:
        kitsu: path.join(__dirname, "src/kitsu/index.ts"),
        myanimelist: path.join(__dirname, "src/myanimelist/index.ts"),
    },
    output: {
        path: path.join(__dirname, "dist/js"),
        filename: "[name].js"
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.tsx?$/,
                use: "ts-loader"
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: "style-loader"
                    },
                    {
                        loader: "css-loader"
                    },
                    {
                        loader: "sass-loader"
                    }
                ]
            }
        ]
    },
    resolve: {
        alias: {
            "dolos": path.join(__dirname, "src"),
        },
        extensions: [".ts", ".tsx", ".js"]
    }
};
