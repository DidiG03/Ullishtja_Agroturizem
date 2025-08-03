// Test component to verify integrated analytics are working
import React, { useEffect, useState } from 'react';
import integratedAnalyticsService from '../services/integratedAnalytics';

const AnalyticsTest = () => {
  const [analyticsStatus, setAnalyticsStatus] = useState({
    initialized: false,
    services: {}
  });

  useEffect(() => {
    // Initialize analytics
    integratedAnalyticsService.initialize();
    
    // Check status after a short delay
    setTimeout(() => {
      setAnalyticsStatus({
        initialized: integratedAnalyticsService.isInitialized(),
        services: integratedAnalyticsService.getActiveServices()
      });
    }, 1000);
  }, []);

  const testAnalyticsEvent = () => {
    // Test various analytics events
    integratedAnalyticsService.trackMenuView('en', 'test');
    integratedAnalyticsService.trackMenuCategoryClick('Sallata', 'al');
    integratedAnalyticsService.trackPDFDownload('full_menu', 'al');
    alert('Analytics events sent! Check your browser console and analytics dashboards.');
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      border: '2px solid #6B8E23',
      borderRadius: '10px',
      padding: '15px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 10000,
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#2d4a36' }}>Analytics Status</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Initialized:</strong> {analyticsStatus.initialized ? '✅' : '❌'}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Active Services:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Google Analytics: {analyticsStatus.services.googleAnalytics ? '✅' : '❌'}</li>
          <li>Vercel Analytics: {analyticsStatus.services.vercelAnalytics ? '✅' : '❌'}</li>
          <li>Speed Insights: {analyticsStatus.services.vercelSpeedInsights ? '✅' : '❌'}</li>
        </ul>
      </div>
      
      <button 
        onClick={testAnalyticsEvent}
        style={{
          background: '#6B8E23',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Test Analytics
      </button>
      
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        Debug mode - Development only
      </div>
    </div>
  );
};

export default AnalyticsTest;