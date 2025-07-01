const express = require('express');
const cors = require('cors');
const menuRoutes = require('./api/menu');

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Menu API server running on port ${PORT}`);
  console.log(`📋 Menu API available at http://localhost:${PORT}/api/menu`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
}); 