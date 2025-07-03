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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState('request'); // 'request', 'verify', 'reset'

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn.create({
        identifier: email,
      });

      const firstFactor = signIn.supportedFirstFactors.find(
        (factor) => factor.strategy === 'reset_password_email_code'
      );

      if (firstFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'reset_password_email_code',
          emailAddressId: firstFactor.emailAddressId,
        });
        setResetEmailSent(true);
        setResetStep('verify');
      } else {
        setError('Password reset is not available for this account.');
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Failed to send reset email. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
      });

      if (result.status === 'needs_new_password') {
        setResetStep('reset');
      } else {
        setError('Invalid reset code. Please try again.');
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Invalid reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn.resetPassword({
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // Navigation will happen automatically due to the useUser hook above
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForgotPasswordState = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetStep('request');
    setError('');
  };

  if (showForgotPassword) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-content">
          <div className="login-header">
            <img src="https://ucarecdn.com/f2ebac4d-52d3-45f7-997d-3e2dea09557b/ullishtja_logo.jpeg" alt="Ullishtja Agriturizem" className="login-logo" />
            <h1>Reset Password</h1>
            <p>
              {resetStep === 'request' && 'Enter your email to receive a reset code'}
              {resetStep === 'verify' && 'Enter the code sent to your email'}
              {resetStep === 'reset' && 'Create your new password'}
            </p>
          </div>
          
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {resetEmailSent && resetStep === 'verify' && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              Reset code sent to {email}. Please check your email.
            </div>
          )}

          {resetStep === 'request' && (
            <form onSubmit={handleForgotPassword} className="custom-login-form">
              <div className="form-group">
                <label htmlFor="reset-email">Email Address</label>
                <input
                  type="email"
                  id="reset-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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
                    Sending...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          )}

          {resetStep === 'verify' && (
            <form onSubmit={handleVerifyResetCode} className="custom-login-form">
              <div className="form-group">
                <label htmlFor="reset-code">Reset Code</label>
                <input
                  type="text"
                  id="reset-code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Enter the 6-digit code"
                  required
                  disabled={loading}
                  maxLength={6}
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
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>
          )}

          {resetStep === 'reset' && (
            <form onSubmit={handlePasswordReset} className="custom-login-form">
              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                  minLength={8}
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
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          <div className="auth-links">
            <button 
              onClick={resetForgotPasswordState}
              className="link-button"
              disabled={loading}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="auth-links">
          <button 
            onClick={() => setShowForgotPassword(true)}
            className="link-button"
            disabled={loading}
          >
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 