//@ts-check
("use strict");

// eslint-disable-next-line @typescript-eslint/naming-convention
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// eslint-disable-next-line @typescript-eslint/naming-convention
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

/**@type {import('webpack').Configuration}*/
const config = {
  // vscode extensions run in webworker context for VS Code web
  target: "webworker",
  entry: {
    // The entry point of this extension.
    extension: {
      import: "./src/extension.ts",
      library: {
        type: "commonjs2",
      },
    },
    // The entry point of the asset viewer webview.
    wvViewer: {
      import: "./src/wvViewer.ts",
      library: {
        name: "AssetViewer",
        type: "var",
      },
    },
    // The entry point of the asset digest webview.
    wvDigest: {
      import: "./src/wvDigest.ts",
      library: {
        name: "AssetDigest",
        type: "var",
      },
    },
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  devtool: "inline-source-map",
  externals: {
    // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot
    // be webpack'ed
    vscode: "commonjs vscode",
  },
  resolve: {
    // look for `browser` entry point in imported node modules
    mainFields: ["browser", "module", "main"],
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      // provides alternate implementation for node module and source files
    },
    fallback: {
      // Webpack 5 no longer polyfills Node.js core modules automatically.
      // see https://webpack.js.org/configuration/resolve/#resolvefallback
      // for the list of Node.js core module polyfills.
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [{ loader: "ts-loader" }],
      },
      {
        // Combine .ts => .js source maps with webpack source maps.
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
      {
        test: /\.s?css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
      {
        test: /\.svg$/,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin({ patterns: [{ from: "static" }] }),
  ],
};
module.exports = config;
