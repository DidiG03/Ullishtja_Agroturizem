/**
 * Writes a complete static HTML file for every public page in every language,
 * after `react-scripts build`:
 *
 *   build/index.html      /          build/menu.html      /menu
 *   build/en.html         /en        build/en/menu.html   /en/menu
 *   build/it.html         /it        build/it/menu.html   /it/menu
 *   build/404.html        any unknown URL (served with a 404 status)
 *   build/admin-login.html, build/dashboard.html   empty app shells, noindex
 *
 * Each file has the page's own title, description, canonical, hreflang, Open
 * Graph tags and JSON-LD in <head> (from src/seo/seo.js), and the page's real
 * markup inside #root, rendered from the same React components the browser runs.
 * Crawlers that don't execute JavaScript (Bing, social previews, AI assistants)
 * therefore read the full content, and Google gets it without waiting to render.
 * In the browser, React renders over it as before.
 *
 * Run: node scripts/prerender.js   (part of `npm run build`)
 */
// babel-preset-react-app's "test" mode compiles to CommonJS for Node. It emits the
// development JSX runtime, so React has to load its development build to match.
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const { Writable } = require('stream');
const babel = require('@babel/core');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const BUILD = path.join(ROOT, 'build');
const SITE_URL = 'https://ullishtja-agroturizem.com';
const MENU_URL = process.env.PRERENDER_MENU_URL || `${SITE_URL}/api/menu-complete`;

// --- Load the app's source (JSX, ES modules, CSS imports) in Node -------------

// Turns import('./x') into Promise.resolve().then(() => require('./x')) so the
// lazy-loaded sections and translation chunks resolve through the hook below.
function dynamicImportToRequire({ types: t }) {
  return {
    visitor: {
      CallExpression(nodePath) {
        if (nodePath.node.callee.type !== 'Import') return;
        nodePath.replaceWith(
          t.callExpression(
            t.memberExpression(
              t.callExpression(t.memberExpression(t.identifier('Promise'), t.identifier('resolve')), []),
              t.identifier('then')
            ),
            [t.arrowFunctionExpression([], t.callExpression(t.identifier('require'), nodePath.node.arguments))]
          )
        );
      },
    },
  };
}

const loadJs = Module._extensions['.js'];
Module._extensions['.js'] = function compileSource(module, filename) {
  if (!filename.startsWith(SRC + path.sep)) return loadJs(module, filename);
  const { code } = babel.transformFileSync(filename, {
    babelrc: false,
    configFile: false,
    presets: [[require.resolve('babel-preset-react-app'), { runtime: 'automatic' }]],
    plugins: [dynamicImportToRequire],
  });
  return module._compile(code, filename);
};
['.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'].forEach((ext) => {
  Module._extensions[ext] = (module, filename) => {
    module.exports = ext === '.css' ? {} : `/${path.basename(filename)}`;
  };
});

// Components read window/document/localStorage at module level or in state
// initialisers, so give them a browser-like environment.
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: `${SITE_URL}/`,
  pretendToBeVisual: true,
});
const browserGlobals = ['window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'HTMLElement', 'Node'];
browserGlobals.forEach((key) => {
  const value = key === 'window' ? dom.window : dom.window[key];
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
});

// useHashScroll uses useLayoutEffect, which React 18 warns about on the server.
// It only scrolls after navigation, so the warning is noise here.
const consoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('useLayoutEffect does nothing on the server')) return;
  consoleError(...args);
};

// --- Helpers ------------------------------------------------------------------

function renderToHtml(React, element) {
  const { renderToPipeableStream } = require('react-dom/server');
  return new Promise((resolve, reject) => {
    let html = '';
    const sink = new Writable({
      write(chunk, _encoding, callback) {
        html += chunk;
        callback();
      },
      final(callback) {
        resolve(html);
        callback();
      },
    });
    const timer = setTimeout(() => {
      stream.abort();
      reject(new Error('Timed out waiting for lazy components'));
    }, 30000);
    const stream = renderToPipeableStream(element, {
      // Wait for every lazy section, so no Suspense fallback ends up in the HTML.
      onAllReady() {
        clearTimeout(timer);
        stream.pipe(sink);
      },
      onShellError(error) {
        clearTimeout(timer);
        reject(error);
      },
      onError(error) {
        reject(error);
      },
    });
  });
}

// Only the fields MenuPage and the Menu structured data use, to keep the inline
// JSON small.
const CATEGORY_FIELDS = ['id', 'slug', 'nameAL', 'nameEN', 'nameIT', 'descriptionAL', 'descriptionEN', 'descriptionIT'];
const ITEM_FIELDS = [
  'id', 'nameAL', 'nameEN', 'nameIT', 'descriptionAL', 'descriptionEN', 'descriptionIT',
  'ingredientsAL', 'ingredientsEN', 'ingredientsIT', 'price', 'currency',
  'isVegetarian', 'isSpicy', 'isRecommended', 'isKg',
];
const pick = (object, fields) =>
  Object.fromEntries(fields.filter((field) => object[field] != null).map((field) => [field, object[field]]));

