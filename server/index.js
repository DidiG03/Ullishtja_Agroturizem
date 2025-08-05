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
const menuCompleteRoutes = require('./api/menu-complete');
const reservationsCompleteRoutes = require('./api/reservations-complete');
const timeslotsCompleteRoutes = require('./api/timeslots-complete');
const googleReviewsRoutes = require('./api/googleReviews');
const restaurantSettingsRoutes = require('./api/restaurantSettings');
const blogRoutes = require('./api/blog');

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

// Routes
app.use('/api/menu-complete', menuCompleteRoutes);
app.use('/api/reservations-complete', reservationsCompleteRoutes);
app.use('/api/timeslots-complete', timeslotsCompleteRoutes);
app.use('/api/google-reviews', googleReviewsRoutes);
app.use('/api/restaurant-settings', restaurantSettingsRoutes);
app.use('/api/blog', blogRoutes);

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
  console.log(`📝 Google Reviews API: http://localhost:${PORT}/api/google-reviews`);
  console.log(`🍽️ Menu API: http://localhost:${PORT}/api/menu-complete`);
  console.log(`📅 Reservations API: http://localhost:${PORT}/api/reservations-complete`);
  console.log(`⏰ Timeslots API: http://localhost:${PORT}/api/timeslots-complete`);
  console.log(`📖 Blog API: http://localhost:${PORT}/api/blog/posts`);
  console.log(`📂 Blog Categories API: http://localhost:${PORT}/api/blog/categories`);
});
  