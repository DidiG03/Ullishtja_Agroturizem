/**
 * Mounts Vercel serverless handlers on Express for local development.
 * Production uses /api/* on Vercel; locally the same handlers run on port 3001.
 */

const path = require('path');
const { pathToFileURL } = require('url');

/** @type {[string, string][]} route segment -> api file (relative to /api) */
const API_ROUTES = [
  ['menu-complete', 'menu-complete.js'],
  ['reservations-complete', 'reservations-complete.js'],
  ['reservations', 'reservations-complete.js'],
  ['blog', 'blog.js'],
  ['google-reviews', 'google-reviews.js'],
  ['health', 'health.js'],
  ['pos', 'pos.js'],
  ['sitemap', 'sitemap.js'],
  ['pos-menu', 'pos.js'],
];

const handlerCache = new Map();

async function loadHandler(apiFile) {
  if (handlerCache.has(apiFile)) {
    return handlerCache.get(apiFile);
  }
  const fullPath = path.join(__dirname, '..', 'api', apiFile);
  const module = await import(pathToFileURL(fullPath).href);
  if (typeof module.default !== 'function') {
    throw new Error(`API module ${apiFile} has no default export handler`);
  }
  handlerCache.set(apiFile, module.default);
  return module.default;
}

function mountApiRoute(app, routePath, apiFile) {
  app.all(routePath, async (req, res, next) => {
    try {
      const handler = await loadHandler(apiFile);
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  });
}

async function registerVercelApiRoutes(app) {
  for (const [routeName, apiFile] of API_ROUTES) {
    mountApiRoute(app, `/api/${routeName}`, apiFile);
  }
  mountApiRoute(app, '/api/blog/upload', 'blog/upload.js');

  console.log('📡 Local API routes mounted (same handlers as Vercel /api/*)');
}

module.exports = { registerVercelApiRoutes };
