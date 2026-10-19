// Single source for everything search engines and social previews read from the
// <head>: titles, descriptions, canonical/hreflang links, Open Graph tags and the
// JSON-LD graph. SEOHead applies it in the browser; scripts/prerender.js writes the
// same tags into the static HTML at build time, so crawlers that never run
// JavaScript see the same thing as Google.
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, localizedPath } from '../i18n';

export const SITE_URL = 'https://ullishtja-agroturizem.com';

// Name, address and phone must match the Google Business Profile word for word —
// local rankings depend on these being consistent everywhere they appear.
export const BUSINESS = {
  name: 'Ullishtja Agroturizem',
  alternateNames: ['Ullishtja Agroturizëm', 'Ullishtja'],
  telephone: '+355684090405',
  email: 'hi@ullishtja-agroturizem.com',
  streetAddress: 'Rruga Syri i Detit, Rruga 2 Batot, Spitalle',
  postalCode: '2001',
  locality: 'Durrës',
  region: 'Durrës County',
  country: 'AL',
  latitude: 41.340278,
  longitude: 19.433569,
  mapsUrl: 'https://maps.google.com/?q=41.340278,19.433569+(Ullishtja+Agroturizem)',
  opens: '11:00',
  closes: '22:00',
  foundingDate: '2021',
  logo: { url: `${SITE_URL}/images/ullishtja_logo.jpeg`, width: 254, height: 199 },
  // The business's other profiles. They tie this site to them as one business in
  // Google's eyes — add TripAdvisor or similar here when there is one.
  sameAs: [
    'https://www.instagram.com/ullishtja.agroturizem/',
    'https://www.facebook.com/ullishtja.agroturizem/',
  ],
};

const SHARE_IMAGE = {
  url: `${SITE_URL}/images/og-image.jpg`,
  width: 1200,
  height: 630,
};

const LOCALES = {
  al: { hreflang: 'sq', og: 'sq_AL' },
  en: { hreflang: 'en', og: 'en_US' },
  it: { hreflang: 'it', og: 'it_IT' },
};

// Titles stay under ~60 characters and descriptions under ~160 so search results
// show them in full.
const COPY = {
  home: {
    al: {
      title: 'Ullishtja Agroturizem – Restorant Tradicional Shqiptar në Durrës',
      description:
        'Restorant tradicional shqiptar në Durrës, mes ullinjve. Gatime nga ferma në tavolinë, receta familjare dhe ambient për evente. Hapur çdo ditë 11:00–22:00.',
      imageAlt: 'Hyrja e Ullishtja Agroturizem në Durrës, me kopshtin dhe tabelën e restorantit',
    },
    en: {
      title: 'Ullishtja Agroturizem – Traditional Albanian Restaurant, Durrës',
      description:
        'Traditional Albanian restaurant in Durrës, set among olive trees. Farm-to-table dishes, family recipes and space for events. Open daily 11:00–22:00.',
      imageAlt: 'The garden entrance and sign of Ullishtja Agroturizem in Durrës, Albania',
    },
    it: {
      title: 'Ullishtja Agroturizem – Agriturismo e Ristorante a Durazzo',
      description:
        'Ristorante tradizionale albanese a Durazzo, tra gli ulivi. Piatti dalla fattoria, ricette di famiglia e spazi per eventi. Aperto tutti i giorni 11:00–22:00.',
      imageAlt: "L'ingresso con giardino e insegna di Ullishtja Agroturizem a Durazzo, Albania",
    },
  },
  menu: {
    al: {
      title: 'Menuja dhe Çmimet – Ullishtja Agroturizem, Durrës',
      description:
        'Menuja e plotë me çmime: sallata, antipasta shtëpie, gatime me mish, peshk në skarë, pica dhe ëmbëlsira tradicionale në Ullishtja Agroturizem, Durrës.',
      name: 'Menuja',
    },
    en: {
      title: 'Menu & Prices – Ullishtja Agroturizem, Durrës',
      description:
        'Full menu with prices: salads, homemade antipasti, meat dishes, grilled fish, pizza and traditional desserts at Ullishtja Agroturizem in Durrës, Albania.',
      name: 'Menu',
    },
    it: {
      title: 'Menù e Prezzi – Ullishtja Agroturizem, Durazzo',
      description:
        'Menù completo con prezzi: insalate, antipasti della casa, carne, pesce alla griglia, pizza e dolci tradizionali da Ullishtja Agroturizem a Durazzo.',
      name: 'Menù',
    },
  },
  notFound: {
    al: { title: 'Faqja nuk u gjet – Ullishtja Agroturizem', description: 'Kjo faqe nuk ekziston.' },
    en: { title: 'Page not found – Ullishtja Agroturizem', description: 'This page does not exist.' },
    it: { title: 'Pagina non trovata – Ullishtja Agroturizem', description: 'Questa pagina non esiste.' },
  },
};

