const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const { DefinePlugin, webpack, NormalModuleReplacementPlugin } = require("webpack");
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const proxyHost = process.env.PROXY_HOST || "http://localhost:3001";

module.exports = {
    mode: process.env.MODE ?? "development",

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    entry: {
        main: "./src/main/index.tsx",
        quest: "./src/quest/index.tsx",
        "editor-worker": {
            import: "monaco-editor/esm/vs/editor/editor.worker.js",
            filename: "editor.worker.bundle.js",
        }
    },

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".scss", ".css"],
        fallback: {
            "assert": require.resolve("assert")
        }
    },

    devServer: {
        host: "0.0.0.0",
        allowedHosts: [".localhost", "localhost"],
        port: "7000",
        hot: true,
        historyApiFallback: true,
        proxy: {
            "/env.js": proxyHost,
            "/api": proxyHost,
            "/ws-api": {
                "target":proxyHost,
                "ws": true
            },
            "/module": {
                "target":proxyHost,
            }
        },
    },

    output: {
        publicPath: process.env.MODE === "production" ? "/assets/" : "/",
    },

    module: {
        rules: [{
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [{
                    loader: "ts-loader"
                }]
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ]
            },
            {
                test: /\.css$/i,
                use: [
                    'style-loader',
                    'css-loader',
                ]
            }
        ]
    },
    ignoreWarnings: [/Failed to parse source map/],
    plugins: [
        new NormalModuleReplacementPlugin(/power-assert/, "assert"),
        new HtmlWebpackPlugin({
            chunks: ["main"],
            template: path.resolve(__dirname, "./index.html"),
            filename: "index.html"
        }),
        new HtmlWebpackPlugin({
            chunks: ["quest"],
            template: path.resolve(__dirname, "./index.html"),
            filename: "quest.html"
        }),
        new MonacoWebpackPlugin({
            languages: ["javascript", "typescript", "python"]
        })
    ],

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
};