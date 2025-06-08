const webpack = require('webpack');

module.exports = function override(config) {
  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "util": require.resolve("util"),
    "buffer": require.resolve("buffer"),
    "process": require.resolve("process/browser.js"),
    "path": require.resolve("path-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "url": require.resolve("url"),
    "https": require.resolve("https-browserify"),
    "http": require.resolve("stream-http"),
    "zlib": require.resolve("browserify-zlib"),
    "assert": require.resolve("assert"),
    "tty": require.resolve("tty-browserify"),
    "vm": require.resolve("vm-browserify"),
    "fs": false,
    "net": false,
    "tls": false,
    "child_process": false,
  };

  // Add plugins
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.browser': true,
    }),
  ];

  // Handle .wasm files
  config.experiments = {
    ...config.experiments,
    asyncWebAssembly: true,
  };

  // Ignore webpack warnings
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Cannot read properties of undefined/,
  ];

  // Fix module resolution
  config.resolve.fullySpecified = false;

  return config;
};
