import React from 'react';
import './LanguageSwitcher.css';

const LANGUAGE_OPTIONS = [
  { code: 'al', short: 'AL', full: 'Albanian', ariaLabel: 'Switch language to Albanian' },
  { code: 'en', short: 'EN', full: 'English', ariaLabel: 'Switch language to English' },
  { code: 'it', short: 'IT', full: 'Italian', ariaLabel: 'Switch language to Italian' },
];

function LanguageSwitcher({
  currentLanguage,
  onLanguageChange,
  variant = 'dark',
  label = 'short',
  className = '',
}) {
  const classes = ['lang-switcher', `lang-switcher--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="group" aria-label="Language">
      {LANGUAGE_OPTIONS.map(({ code, short, full, ariaLabel }) => (
        <button
          key={code}
          type="button"
          className={`lang-switcher__btn${currentLanguage === code ? ' lang-switcher__btn--active' : ''}`}
          onClick={() => onLanguageChange(code)}
          aria-label={label === 'short' ? ariaLabel : undefined}
          aria-pressed={currentLanguage === code}
        >
          {label === 'full' ? full : short}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
