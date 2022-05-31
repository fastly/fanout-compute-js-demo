const path = require("path");
const webpack = require("webpack");
const { ProvidePlugin } = webpack;

console.log(path.resolve(__dirname, "./build/shims/process"));
module.exports = {
  entry: "./build/index.js",
  optimization: {
    minimize: false
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
    ],
  },
  plugins: [
    // Polyfills go here.
    // Used for, e.g., any cross-platform WHATWG, 
    // or core nodejs modules needed for your application.
    new ProvidePlugin({
      process: "process",
    })
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
