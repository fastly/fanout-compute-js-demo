const path = require("path");
const webpack = require("webpack");
const { ProvidePlugin } = webpack;

const StringReplaceWebpackPlugin = require("string-replace-webpack-plugin");

console.log(path.resolve(__dirname, "./build/shims/process"));
module.exports = {
  entry: "./build/index.js",
  optimization: {
    minimize: true,
  },
  target: "webworker",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "bin"),
    libraryTarget: "this",
  },
  module: {
    // Asset modules are modules that allow the use asset files (fonts, icons, etc) 
    // without additional configuration or dependencies.
    rules: [
      // asset/source exports the source code of the asset. 
      // Usage: e.g., import notFoundPage from "./page_404.html"
      {
        test: /\.(txt|html)/,
        type: "asset/source",
      },
      {
        test: /urlpattern\.(c)?js/,
        use: [
          StringReplaceWebpackPlugin.replace({
            replacements: [
              {
                pattern: /\/\[\$_\\p\{ID_Start}]\/u/g,
                replacement: (match, p1, offset, string) => {
                  return '/[$_A-Za-z]/u';
                },
              },
              {
                pattern: /\/\[\$_\\u200C\\u200D\\p\{ID_Continue}]\/u/g,
                replacement: (match, p1, offset, string) => {
                  return '/[$_\\u200C\\u200DA-Za-z0-9]/u';
                },
              },
            ]
          }),
        ],
      }
    ]
  },
  plugins: [
    // Polyfills go here.
    // Used for, e.g., any cross-platform WHATWG, 
    // or core nodejs modules needed for your application.
    new ProvidePlugin({
      process: "process",
      Buffer: [ "buffer", "Buffer" ],
    }),
    new StringReplaceWebpackPlugin(),
  ],
  resolve: {
    mainFields: [ 'browser', 'main' ],
    fallback: {
      "buffer": require.resolve("buffer/"),
      "crypto": require.resolve("crypto-browserify"),
      "process": require.resolve("process/browser"),
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util/"),
    }
  }
};
