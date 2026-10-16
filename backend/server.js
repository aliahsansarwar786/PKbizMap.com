require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const sanitizeHtml = require('sanitize-html');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const { getDbError } = require('./config/db');
const mongoose = require('mongoose');
const errorHandler = require('./middlewares/errorHandler');

// ─── Route imports ────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const settingRoutes = require('./routes/settingRoutes');

// ─── Initialize Express app ───────────────────────────────────────────────────
const app = express();

// ─── Trust Proxy (Required for Vercel / reverse proxy IP rate-limiting) ──────
app.set('trust proxy', 1);

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── Security: Helmet (secure HTTP headers) ───────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ─── CORS Configuration ───────────────────────────────────────────────────────
// Only allow requests from configured and production frontend URLs
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://bizprimehub.vercel.app',
  'https://pkbizmap.vercel.app',
  'https://pkbizmap-com.vercel.app',
  'https://pkbizmap-frontend.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Allow exact matches
    if (allowedOrigins.filter(Boolean).includes(origin)) {
      return callback(null, true);
    }

    // Allow all vercel preview deployments for bizprimehub and pkbizmap
    if (/^https:\/\/(bizprimehub|pkbizmap)[a-zA-Z0-9-]*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: Origin "${origin}" is not allowed.`));
  },
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight

// ─── Request Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Security: Input Sanitization ────────────────────────────────────────────
app.use(mongoSanitize()); // Prevent NoSQL injection ($, . stripping)
// Fields exempt from HTML entity encoding / sanitization:
// - Whitelisted enum fields (category, country): strictly validated against exact safe string lists
// - Password fields: must preserve raw characters (including &, <, >) and are never rendered in HTML
// - OTP, tokens, and email fields
const SANITIZE_EXEMPT_FIELDS = new Set([
  'category',
  'country',
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'otp',
  'resetToken',
  'email',
  'newEmail',
]);

// ─── Security: XSS Protection (sanitize string fields in body) ───────────────
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj) => {
      for (const key of Object.keys(obj)) {
        if (SANITIZE_EXEMPT_FIELDS.has(key)) {
          continue;
        }
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeHtml(obj[key], { allowedTags: [], allowedAttributes: {} });
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
}); // Prevent XSS attacks

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Production: only log errors
  app.use(
    morgan('combined', {
      skip: (req, res) => res.statusCode < 400,
    })
  );
}

// ─── Rate Limiters ────────────────────────────────────────────────────────────
// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general limiter globally
app.use('/api', generalLimiter);

// ─── Ensure MongoDB connection before API routes (Serverless ready) ───────────
app.use(async (req, res, next) => {
  if (req.path === '/api/health' || req.path === '/' || req.path === '/favicon.ico') {
    return next();
  }
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (e) {}
  }
  next();
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/verify-email', authLimiter);
app.use('/api/auth/resend-otp', authLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/verify-reset-otp', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/auth/resend-reset-otp', passwordResetLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingRoutes);

// ─── Health check endpoint ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const dbError = getDbError ? getDbError() : null;

  res.status(200).json({
    success: true,
    message: 'Business Directory API is running.',
    database: {
      status: isConnected ? 'connected' : 'disconnected',
      host: isConnected ? mongoose.connection.host : null,
      error: !isConnected ? dbError : null,
    },
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Root and Favicon routes ──────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).send('BizPrimeHub Backend API is running.');
});
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ─── Handle unknown routes ────────────────────────────────────────────────────
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Centralized Error Handler (MUST be last middleware) ──────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// ─── Handle unhandled promise rejections ──────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Promise Rejection:', err.message);
  // Gracefully close server before exiting
  server.close(() => {
    process.exit(1);
  });
});

// ─── Handle uncaught exceptions ───────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;
