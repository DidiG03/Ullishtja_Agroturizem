import React from 'react';
import ReactDOM from 'react-dom/client';
// @font-face rules for the self-hosted faces are inlined in public/index.html so
// they are available before any stylesheet has been fetched.
import './index.css';
import AppRouter from './AppRouter';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);

// Defer non-critical web vitals reporting until the browser is idle
if (process.env.NODE_ENV === 'production') {
  const deferVitals = () => {
    import('./reportWebVitals').then(({ default: reportWebVitals }) => {
      // You can forward vitals to analytics if needed:
      // reportWebVitals(console.log);
      reportWebVitals();
    });
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(deferVitals, { timeout: 2000 });
  } else {
    setTimeout(deferVitals, 2000);
  }
}
