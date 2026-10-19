import React from 'react';
import { useTranslations } from '../i18n';
import useLanguage from '../hooks/useLanguage';
import SiteNav from './SiteNav';
import SiteFooter from './SiteFooter';
import '../App.css'; // Import main app styles for navbar and footer

const Layout = ({ children }) => {
  const { language: currentLanguage, changeLanguage } = useLanguage();
  const t = useTranslations(currentLanguage);

  return (
    <div className="layout has-site-nav">
      <SiteNav
        t={t}
        currentLanguage={currentLanguage}
        onLanguageChange={changeLanguage}
      />

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      <SiteFooter t={t} currentLanguage={currentLanguage} onLanguageChange={changeLanguage} />
    </div>
  );
};

export default Layout;