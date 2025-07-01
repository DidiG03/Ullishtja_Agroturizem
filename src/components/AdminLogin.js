import React, { useState } from 'react';
import { useSignIn, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = () => {
  const { isSignedIn, user } = useUser();
  const { signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already signed in and is an admin
  if (isSignedIn && user) {
    const adminUserIds = process.env.REACT_APP_ADMIN_USER_IDS?.split(',') || [];
    if (adminUserIds.includes(user.id)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // Navigation will happen automatically due to the useUser hook above
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-content">
        <div className="login-header">
          <img src="https://ucarecdn.com/f2ebac4d-52d3-45f7-997d-3e2dea09557b/ullishtja_logo.jpeg" alt="Ullishtja Agriturizem" className="login-logo" />
          <h1>Admin Login</h1>
          <p>Sign in to access the admin dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="custom-login-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin; 