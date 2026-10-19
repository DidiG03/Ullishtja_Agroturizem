import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { languageFromPath, languageSwitchPath, rememberLanguage } from '../i18n';

/**
 * The language comes from the URL (/en/menu is English), so every language has its
 * own address for search engines. Switching language navigates to the same page
 * under the other prefix and remembers the choice for the next visit.
 */
export default function useLanguage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const language = languageFromPath(pathname);

  const changeLanguage = useCallback(
    (lang) => {
      rememberLanguage(lang);
      if (lang === language) return;
      navigate(languageSwitchPath(pathname, lang));
    },
    [language, navigate, pathname]
  );

  return { language, changeLanguage };
}
