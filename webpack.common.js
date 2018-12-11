const path = require("path");

module.exports = {
    entry: {
        popup: path.join(__dirname, "src/popup/index.tsx"),
        options: path.join(__dirname, "src/options/index.tsx"),
        background: path.join(__dirname, "src/background.ts"),
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
        extensions: [".ts", ".tsx", ".js"]
    }
};
