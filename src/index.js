import React from 'react';
import ReactDOM from 'react-dom/client';
// @font-face rules for the self-hosted faces are inlined in public/index.html so
// they are available before any stylesheet has been fetched.
import './index.css';
import AppRouter from './AppRouter';
import { guessInitialLanguage, loadTranslations } from './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Fetch an English/Italian chunk before the first render so those visitors don't
// see an Albanian flash. Albanian is already in the bundle and resolves at once.
loadTranslations(guessInitialLanguage()).finally(() => {
  root.render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
});
