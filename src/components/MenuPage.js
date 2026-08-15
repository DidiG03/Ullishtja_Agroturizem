import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { translations } from '../translations';
import MenuService from '../services/menuService';
import pdfExportService from '../services/pdfExportService';
import googleAdsService from '../services/googleAdsService';
import integratedAnalyticsService from '../services/integratedAnalytics';
import SEOHead from './SEOHead';
import Layout from './Layout';
import './MenuPage.css';

const getInitialLanguage = () => {
  const storedLanguage = localStorage.getItem('preferredLanguage');
  if (storedLanguage && ['al', 'en', 'it'].includes(storedLanguage)) {
    return storedLanguage;
  }

  const urlLang = new URLSearchParams(window.location.search).get('lang');
  if (urlLang && ['al', 'en', 'it'].includes(urlLang)) {
    localStorage.setItem('preferredLanguage', urlLang);
    return urlLang;
  }

  const browserLang = (navigator.language || navigator.languages?.[0] || '').toLowerCase();
  if (browserLang.startsWith('sq') || browserLang.startsWith('al')) return 'al';
  if (browserLang.startsWith('it')) return 'it';
  if (browserLang.startsWith('en')) return 'en';
  return 'al';
};

const localized = (item, field, language) => {
  const key = `${field}${language === 'en' ? 'EN' : language === 'it' ? 'IT' : 'AL'}`;
  return item[key] || item[`${field}AL`] || '';
};

const formatPrice = (price) => {
  if (price == null || price === '') return '';
  const num = Number(price);
  if (!Number.isNaN(num)) {
    return Number.isInteger(num) ? String(Math.round(num)) : String(num);
  }
  return String(price).replace(/\s*ALL\s*/gi, '').trim();
};

const categoryAnchor = (category) => category.slug || category.id;

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(input);
    return ok;
  }
};

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M10 13a5 5 0 007.07 0l1.41-1.41a5 5 0 00-7.07-7.07L10 5.93" />
    <path d="M14 11a5 5 0 00-7.07 0L5.52 12.41a5 5 0 007.07 7.07L14 18.07" />
  </svg>
);

const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 4h12a1 1 0 011 1v16l-7-4-7 4V5a1 1 0 011-1z" />
  </svg>
);

const PdfIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M8 13h8M8 17h5" />
  </svg>
);

