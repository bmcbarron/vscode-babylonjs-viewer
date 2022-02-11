//@ts-check
("use strict");

// eslint-disable-next-line @typescript-eslint/naming-convention
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

/**@type {import('webpack').Configuration}*/
const config = {
  // vscode extensions run in webworker context for VS Code web
  target: "webworker",
  entry: {
    // The entry point of this extension.
    extension: "./src/extension.ts",
    // The entry point of the webview.
    webview: {
      filename: "webview.js",
      import: "./src/webview.ts",
    },
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  devtool: "source-map",
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
  plugins: [new MiniCssExtractPlugin()],
};
module.exports = config;
