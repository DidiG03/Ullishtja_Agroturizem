import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import { useGoogleAnalytics } from './hooks/useGoogleAnalytics';
import {
  isClerkKeyPlaceholder,
  isClerkProductionOnLocalhost,
  CLERK_LOCALHOST_HELP,
} from './utils/clerkLocalDev';

// Lazy load admin components for better performance
const AdminLogin = React.lazy(() => import('./components/AdminLogin'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const ProtectedRoute = React.lazy(() => import('./components/ProtectedRoute'));
const Blog = React.lazy(() => import('./components/Blog'));

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

// Get the publishable key from environment variables
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

const ClerkSetupRequired = ({ title, steps }) => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: '#fafafa',
      color: '#2d4a36',
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{title}</h1>
      <ol style={{ lineHeight: 1.7, paddingLeft: '1.25rem' }}>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', opacity: 0.85 }}>
        Stop the dev server (Ctrl+C), then run: <code>npm run dev</code>
      </p>
    </div>
  </div>
);

const clerkSetupSteps = [
  'Open dashboard.clerk.com and select your app',
  'Switch to the Development instance (not Production)',
  'Go to API Keys and copy the Publishable key (pk_test_...) and Secret key (sk_test_...)',
  'Paste them into .env.local (replace the PASTE_YOUR_... placeholders)',
  'Run: node scripts/create-admin-user.js — copy REACT_APP_ADMIN_USER_IDS into .env.local',
];

// Component to initialize Google Analytics
const AnalyticsWrapper = ({ children }) => {
  useGoogleAnalytics(); // Initialize and track page views
  return children;
};

const AppRouter = () => {
  if (isClerkKeyPlaceholder(clerkPubKey)) {
    return (
      <ClerkSetupRequired
        title="Clerk API keys not configured"
        steps={clerkSetupSteps}
      />
    );
  }

  if (isClerkProductionOnLocalhost()) {
    return (
      <ClerkSetupRequired
        title="Production Clerk keys cannot run on localhost"
        steps={[CLERK_LOCALHOST_HELP, ...clerkSetupSteps.slice(2)]}
      />
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <AnalyticsWrapper>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Main website route */}
              <Route path="/" element={<App />} />
              
              {/* Admin login route - lazy loaded */}
              <Route 
                path="/admin-login" 
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <AdminLogin />
                  </Suspense>
                } 
              />
              
              {/* Protected dashboard route - admin only, lazy loaded */}
              <Route 
                path="/dashboard" 
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProtectedRoute adminOnly={true}>
                      <Dashboard />
                    </ProtectedRoute>
                  </Suspense>
                } 
              />

              {/* Blog route - lazy loaded */}
              <Route 
                path="/blog" 
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Blog />
                  </Suspense>
                } 
              />
              <Route 
                path="/blog/:slug" 
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Blog />
                  </Suspense>
                } 
              />
              
              {/* Fallback route - redirect to home */}
              <Route path="*" element={<App />} />
            </Routes>
          </Suspense>
        </AnalyticsWrapper>
      </Router>
    </ClerkProvider>
  );
};

export default AppRouter; 