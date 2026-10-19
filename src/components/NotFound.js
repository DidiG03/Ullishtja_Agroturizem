import React from 'react';
import { Link } from 'react-router-dom';
import { localizedPath, useTranslations } from '../i18n';
import useLanguage from '../hooks/useLanguage';
import SEOHead from './SEOHead';
import Layout from './Layout';

// Shown for any unknown URL. The host answers those with 404.html (a prerender of
// this page) and a real 404 status, so search engines drop them instead of
// indexing copies of the homepage.
function NotFound() {
  const { language } = useLanguage();
  const t = useTranslations(language);
  const copy = t.notFound;

  return (
    <Layout>
      <SEOHead language={language} page="notFound" />
      <section className="not-found">
        <div className="container">
          <h1>{copy.title}</h1>
          <p className="section-text">{copy.text}</p>
          <div className="hero-actions">
            <Link to={localizedPath('/', language)} className="cta-button primary">
              {copy.home}
            </Link>
            <Link to={localizedPath('/menu', language)} className="cta-button secondary">
              {t.nav.menu}
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default NotFound;
