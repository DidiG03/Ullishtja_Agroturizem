const { createProxyMiddleware } = require('http-proxy-middleware');

const apiTarget = process.env.REACT_APP_API_URL || 'http://localhost:3001';

module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
    })
  );
};