// The public pages that exist in every language, by their Albanian path.
export const PAGE_PATHS = { home: '/', menu: '/menu' };

export const absoluteUrl = (path) => `${SITE_URL}${path}`;

export function canonicalUrl(page, lang) {
  return absoluteUrl(localizedPath(PAGE_PATHS[page], lang));
}

const localizedField = (item, field, lang) => {
  const suffix = lang === 'en' ? 'EN' : lang === 'it' ? 'IT' : 'AL';
  return item[`${field}${suffix}`] || item[`${field}AL`] || '';
};

function restaurantNode(lang) {
  return {
    '@type': 'Restaurant',
    '@id': `${SITE_URL}/#restaurant`,
    name: BUSINESS.name,
    alternateName: BUSINESS.alternateNames,
    description: COPY.home[lang].description,
    url: canonicalUrl('home', lang),
    image: [
      SHARE_IMAGE.url,
      absoluteUrl('/images/posters/alacarte-poster-1280.jpg'),
      absoluteUrl('/images/posters/events-poster-1280.jpg'),
    ],
    logo: { '@type': 'ImageObject', ...BUSINESS.logo },
    telephone: BUSINESS.telephone,
    email: BUSINESS.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.streetAddress,
      postalCode: BUSINESS.postalCode,
      addressLocality: BUSINESS.locality,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS.latitude,
      longitude: BUSINESS.longitude,
    },
    hasMap: BUSINESS.mapsUrl,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: BUSINESS.opens,
        closes: BUSINESS.closes,
      },
    ],
    servesCuisine: ['Albanian', 'Mediterranean'],
    priceRange: '$$',
    currenciesAccepted: 'ALL, EUR',
    paymentAccepted: 'Cash, Credit Card',
    acceptsReservations: true,
    hasMenu: canonicalUrl('menu', lang),
    foundingDate: BUSINESS.foundingDate,
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Free parking', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Outdoor garden seating', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Private events', value: true },
    ],
    sameAs: BUSINESS.sameAs,
  };
}

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: BUSINESS.name,
    alternateName: BUSINESS.alternateNames,
    inLanguage: SUPPORTED_LANGUAGES.map((lang) => LOCALES[lang].hreflang),
    publisher: { '@id': `${SITE_URL}/#restaurant` },
  };
}

function menuNode(lang, url, categories) {
  const sections = (categories || [])
    .filter((category) => Array.isArray(category.menuItems) && category.menuItems.length > 0)
    .map((category) => ({
      '@type': 'MenuSection',
      name: localizedField(category, 'name', lang),
      ...(localizedField(category, 'description', lang)
        ? { description: localizedField(category, 'description', lang) }
        : {}),
      hasMenuItem: category.menuItems.map((item) => {
        const description = localizedField(item, 'description', lang);
        const price = Number(item.price);
        return {
          '@type': 'MenuItem',
          name: localizedField(item, 'name', lang),
          ...(description ? { description } : {}),
          ...(item.isVegetarian ? { suitableForDiet: 'https://schema.org/VegetarianDiet' } : {}),
          ...(Number.isFinite(price) && price > 0
            ? {
                offers: {
                  '@type': 'Offer',
                  price,
                  priceCurrency: item.currency || 'ALL',
                  ...(item.isKg
                    ? {
                        priceSpecification: {
                          '@type': 'UnitPriceSpecification',
                          price,
                          priceCurrency: item.currency || 'ALL',
                          unitCode: 'KGM',
                        },
                      }
                    : {}),
                },
              }
            : {}),
        };
      }),
    }));

  return {
    '@type': 'Menu',
    '@id': `${url}#menu`,
    name: `${COPY.menu[lang].name} – ${BUSINESS.name}`,
    url,
    inLanguage: LOCALES[lang].hreflang,
    ...(sections.length ? { hasMenuSection: sections } : {}),
  };
}

