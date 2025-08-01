require('dotenv').config();
const express = require('express');
const cors = require('cors');
const menuRoutes = require('./api/menu');
const reservationRoutes = require('./api/reservations');
const googleReviewsRoutes = require('./api/googleReviews');
const restaurantSettingsRoutes = require('./api/restaurantSettings');
const timeslotsRoutes = require('./api/timeslots');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/google-reviews', googleReviewsRoutes);
app.use('/api/restaurant-settings', restaurantSettingsRoutes);
app.use('/api/timeslots', timeslotsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Google Reviews API: http://localhost:${PORT}/api/google-reviews`);
  console.log(`🍽️ Menu API: http://localhost:${PORT}/api/menu/complete`);
});
  