function MenuPage({ currentLanguage: propLanguage }) {
  const [currentLanguage, setCurrentLanguage] = useState(propLanguage || getInitialLanguage());
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const t = translations[currentLanguage] || translations.al;
  const copy = t.menuPage;

  const visibleCategories = useMemo(
    () => categories.filter((category) => Array.isArray(category.menuItems) && category.menuItems.length > 0),
    [categories]
  );

  const menuUrl = useCallback((hash) => {
    const origin = window.location.origin;
    const path = currentLanguage === 'al' ? '/menu' : `/menu?lang=${currentLanguage}`;
    const fragment = hash ? `#${hash}` : '';
    return `${origin}${path}${fragment}`;
  }, [currentLanguage]);

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await MenuService.getCompleteMenu();
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to load menu');
      }
      const categoriesData = Array.isArray(data.data) ? data.data : [];
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading menu:', err);
      setError(true);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  useEffect(() => {
    integratedAnalyticsService.trackMenuView(currentLanguage, 'full-menu-page');
  }, [currentLanguage]);

  useEffect(() => {
    const handleLanguageChanged = (event) => {
      const lang = event.detail?.language;
      if (lang && lang !== currentLanguage) {
        setCurrentLanguage(lang);
      }
    };

    if (propLanguage && propLanguage !== currentLanguage) {
      setCurrentLanguage(propLanguage);
    }

    window.addEventListener('languageChanged', handleLanguageChanged);
    return () => window.removeEventListener('languageChanged', handleLanguageChanged);
  }, [propLanguage, currentLanguage]);

  useEffect(() => {
    if (loading || !visibleCategories.length) return undefined;

    const hash = decodeURIComponent(window.location.hash.replace('#', ''));
    const match = visibleCategories.find((category) => categoryAnchor(category) === hash);
    const initial = match || visibleCategories[0];
    setActiveCategory(categoryAnchor(initial));

    if (match) {
      requestAnimationFrame(() => {
        document.getElementById(`menu-${categoryAnchor(match)}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }
  }, [loading, visibleCategories]);

  useEffect(() => {
    if (!visibleCategories.length) return undefined;

    const sections = visibleCategories
      .map((category) => document.getElementById(`menu-${categoryAnchor(category)}`))
      .filter(Boolean);

    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveCategory(visible.target.id.replace('menu-', ''));
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.1, 0.25, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [visibleCategories]);

  const scrollToCategory = (category) => {
    const anchor = categoryAnchor(category);
    setActiveCategory(anchor);
    const url = new URL(window.location.href);
    url.hash = anchor;
    window.history.replaceState({}, '', url);
    document.getElementById(`menu-${anchor}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    integratedAnalyticsService.trackMenuCategoryClick(
      localized(category, 'name', currentLanguage),
      currentLanguage
    );
  };

  const handleShare = async () => {
    const url = menuUrl(activeCategory);
    const shareData = {
      title: `${copy.title} | Ullishtja Agroturizem`,
      text: copy.shareText,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }

    const copied = await copyToClipboard(url);
    showToast(copied ? copy.copied : copy.error);
  };

  const handleCopyLink = async () => {
    const copied = await copyToClipboard(menuUrl(activeCategory));
    showToast(copied ? copy.copied : copy.error);
  };

  const handleBookmark = async () => {
    const copied = await copyToClipboard(menuUrl(activeCategory));
    showToast(copied ? copy.bookmarkHint : copy.error);
  };

  const handlePdf = async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      googleAdsService.trackMenuDownload(currentLanguage);
      integratedAnalyticsService.trackPDFDownload('full-menu', currentLanguage);
      await pdfExportService.openPDFInNewWindow(categories, currentLanguage);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      showToast(copy.pdfError);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Layout currentLanguage={currentLanguage}>
      <div className="menu-page">
        <SEOHead currentLanguage={currentLanguage} pageSection="menu" />
        <h1 className="menu-page-sr-only">{copy.title}</h1>

        {!loading && !error && visibleCategories.length > 0 && (
          <nav className="menu-page-cats" aria-label={copy.title}>
            <div className="menu-page-cats-inner">
              {visibleCategories.map((category) => {
                const anchor = categoryAnchor(category);
                return (
                  <button
                    key={category.id}
                    type="button"
                    className={`menu-page-cat${activeCategory === anchor ? ' is-active' : ''}`}
                    onClick={() => scrollToCategory(category)}
                  >
                    {localized(category, 'name', currentLanguage)}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <div className="menu-page-body">
          <div className="container menu-page-sheet">
            {loading && (
              <div className="menu-page-status">
                <div className="menu-page-spinner" />
                <p>{copy.loading}</p>
              </div>
            )}

            {error && !loading && (
              <div className="menu-page-status">
                <p>{copy.error}</p>
                <button type="button" className="menu-page-retry" onClick={loadMenu}>
                  {copy.retry}
                </button>
              </div>
            )}

            {!loading && !error && visibleCategories.length === 0 && (
              <div className="menu-page-status">
                <p>{copy.empty}</p>
              </div>
            )}

            {!loading && !error && visibleCategories.map((category) => {
              const anchor = categoryAnchor(category);
              const description = localized(category, 'description', currentLanguage);
              return (
                <section
                  key={category.id}
                  id={`menu-${anchor}`}
                  className="menu-page-section"
                >
                  <h2 className="menu-page-section-title">
                    {localized(category, 'name', currentLanguage)}
                  </h2>
                  {description && <p className="menu-page-section-desc">{description}</p>}

                  <div className="menu-page-items">
                    {category.menuItems.map((item) => (
                      <article key={item.id || item.nameAL} className="menu-page-item">
                        <div className="menu-page-item-top">
                          <h3 className="menu-page-item-name">
                            {localized(item, 'name', currentLanguage)}
                          </h3>
                          <span className="menu-page-item-price">{formatPrice(item.price)}</span>
                        </div>
                        {localized(item, 'description', currentLanguage) && (
                          <p className="menu-page-item-desc">
                            {localized(item, 'description', currentLanguage)}
                          </p>
                        )}
                        {localized(item, 'ingredients', currentLanguage) && (
                          <p className="menu-page-item-ingredients">
                            <strong>{copy.ingredients}:</strong>{' '}
                            {localized(item, 'ingredients', currentLanguage)}
                          </p>
                        )}
                        <div className="menu-page-badges">
                          {item.isVegetarian && (
                            <span className="menu-page-badge is-veg">{copy.vegetarian}</span>
                          )}
                          {item.isSpicy && (
                            <span className="menu-page-badge is-spicy">{copy.spicy}</span>
                          )}
                          {item.isRecommended && (
                            <span className="menu-page-badge is-rec">{copy.recommended}</span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {toast && (
          <div className="menu-page-toast" role="status">
            {toast}
          </div>
        )}

        <div className="menu-page-fabs" role="toolbar" aria-label={copy.title}>
          <button
            type="button"
            className="menu-page-fab"
            onClick={handleShare}
            aria-label={copy.share}
            title={copy.share}
          >
            <ShareIcon />
          </button>
          <button
            type="button"
            className="menu-page-fab"
            onClick={handleCopyLink}
            aria-label={copy.copyLink}
            title={copy.copyLink}
          >
            <LinkIcon />
          </button>
          <button
            type="button"
            className="menu-page-fab"
            onClick={handleBookmark}
            aria-label={copy.bookmark}
            title={copy.bookmark}
          >
            <BookmarkIcon />
          </button>
          <button
            type="button"
            className="menu-page-fab menu-page-fab--primary"
            onClick={handlePdf}
            disabled={pdfLoading || loading}
            aria-label={pdfLoading ? copy.pdfPreparing : copy.pdf}
            title={pdfLoading ? copy.pdfPreparing : copy.pdf}
          >
            <PdfIcon />
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default MenuPage;
