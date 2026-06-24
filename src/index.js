import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/400-italic.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
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
