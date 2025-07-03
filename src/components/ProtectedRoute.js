import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import './Loading.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isSignedIn, user, isLoaded } = useUser();

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Redirect to login if not signed in
  if (!isSignedIn) {
    return <Navigate to="/admin-login" replace />;
  }

  // Check admin permissions if adminOnly is true
  if (adminOnly && user) {
    const adminUserIds = process.env.REACT_APP_ADMIN_USER_IDS?.split(',') || [];
    if (!adminUserIds.includes(user.id)) {
      return (
        <div className="unauthorized-container">
          <div className="unauthorized-content">
            <h1>Access Denied</h1>
            <p>You don't have permission to access this area.</p>
            <button onClick={() => window.location.href = '/'} className="home-button">
              Go to Homepage
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute; 