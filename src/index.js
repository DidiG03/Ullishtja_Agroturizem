import React from 'react';
import ReactDOM from 'react-dom/client';
// @font-face rules for the self-hosted faces are inlined in public/index.html so
// they are available before any stylesheet has been fetched.
import './index.css';
import AppRouter from './AppRouter';
import { guessInitialLanguage, loadTranslations } from './i18n';

const container = document.getElementById('root');
const app = (
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);

// Fetch an English/Italian chunk before the first render so those visitors don't
// see an Albanian flash. Albanian is already in the bundle and resolves at once.
loadTranslations(guessInitialLanguage()).finally(() => {
  // Public pages arrive prerendered (scripts/prerender.js). Hydrating keeps that
  // markup instead of rebuilding it, so nothing flashes or re-animates and the
  // page counts as painted as soon as the HTML is. The admin shells are empty.
  if (container.hasChildNodes()) {
    ReactDOM.hydrateRoot(container, app);
  } else {
    ReactDOM.createRoot(container).render(app);
  }
});
