const path = require('path');
// Load env files in the same order as Create React App
['.env.local', '.env.development.local', '.env.development', '.env'].forEach((file) => {
  require('dotenv').config({ path: path.resolve(process.cwd(), file) });
});

// Validate environment before starting server
const { logEnvironmentStatus } = require('../src/utils/envValidation.js');
const validation = logEnvironmentStatus();

if (!validation.isValid) {
  console.error('❌ Server cannot start due to missing required environment variables');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const { getCorsOrigins } = require('../src/utils/corsConfig.js');
const { applySecurityHeaders } = require('../src/utils/securityHeaders.js');
const { globalErrorHandler, notFoundHandler } = require('../src/utils/errorHandler.js');
// Note: API routes have been consolidated to Vercel serverless functions in /api/
// This Express server now serves as a development fallback only

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use((req, res, next) => {
  applySecurityHeaders(res);
  next();
});

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getCorsOrigins();
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const { registerVercelApiRoutes } = require('./vercelRoutes.js');

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server (mount /api/* after listen so startup errors are visible)
async function startServer() {
  try {
    await registerVercelApiRoutes(app);
    // Re-register 404 after API routes (Express matches in registration order)
    app.use(notFoundHandler);
    app.use(globalErrorHandler);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 API: http://localhost:${PORT}/api/* (Vercel handlers for local dev)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
  