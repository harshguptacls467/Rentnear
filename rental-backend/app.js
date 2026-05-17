const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
// 1. CORS is configured to allow cross-origin requests from the frontend
app.use(cors());
// 2. Parse incoming JSON requests
app.use(express.json());

// Routes
app.use('/api', healthRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
