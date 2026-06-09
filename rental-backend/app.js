const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/products');
const reviewRoutes = require('./routes/reviews');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const paymentController = require('./controllers/paymentController');

// 1. CORS is configured to allow cross-origin requests from the frontend
app.use(cors());

// 2. Parse incoming JSON requests
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