function structuredData({ page, lang, url, title, description, faqItems, menuCategories }) {
  const webPage = {
    '@type': page === 'home' && faqItems?.length ? ['WebPage', 'FAQPage'] : 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: LOCALES[lang].hreflang,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#restaurant` },
    primaryImageOfPage: { '@type': 'ImageObject', ...SHARE_IMAGE },
  };

  const graph = [restaurantNode(lang), websiteNode(), webPage];

  if (page === 'home' && faqItems?.length) {
    webPage.mainEntity = faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    }));
  }

  if (page === 'menu') {
    webPage.mainEntity = { '@id': `${url}#menu` };
    webPage.breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: BUSINESS.name, item: canonicalUrl('home', lang) },
        { '@type': 'ListItem', position: 2, name: COPY.menu[lang].name, item: url },
      ],
    };
    graph.push(menuNode(lang, url, menuCategories));
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

const meta = (key, value, content) => ({ tag: 'meta', attrs: { [key]: value, content } });

/**
 * Everything the <head> needs for one page in one language.
 * Returns { title, htmlLang, tags } where tags is a list of { tag, attrs, text }.
 */
export function buildSeo({ page = 'home', lang = DEFAULT_LANGUAGE, t, menuCategories } = {}) {
  const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  const copy = (COPY[page] || COPY.home)[language];
  const htmlLang = LOCALES[language].hreflang;

  if (page === 'notFound') {
    return {
      title: copy.title,
      htmlLang,
      tags: [meta('name', 'description', copy.description), meta('name', 'robots', 'noindex, follow')],
    };
  }

  const url = canonicalUrl(page, language);
  const imageAlt = COPY.home[language].imageAlt;

  const tags = [
    meta('name', 'description', copy.description),
    meta('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'),
    { tag: 'link', attrs: { rel: 'canonical', href: url } },
    ...SUPPORTED_LANGUAGES.map((alt) => ({
      tag: 'link',
      attrs: { rel: 'alternate', hreflang: LOCALES[alt].hreflang, href: canonicalUrl(page, alt) },
    })),
    {
      tag: 'link',
      attrs: { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl(page, DEFAULT_LANGUAGE) },
    },
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', BUSINESS.name),
    meta('property', 'og:title', copy.title),
    meta('property', 'og:description', copy.description),
    meta('property', 'og:url', url),
    meta('property', 'og:image', SHARE_IMAGE.url),
    meta('property', 'og:image:width', String(SHARE_IMAGE.width)),
    meta('property', 'og:image:height', String(SHARE_IMAGE.height)),
    meta('property', 'og:image:alt', imageAlt),
    meta('property', 'og:locale', LOCALES[language].og),
    ...SUPPORTED_LANGUAGES.filter((alt) => alt !== language).map((alt) =>
      meta('property', 'og:locale:alternate', LOCALES[alt].og)
    ),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', copy.title),
    meta('name', 'twitter:description', copy.description),
    meta('name', 'twitter:image', SHARE_IMAGE.url),
    meta('name', 'twitter:image:alt', imageAlt),
    {
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      text: JSON.stringify(
        structuredData({
          page,
          lang: language,
          url,
          title: copy.title,
          description: copy.description,
          faqItems: t?.faq?.items,
          menuCategories,
        })
      ),
    },
  ];

  return { title: copy.title, htmlLang, tags };
}

const escapeAttr = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escapeText = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Serialises buildSeo() output for the static HTML. `data-seo` marks the tags
// SEOHead replaces when the page changes language or route in the browser.
export function renderSeoHtml({ title, tags }) {
  const lines = [`<title>${escapeText(title)}</title>`];
  tags.forEach(({ tag, attrs, text }) => {
    const attrString = Object.entries(attrs)
      .map(([key, value]) => `${key}="${escapeAttr(value)}"`)
      .join(' ');
    if (tag === 'script') {
      // JSON can't be HTML-escaped; "<" is escaped as \u003c so "</script>" inside
      // a value can't close the tag.
      lines.push(`<script ${attrString} data-seo>${text.replace(/</g, '\\u003c')}</script>`);
    } else {
      lines.push(`<${tag} ${attrString} data-seo>`);
    }
  });
  return lines.join('\n    ');
}
