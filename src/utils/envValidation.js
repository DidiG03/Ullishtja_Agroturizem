// Environment variable validation for production readiness

export const requiredEnvVars = {
  // Database
  DATABASE_URL: {
    required: true,
    description: 'PostgreSQL database connection string'
  },
  
  // Clerk Authentication
  CLERK_SECRET_KEY: {
    required: true,
    description: 'Clerk secret key for backend authentication',
    sensitive: true
  },
  REACT_APP_CLERK_PUBLISHABLE_KEY: {
    required: true,
    description: 'Clerk publishable key for frontend'
  },
  
  // Node Environment
  NODE_ENV: {
    required: true,
    description: 'Node environment (development, production)',
    default: 'development'
  }
};

export const optionalEnvVars = {
  // Admin Configuration
  REACT_APP_ADMIN_USER_IDS: {
    description: 'Comma-separated list of admin user IDs'
  },
  
  // Google Services
  REACT_APP_GOOGLE_PLACE_ID: {
    description: 'Google Places ID for reviews'
  },
  REACT_APP_GOOGLE_PLACES_API_KEY: {
    description: 'Google Places API key',
    sensitive: true
  },
  REACT_APP_GA_TRACKING_ID: {
    description: 'Google Analytics tracking ID'
  },
  
  // WhatsApp/Twilio
  TWILIO_ACCOUNT_SID: {
    description: 'Twilio account SID for WhatsApp notifications',
    sensitive: true
  },
  TWILIO_AUTH_TOKEN: {
    description: 'Twilio auth token',
    sensitive: true
  },
  TWILIO_WHATSAPP_NUMBER: {
    description: 'Twilio WhatsApp number'
  },
  
  // Security
  ALLOWED_ORIGINS: {
    description: 'Comma-separated list of allowed CORS origins'
  },
  
  // Server Configuration
  PORT: {
    description: 'Server port number',
    default: '3001'
  },
  REACT_APP_API_URL: {
    description: 'API base URL for development'
  }
};

export const validateEnvironment = () => {
  const errors = [];
  const warnings = [];
  const config = {};

  // Check required environment variables
  Object.entries(requiredEnvVars).forEach(([key, spec]) => {
    const value = process.env[key];
    
    if (!value) {
      if (spec.default) {
        config[key] = spec.default;
        warnings.push(`Using default value for ${key}: ${spec.default}`);
      } else {
        errors.push(`Missing required environment variable: ${key} - ${spec.description}`);
      }
    } else {
      config[key] = value;
    }
  });

  // Check optional environment variables
  Object.entries(optionalEnvVars).forEach(([key, spec]) => {
    const value = process.env[key];
    
    if (value) {
      config[key] = value;
    } else if (spec.default) {
      config[key] = spec.default;
      warnings.push(`Using default value for ${key}: ${spec.default}`);
    } else {
      warnings.push(`Optional environment variable not set: ${key} - ${spec.description}`);
    }
  });

  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    // Check for sensitive defaults in production
    if (process.env.CLERK_SECRET_KEY?.includes('test')) {
      errors.push('Using test Clerk secret key in production environment');
    }
    
    if (!process.env.ALLOWED_ORIGINS) {
      errors.push('ALLOWED_ORIGINS must be set in production for security');
    }
    
    if (!process.env.REACT_APP_ADMIN_USER_IDS) {
      warnings.push('No admin users configured. Admin functionality will be limited.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  };
};

export const logEnvironmentStatus = () => {
  const validation = validateEnvironment();
  
  console.log('\n🔍 Environment Configuration Check:');
  console.log('=====================================');
  
  if (validation.isValid) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('❌ Missing required environment variables:');
    validation.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  console.log(`\n🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=====================================\n');
  
  return validation;
};