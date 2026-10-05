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
