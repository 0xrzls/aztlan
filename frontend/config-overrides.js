// file: config-overrides.js
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Tambahkan resolve fallback untuk process
  config.resolve = {
    ...config.resolve,
    fallback: {
      ...config.resolve.fallback,
      "process/browser": require.resolve("process/browser")
    }
  };
  
  // Tambahkan plugin untuk menyediakan process secara global
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process'
    })
  ];
  
  // Disable fully specified untuk ESM modules
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false
    }
  });
  
  return config;
}
