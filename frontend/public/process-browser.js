// Polyfill for process/browser
window.process = {
  browser: true,
  env: {
    NODE_ENV: "development" // atau "production" saat build
  },
  nextTick: function(cb) {
    setTimeout(cb, 0);
  },
  version: '',
  versions: {},
  platform: 'browser'
};
