const webpack = require('webpack');

module.exports = function override(config) {
  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "util": require.resolve("util"),
    "buffer": require.resolve("buffer"),
    "process": require.resolve("process/browser"),
    "path": require.resolve("path-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "url": require.resolve("url"),
    "https": require.resolve("https-browserify"),
    "http": require.resolve("stream-http"),
    "vm": require.resolve("vm-browserify"),
    "zlib": require.resolve("browserify-zlib"),
    "tty": require.resolve("tty-browserify"),
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
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
  ];

  // Handle .wasm files
  config.experiments = {
    ...config.experiments,
    asyncWebAssembly: true,
  };

  // Increase memory limit for large bundles
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        aztec: {
          test: /[\\/]node_modules[\\/]@aztec[\\/]/,
          name: 'aztec',
          chunks: 'all',
        },
      },
    },
  };

  return config;
};
