// Minimal process polyfill untuk React Router
window.process = window.process || {};
window.process.env = window.process.env || {};
window.process.browser = true;
