import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import { useGoogleAnalytics } from './hooks/useGoogleAnalytics';

// Lazy load admin components for better performance
const AdminLogin = React.lazy(() => import('./components/AdminLogin'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const ProtectedRoute = React.lazy(() => import('./components/ProtectedRoute'));

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

if (!clerkPubKey) {
  console.error('Missing Clerk Publishable Key. Please add REACT_APP_CLERK_PUBLISHABLE_KEY to your environment variables.');
}

// Component to initialize Google Analytics
const AnalyticsWrapper = ({ children }) => {
  useGoogleAnalytics(); // Initialize and track page views
  return children;
};

const AppRouter = () => {
  return (
    <ClerkProvider publishableKey={clerkPubKey || 'pk_test_placeholder'}>
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