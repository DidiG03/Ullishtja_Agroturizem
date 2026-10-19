import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import App from './App';
import { useGoogleAnalytics } from './hooks/useGoogleAnalytics';
import {
  DEFAULT_LANGUAGE,
  LOCALIZED_PAGES,
  SUPPORTED_LANGUAGES,
  languageFromPath,
  legacyLanguageParam,
  localizedPath,
  preferredLanguage,
  stripLanguagePrefix,
} from './i18n';

// Lazy load admin components for better performance
const AdminLogin = React.lazy(() => import('./components/AdminLogin'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const ProtectedRoute = React.lazy(() => import('./components/ProtectedRoute'));
const MenuPage = React.lazy(() => import('./components/MenuPage'));
const NotFound = React.lazy(() => import('./components/NotFound'));

// Clerk is only needed behind /admin-login and /dashboard, so it is code-split
// away from the entry bundle that public visitors download.
const ClerkGate = React.lazy(() => import('./components/ClerkGate'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'var(--cream, #fafafa)',
    color: 'var(--primary-forest, #2d4a36)'
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--light-green, #8fbc8f)',
        borderTop: '3px solid var(--primary-forest, #2d4a36)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <span>Loading...</span>
    </div>
  </div>
);

// Component to initialize Google Analytics
const AnalyticsWrapper = ({ children }) => {
  useGoogleAnalytics(); // Initialize and track page views
  return children;
};

// On the first page load only: move old ?lang=en links to /en, and send a visitor
// who opens an Albanian page to the language they chose before (or an Italian
// browser to /it). Crawlers have no stored choice, so they stay on the URL they asked for.
const useLanguageRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { pathname, search, hash } = location;
    const page = stripLanguagePrefix(pathname);
    if (!LOCALIZED_PAGES.includes(page)) return;

    const legacyLang = legacyLanguageParam(search);
    const params = new URLSearchParams(search);
    params.delete('lang');
    const rest = params.toString() ? `?${params}` : '';

    let lang = null;
    if (legacyLang) lang = legacyLang;
    else if (languageFromPath(pathname) === DEFAULT_LANGUAGE) lang = preferredLanguage();

    const target = lang ? localizedPath(page, lang) : pathname;
    if (target !== pathname || rest !== search) {
      navigate({ pathname: target, search: rest, hash }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

const LanguageRedirect = ({ children }) => {
  useLanguageRedirect();
  return children;
};

const languagePrefixes = SUPPORTED_LANGUAGES.map((lang) => localizedPath('', lang));

export const AppRoutes = () => (
  <Routes>
    {/* Main website: / (Albanian), /en, /it */}
    {languagePrefixes.map((prefix) => (
      <Route key={`home${prefix}`} path={prefix || '/'} element={<App />} />
    ))}

    {/* Menu: /menu, /en/menu, /it/menu */}
    {languagePrefixes.map((prefix) => (
      <Route
        key={`menu${prefix}`}
        path={`${prefix}/menu`}
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <MenuPage />
          </Suspense>
        }
      />
    ))}

    {/* Admin login route - lazy loaded */}
    <Route
      path="/admin-login"
      element={
        <Suspense fallback={<LoadingSpinner />}>
          <ClerkGate>
            <AdminLogin />
          </ClerkGate>
        </Suspense>
      }
    />

    {/* Protected dashboard route - admin only, lazy loaded */}
    <Route
      path="/dashboard"
      element={
        <Suspense fallback={<LoadingSpinner />}>
          <ClerkGate>
            <ProtectedRoute adminOnly={true}>
              <Dashboard />
            </ProtectedRoute>
          </ClerkGate>
        </Suspense>
      }
    />

    {/* Anything else is a 404 */}
    <Route
      path="*"
      element={
        <Suspense fallback={<LoadingSpinner />}>
          <NotFound />
        </Suspense>
      }
    />
  </Routes>
);

// Everything inside the router. scripts/prerender.js renders this same tree inside
// a StaticRouter, so the prerendered HTML matches what the browser hydrates.
export const AppShell = () => (
  <AnalyticsWrapper>
    <LanguageRedirect>
      <Suspense fallback={<LoadingSpinner />}>
        <AppRoutes />
      </Suspense>
    </LanguageRedirect>
  </AnalyticsWrapper>
);

const AppRouter = () => (
  <Router>
    <AppShell />
  </Router>
);

export default AppRouter;
