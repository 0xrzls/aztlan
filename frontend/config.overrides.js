const webpack = require('webpack');

module.exports = function override(config, env) {
  // Tambahkan polyfill untuk 'process/browser'
  config.resolve.fallback = {
    ...config.resolve.fallback,
    process: require.resolve('process/browser'),
    stream: require.resolve('stream-browserify'),
    util: require.resolve('util/'),
    buffer: require.resolve('buffer/'),
    path: require.resolve('path-browserify'),
    crypto: require.resolve('crypto-browserify'),
    fs: false,
    os: require.resolve('os-browserify/browser'),
    vm: require.resolve('vm-browserify')
  };

  // Tambahkan plugin webpack untuk menyediakan global process
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  );

  // Memastikan resolusi tidak memerlukan spesifikasi lengkap
  config.resolve.fullySpecified = false;

  return config;
};
