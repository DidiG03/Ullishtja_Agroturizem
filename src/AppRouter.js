import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Get the publishable key from environment variables
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.error('Missing Clerk Publishable Key. Please add REACT_APP_CLERK_PUBLISHABLE_KEY to your environment variables.');
}

const AppRouter = () => {
  return (
    <ClerkProvider publishableKey={clerkPubKey || 'pk_test_placeholder'}>
      <Router>
        <Routes>
          {/* Main website route */}
          <Route path="/" element={<App />} />
          
          {/* Admin login route */}
          <Route path="/admin-login" element={<AdminLogin />} />
          
          {/* Protected dashboard route - admin only */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute adminOnly={true}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback route - redirect to home */}
          <Route path="*" element={<App />} />
        </Routes>
      </Router>
    </ClerkProvider>
  );
};

export default AppRouter; 