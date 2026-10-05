import React, { useState, useEffect } from 'react';
import { useTranslations } from '../i18n';
import SiteNav from './SiteNav';
import SiteFooter from './SiteFooter';
import '../App.css'; // Import main app styles for navbar and footer

// Helper function to get language from localStorage or detect browser language
const getInitialLanguage = () => {
  // Check if user has a stored preference
  const storedLanguage = localStorage.getItem('preferredLanguage');
  if (storedLanguage && ['al', 'en', 'it'].includes(storedLanguage)) {
    return storedLanguage;
  }

  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && ['al', 'en', 'it'].includes(urlLang)) {
    localStorage.setItem('preferredLanguage', urlLang);
    return urlLang;
  }

  // If no stored preference, try to detect browser language
  const browserLang = navigator.language || navigator.languages[0];
  if (browserLang) {
    const langCode = browserLang.toLowerCase();
    if (langCode.startsWith('sq') || langCode.startsWith('al')) return 'al'; // Albanian
    if (langCode.startsWith('it')) return 'it'; // Italian
    if (langCode.startsWith('en')) return 'en'; // English
  }

  // Default to Albanian
  return 'al';
};

const Layout = ({ children, currentLanguage: propLanguage }) => {
  const [currentLanguage, setCurrentLanguage] = useState(propLanguage || getInitialLanguage());

  const t = useTranslations(currentLanguage);

  // Effect to sync language changes
  useEffect(() => {
    if (propLanguage && propLanguage !== currentLanguage) {
      setCurrentLanguage(propLanguage);
    }
  }, [propLanguage, currentLanguage]);

  // Language change handler
  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
    
    // Update URL
    const url = new URL(window.location);
    if (lang !== 'al') {
      url.searchParams.set('lang', lang);
    } else {
      url.searchParams.delete('lang');
    }
    window.history.replaceState({}, '', url);

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: lang } 
    }));
  };

  return (
    <div className="layout has-site-nav">
      <SiteNav
        t={t}
        currentLanguage={currentLanguage}
        onLanguageChange={changeLanguage}
      />

      {/* Main Content */}
      <main className="main-content">
        {React.cloneElement(children, { currentLanguage, translations: t })}
      </main>

      <SiteFooter t={t} currentLanguage={currentLanguage} onLanguageChange={changeLanguage} />
    </div>
  );
};

export default Layout;