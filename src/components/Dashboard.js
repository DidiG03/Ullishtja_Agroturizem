import React, { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import MenuManagement from './MenuManagement';
import BlogManagement from './BlogManagement';
import './Dashboard.css';

const Dashboard = () => {
  const { isSignedIn, user } = useUser();
  const [activeTab, setActiveTab] = useState('menu');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth <= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isSignedIn) {
    return <Navigate to="/admin-login" replace />;
  }

  const adminUserIds = process.env.REACT_APP_ADMIN_USER_IDS?.split(',') || [];
  if (isSignedIn && user && !adminUserIds.includes(user.id)) {
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'blog':
        return <BlogManagement />;
      case 'menu':
      default:
        return <MenuManagement />;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <img
            src="https://ucarecdn.com/f2ebac4d-52d3-45f7-997d-3e2dea09557b/ullishtja_logo.jpeg"
            alt="Ullishtja Logo"
            className="dashboard-logo"
          />
          <div className="header-text">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {user?.firstName || 'Admin'}!</p>
          </div>
        </div>
        <div className="header-right">
          <UserButton />
        </div>
      </div>

      <div className="dashboard-content">
        <nav className={`dashboard-nav ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="nav-header">
            <button
              className="nav-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            {!sidebarCollapsed && <span className="nav-title">Dashboard</span>}
          </div>

          <div className="nav-items">
            <button
              className={`nav-tab ${activeTab === 'menu' ? 'active' : ''}`}
              onClick={() => setActiveTab('menu')}
              title="Menu Management"
            >
              <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h9zm0 0v7c0 .552-.448 1-1 1H11c-.552 0-1-.448-1-1v-7" />
              </svg>
              {!sidebarCollapsed && <span className="nav-text">Menu</span>}
            </button>
            <button
              className={`nav-tab ${activeTab === 'blog' ? 'active' : ''}`}
              onClick={() => setActiveTab('blog')}
              title="Blog Management"
            >
              <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
              {!sidebarCollapsed && <span className="nav-text">Blog</span>}
            </button>
          </div>
        </nav>

        <main
          className={`dashboard-main${
            activeTab === 'menu' || activeTab === 'blog' ? ' dashboard-main--contained' : ''
          }`}
        >
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
