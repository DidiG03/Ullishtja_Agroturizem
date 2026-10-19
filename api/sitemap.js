const BASE = 'https://ullishtja-agroturizem.com';

// Albanian at the root, the other languages under a prefix — the same scheme as
// src/i18n.js (localizedPath) and the files scripts/prerender.js writes.
const LANGUAGES = [
  { code: 'al', hreflang: 'sq', prefix: '' },
  { code: 'en', hreflang: 'en', prefix: '/en' },
  { code: 'it', hreflang: 'it', prefix: '/it' },
];

const PAGES = ['/', '/menu'];

function pageUrl(page, language) {
  if (!language.prefix) return `${BASE}${page}`;
  return page === '/' ? `${BASE}${language.prefix}` : `${BASE}${language.prefix}${page}`;
}

// Every language version lists all of its alternates (and itself), which is what
// search engines expect for hreflang in a sitemap.
function alternates(page) {
  const links = LANGUAGES.map(
    (language) =>
      `\n    <xhtml:link rel="alternate" hreflang="${language.hreflang}" href="${pageUrl(page, language)}" />`
  );
  links.push(
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(page, LANGUAGES[0])}" />`
  );
  return links.join('');
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const urls = PAGES.flatMap((page) =>
    LANGUAGES.map(
      (language) => `
  <url>
    <loc>${pageUrl(page, language)}</loc>${alternates(page)}
  </url>`
    )
  ).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}
</urlset>
`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(sitemap);
}
