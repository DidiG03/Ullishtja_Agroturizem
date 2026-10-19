// Albanian is the default language, so it ships in the main bundle; English and
// Italian are separate chunks that load only for visitors who need them.
import { useEffect, useState } from 'react';
import al from './translations/al';

export const SUPPORTED_LANGUAGES = ['al', 'en', 'it'];
export const DEFAULT_LANGUAGE = 'al';

// Each language lives at its own path: Albanian at the root (/, /menu) and the
// others under a prefix (/en, /en/menu). Separate URLs per language are what
// search engines need to index and rank each translation on its own.
export function languageFromPath(pathname = '/') {
  const prefix = pathname.split('/')[1];
  return prefix !== DEFAULT_LANGUAGE && SUPPORTED_LANGUAGES.includes(prefix)
    ? prefix
    : DEFAULT_LANGUAGE;
}

// '/en/menu' -> '/menu', '/it' -> '/'
export function stripLanguagePrefix(pathname = '/') {
  const lang = languageFromPath(pathname);
  if (lang === DEFAULT_LANGUAGE) return pathname || '/';
  return pathname.slice(lang.length + 1) || '/';
}

// The pages that exist in every language, by their Albanian path.
export const LOCALIZED_PAGES = ['/', '/menu'];

// Where the language switcher goes: the same page in the other language, or that
// language's homepage when the current URL isn't a real page (the 404 page).
export function languageSwitchPath(pathname, lang) {
  const page = stripLanguagePrefix(pathname);
  return localizedPath(LOCALIZED_PAGES.includes(page) ? page : '/', lang);
}

// ('/menu', 'en') -> '/en/menu', ('/', 'it') -> '/it', ('/menu', 'al') -> '/menu'
export function localizedPath(path, lang) {
  if (lang === DEFAULT_LANGUAGE || !SUPPORTED_LANGUAGES.includes(lang)) return path;
  return path === '/' ? `/${lang}` : `/${lang}${path}`;
}

const loaded = { al };
const loaders = {
  en: () => import(/* webpackChunkName: "lang-en" */ './translations/en'),
  it: () => import(/* webpackChunkName: "lang-it" */ './translations/it'),
};

export function loadTranslations(lang) {
  if (loaded[lang]) return Promise.resolve(loaded[lang]);
  if (!loaders[lang]) return Promise.resolve(al);
  return loaders[lang]()
    .then((module) => {
      loaded[lang] = module.default;
      return loaded[lang];
    })
    .catch((error) => {
      console.error(`Failed to load "${lang}" translations`, error);
      return al;
    });
}

// Returns the translations for `lang`. While a language is still loading it keeps
// returning the previously shown language (Albanian on first paint), so
// components always get a complete object.
export function useTranslations(lang) {
  const [shown, setShown] = useState(() => loaded[lang] || al);

  useEffect(() => {
    let isCancelled = false;
    loadTranslations(lang).then((t) => {
      if (!isCancelled) setShown(t);
    });
    return () => {
      isCancelled = true;
    };
  }, [lang]);

  return loaded[lang] || shown;
}

// Pre-path URLs used ?lang=en. Returns that language, if any, so old links can be
// moved to the path version.
export function legacyLanguageParam(search = '') {
  const lang = new URLSearchParams(search).get('lang');
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : null;
}

// The visitor's own choice (from the language switcher), falling back to an
// Italian browser. Used only to send someone landing on an Albanian URL to the
// language they prefer; crawlers have neither, so they always get the URL's language.
export function preferredLanguage() {
  try {
    const stored = localStorage.getItem('preferredLanguage');
    if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
  } catch {
    /* storage unavailable */
  }
  const browserLang = (navigator.language || '').toLowerCase();
  return browserLang.startsWith('it') ? 'it' : DEFAULT_LANGUAGE;
}

export function rememberLanguage(lang) {
  try {
    localStorage.setItem('preferredLanguage', lang);
  } catch {
    /* storage unavailable */
  }
}

// The language a page will most likely start in, so index.js can fetch it
// before the first render.
export function guessInitialLanguage() {
  const fromPath = languageFromPath(window.location.pathname);
  if (fromPath !== DEFAULT_LANGUAGE) return fromPath;
  return legacyLanguageParam(window.location.search) || preferredLanguage();
}