async function fetchMenu() {
  try {
    const response = await fetch(MENU_URL, { signal: AbortSignal.timeout(15000) });
    const json = await response.json();
    if (!response.ok || !json.success || !Array.isArray(json.data)) {
      throw new Error(json.error || `HTTP ${response.status}`);
    }
    return json.data.map((category) => ({
      ...pick(category, CATEGORY_FIELDS),
      menuItems: (category.menuItems || []).map((item) => pick(item, ITEM_FIELDS)),
    }));
  } catch (error) {
    // Not fatal: the menu pages are still written, and load the dishes in the browser.
    console.warn(`[prerender] menu not embedded (${MENU_URL}): ${error.message}`);
    return null;
  }
}

const inlineJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

// The production index.html is minified (comments stripped), so the per-page
// block is anchored on <title>: it is replaced by the full generated head block.
function fillTemplate(template, { seoHtml, htmlLang, rootHtml = '', bodyScript = '', heroPreloads = true }) {
  const titles = template.match(/<title>[^<]*<\/title>/g) || [];
  if (titles.length !== 1) throw new Error(`expected one <title> in index.html, found ${titles.length}`);
  if (!template.includes('<div id="root"></div>')) throw new Error('<div id="root"></div> missing from index.html');

  // index.html preloads the hero poster, which only the homepage shows.
  const page = heroPreloads ? template : template.replace(/<link[^>]*hero-poster[^>]*>/g, '');

  return page
    .replace(titles[0], () => seoHtml)
    .replace(/<html lang="[^"]*">/, `<html lang="${htmlLang}">`)
    .replace('<div id="root"></div>', () => `<div id="root">${rootHtml}</div>${bodyScript}`);
}

function writeFile(relativePath, html) {
  const file = path.join(BUILD, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log(`[prerender] ${relativePath} (${Math.round(html.length / 1024)} KB)`);
}

// --- Main -----------------------------------------------------------------------

async function main() {
  const templatePath = path.join(BUILD, 'index.html');
  if (!fs.existsSync(templatePath)) throw new Error('build/index.html not found — run react-scripts build first');
  const template = fs.readFileSync(templatePath, 'utf8');

  const React = require('react');
  const { StaticRouter } = require('react-router-dom');
  const { SUPPORTED_LANGUAGES, loadTranslations, localizedPath } = require(path.join(SRC, 'i18n.js'));
  const { buildSeo, renderSeoHtml } = require(path.join(SRC, 'seo/seo.js'));
  const { AppShell } = require(path.join(SRC, 'AppRouter.js'));

  const translations = {};
  for (const lang of SUPPORTED_LANGUAGES) {
    translations[lang] = await loadTranslations(lang);
  }
  const menu = await fetchMenu();

  const pages = [];
  for (const lang of SUPPORTED_LANGUAGES) {
    pages.push({ page: 'home', lang, route: localizedPath('/', lang), file: lang === 'al' ? 'index.html' : `${lang}.html` });
    pages.push({ page: 'menu', lang, route: localizedPath('/menu', lang), file: lang === 'al' ? 'menu.html' : `${lang}/menu.html` });
  }
  pages.push({ page: 'notFound', lang: 'al', route: '/404', file: '404.html' });

  for (const { page, lang, route, file } of pages) {
    dom.reconfigure({ url: `${SITE_URL}${route}` });
    window.__MENU_DATA__ = page === 'menu' && menu ? menu : undefined;

    const rootHtml = await renderToHtml(
      React,
      React.createElement(StaticRouter, { location: route }, React.createElement(AppShell))
    );
    const seo = buildSeo({ page, lang, t: translations[lang], menuCategories: page === 'menu' ? menu : null });

    writeFile(
      file,
      fillTemplate(template, {
        seoHtml: renderSeoHtml(seo),
        htmlLang: seo.htmlLang,
        rootHtml,
        bodyScript: page === 'menu' && menu ? `<script>window.__MENU_DATA__=${inlineJson(menu)}</script>` : '',
        heroPreloads: page === 'home',
      })
    );
  }

  // Admin pages: the plain app shell, kept out of search results.
  const shellSeo = renderSeoHtml({
    title: 'Admin – Ullishtja Agroturizem',
    tags: [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' } }],
  });
  ['admin-login.html', 'dashboard.html'].forEach((file) =>
    writeFile(file, fillTemplate(template, { seoHtml: shellSeo, htmlLang: 'sq', heroPreloads: false }))
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    // Fail the build: without these files /menu, /en and /it would 404.
    console.error('[prerender] failed:', error);
    process.exit(1);
  });
