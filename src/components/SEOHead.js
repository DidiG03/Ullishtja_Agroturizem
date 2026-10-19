import { useEffect } from 'react';
import { buildSeo } from '../seo/seo';

/**
 * Keeps <title>, meta tags, canonical/hreflang links and JSON-LD in sync with the
 * page and language shown. The static HTML already carries the same tags (written
 * by scripts/prerender.js); this replaces them after client-side navigation.
 *
 * page: 'home' | 'menu' | 'notFound'
 * t: translations, used for the FAQ structured data on the home page
 * menuCategories: menu data, used for the Menu structured data on the menu page
 */
const SEOHead = ({ language, page = 'home', t = null, menuCategories = null }) => {
  useEffect(() => {
    const { title, htmlLang, tags } = buildSeo({ page, lang: language, t, menuCategories });

    document.title = title;
    document.documentElement.lang = htmlLang;

    document.head.querySelectorAll('[data-seo]').forEach((el) => el.remove());
    const fragment = document.createDocumentFragment();
    tags.forEach(({ tag, attrs, text }) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
      el.setAttribute('data-seo', '');
      if (text) el.textContent = text;
      fragment.appendChild(el);
    });
    document.head.appendChild(fragment);
  }, [page, language, t, menuCategories]);

  return null;
};

export default SEOHead;
