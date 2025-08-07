require('dotenv').config();

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

// Routes - All API functionality moved to Vercel serverless functions
// Express server is now only used for development health checks

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`\n🚀 API endpoints are served by Vercel serverless functions in /api/`);
  console.log(`📝 All business logic moved to Vercel for better performance`);
});
  