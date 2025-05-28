// config-overrides.js
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add resolve fallbacks for Node.js core modules
  config.resolve = {
    ...config.resolve,
    fallback: {
      ...config.resolve.fallback,
      "process": require.resolve("process/browser"),
      "stream": require.resolve("stream-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "path": require.resolve("path-browserify"),
      "fs": false, // fs cannot be polyfilled in browser
      "tty": require.resolve("tty-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "buffer": require.resolve("buffer"),
      "util": require.resolve("util"),
      "assert": require.resolve("assert"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "url": require.resolve("url"),
      "zlib": require.resolve("browserify-zlib"),
      "vm": require.resolve("vm-browserify")
    }
  };
  
  // Add plugins to provide globals
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_DEBUG': JSON.stringify(false),
      'process.browser': JSON.stringify(true)
    })
  ];
  
  // Disable fully specified for ESM modules
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false
    }
  });

  // Add babel plugin for import assertions
  config.module.rules = config.module.rules.map(rule => {
    if (rule.oneOf) {
      rule.oneOf = rule.oneOf.map(loader => {
        if (loader.loader && loader.loader.includes('babel-loader')) {
          if (!loader.options) loader.options = {};
          if (!loader.options.plugins) loader.options.plugins = [];
          loader.options.plugins.push(
            ['@babel/plugin-syntax-import-assertions', { deprecatedAssertSyntax: true }]
          );
        }
        return loader;
      });
    }
    return rule;
  });
  
  // Ignore certain warnings
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Critical dependency/
  ];
  
  return config;
};
