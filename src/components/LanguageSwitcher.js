import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { languageSwitchPath } from '../i18n';
import './LanguageSwitcher.css';

const LANGUAGE_OPTIONS = [
  { code: 'al', short: 'AL', full: 'Albanian', hreflang: 'sq' },
  { code: 'en', short: 'EN', full: 'English', hreflang: 'en' },
  { code: 'it', short: 'IT', full: 'Italian', hreflang: 'it' },
];

// Real links to the same page in each language, so crawlers can follow them to
// every translation; clicks are handled in-app by onLanguageChange.
function LanguageSwitcher({
  currentLanguage,
  onLanguageChange,
  variant = 'dark',
  label = 'short',
  className = '',
}) {
  const { pathname } = useLocation();
  const classes = ['lang-switcher', `lang-switcher--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="group" aria-label="Language">
      {LANGUAGE_OPTIONS.map(({ code, short, full, hreflang }) => (
        <Link
          key={code}
          to={languageSwitchPath(pathname, code)}
          hrefLang={hreflang}
          className={`lang-switcher__btn${currentLanguage === code ? ' lang-switcher__btn--active' : ''}`}
          onClick={(event) => {
            event.preventDefault();
            onLanguageChange(code);
          }}
          // The accessible name has to start with the visible text ("EN").
          aria-label={label === 'short' ? `${short} – ${full}` : undefined}
          aria-current={currentLanguage === code ? 'true' : undefined}
        >
          {label === 'full' ? full : short}
        </Link>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
