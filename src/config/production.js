// Production configuration optimizations

export const productionConfig = {
  // Database optimizations
  database: {
    connectionPooling: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    }
  },

  // Caching configuration
  cache: {
    ttl: 300, // 5 minutes default TTL
    menu: 900, // 15 minutes for menu items
    reviews: 1800, // 30 minutes for reviews
    settings: 3600, // 1 hour for restaurant settings
  },

  // Rate limiting
  rateLimiting: {
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per window
    },
    reservations: {
      windowMs: 15 * 60 * 1000,
      max: 5
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 10
    }
  },

  // Performance monitoring
  monitoring: {
    enableMetrics: true,
    logLevel: 'warn', // Only log warnings and errors in production
    enableRequestLogging: false,
    enablePerformanceTracking: true
  },

  // Security
  security: {
    enableHSTS: true,
    enableCSP: true,
    cookieSecure: true,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  }
};

// Environment-specific configurations
export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return productionConfig;
  }
  
  // Development overrides
  return {
    ...productionConfig,
    monitoring: {
      ...productionConfig.monitoring,
      logLevel: 'debug',
      enableRequestLogging: true,
    },
    security: {
      ...productionConfig.security,
      cookieSecure: false,
    }
  };
};