// Albanian is the default language, so it ships in the main bundle; English and
// Italian are separate chunks that load only for visitors who need them.
import { useEffect, useState } from 'react';
import al from './translations/al';

export const SUPPORTED_LANGUAGES = ['al', 'en', 'it'];

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

// The language a page will most likely start in, so index.js can fetch it
// before the first render.
export function guessInitialLanguage() {
  try {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (SUPPORTED_LANGUAGES.includes(urlLang)) return urlLang;
    const stored = localStorage.getItem('preferredLanguage');
    if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
  } catch {
    /* storage unavailable */
  }
  const browserLang = (navigator.language || '').toLowerCase();
  return browserLang.startsWith('it') ? 'it' : 'al';
}
