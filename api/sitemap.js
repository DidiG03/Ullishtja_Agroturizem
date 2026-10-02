const BASE = 'https://ullishtja-agroturizem.com';

function homeUrl(lang) {
  return lang === 'al' ? `${BASE}/` : `${BASE}/?lang=${lang}`;
}

function menuUrl(lang) {
  return lang === 'al' ? `${BASE}/menu` : `${BASE}/menu?lang=${lang}`;
}

function hreflangLinks(urlFactory) {
  return `
    <xhtml:link rel="alternate" hreflang="sq" href="${urlFactory('al')}" />
    <xhtml:link rel="alternate" hreflang="en" href="${urlFactory('en')}" />
    <xhtml:link rel="alternate" hreflang="it" href="${urlFactory('it')}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFactory('al')}" />`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    let urls = `
  <url>
    <loc>${BASE}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>${hreflangLinks(homeUrl)}
  </url>
  <url>
    <loc>${BASE}/?lang=en</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>${hreflangLinks(homeUrl)}
  </url>
  <url>
    <loc>${BASE}/?lang=it</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>${hreflangLinks(homeUrl)}
  </url>
  <url>
    <loc>${BASE}/menu</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>${hreflangLinks(menuUrl)}
  </url>
  <url>
    <loc>${BASE}/menu?lang=en</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${hreflangLinks(menuUrl)}
  </url>
  <url>
    <loc>${BASE}/menu?lang=it</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${hreflangLinks(menuUrl)}
  </url>`;

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate sitemap',
      details: error.message,
    });
  }
}