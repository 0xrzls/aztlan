const webpack = require('webpack');

module.exports = {
  // Other webpack configs from react-scripts
  webpack: {
    configure: {
      resolve: {
        fallback: {
          crypto: require.resolve('crypto-browserify'),
          stream: require.resolve('stream-browserify'),
          assert: require.resolve('assert'),
          util: require.resolve('util/'),
          path: require.resolve('path-browserify'),
          tty: require.resolve('tty-browserify'),
          process: require.resolve('process/browser'),
          buffer: require.resolve('buffer/'),
        },
      },
      plugins: [
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
      ],
    },
  },
};
