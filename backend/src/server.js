const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const searchRoutes = require('./routes/search');
const matchingRoutes = require('./routes/matching');
const imageProcessingRoutes = require('./routes/imageProcessing');
const cacheRoutes = require('./routes/cache');
const sessionRoutes = require('./routes/sessions');
const roomStyleRoutes = require('./routes/roomStyle');
const sessionMiddleware = require('./middleware/sessionMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(sessionMiddleware);

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/image-processing', imageProcessingRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/room-style', roomStyleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Interior Design Matcher API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});