const express = require('express');
const cors = require('cors');

const app = express();

// ========================================================================
// CORS Configuration
// ========================================================================
// Allow requests from multiple frontend origins (member, admin, trainer portals)
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5500',
];

const configuredOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultAllowedOrigins;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser or same-origin requests with no origin header.
    if (!origin) return callback(null, true);

    // Allow configured origins and localhost on any port for local development.
    const isConfigured = configuredOrigins.includes(origin);
    const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);

    if (isConfigured || isLocalhost) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// ========================================================================
// Body Parser Middleware
// ========================================================================
// Parse incoming JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ========================================================================
// Request Logging Middleware
// ========================================================================
// Log all incoming requests (simple, beginner-friendly)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ========================================================================
// Health Check Route
// ========================================================================
// API landing route for root URL
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to IronCore Fitness API',
    docs: '/api/version',
    health: '/api/health',
  });
});

// Simple health check endpoint to verify server is running
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ========================================================================
// API Version Route
// ========================================================================
app.get('/api/version', (req, res) => {
  res.status(200).json({
    status: 'success',
    version: '1.0.0',
    name: 'IronCore Fitness API',
  });
});

// ========================================================================
// Routes Setup
// ========================================================================
// Import routes
const authRoutes = require('./routes/auth');
const trainerRoutes = require('./routes/trainers');
const classRoutes = require('./routes/classes');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const userRoutes = require('./routes/users');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);

// ========================================================================
// 404 Not Found Handler
// ========================================================================
// Catch any requests to undefined routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
  });
});

// ========================================================================
// Global Error Handler Middleware
// ========================================================================
// Catch all errors and send standardized error responses
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { error: err }),
  });
});

module.exports = app;
