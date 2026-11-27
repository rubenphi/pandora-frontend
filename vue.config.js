const webpack = require("webpack");

module.exports = {
  publicPath: "/",
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        "process.env.DEMO_DATE": JSON.stringify(
          process.env.DEMO_DATE || process.env.VUE_APP_DEMO_DATE || ""
        ),
      }),
    ],
    resolve: {
      fallback: {
        fs: false,
        path: false,
        crypto: false,
        stream: require.resolve("stream-browserify"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        zlib: require.resolve("browserify-zlib"),
        assert: require.resolve("assert/"),
        encoding: require.resolve("encoding"),
      },
    },
    devServer: {
      allowedHosts: "all",
      client: {
        webSocketURL: "auto://0.0.0.0:0/ws",
      },
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
  },
};