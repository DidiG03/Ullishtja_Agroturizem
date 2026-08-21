const { createProxyMiddleware } = require('http-proxy-middleware');

const apiTarget = process.env.REACT_APP_API_URL || 'http://localhost:3001';

module.exports = function setupProxy(app) {
  const proxyOptions = {
    target: apiTarget,
    changeOrigin: true,
    timeout: 15 * 60 * 1000,
    proxyTimeout: 15 * 60 * 1000,
  };

  app.use('/api', createProxyMiddleware(proxyOptions));
  app.use('/videos/creators', createProxyMiddleware(proxyOptions));
};
