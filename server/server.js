require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Trust proxy (required for Render, Heroku, Railway, etc.)
app.set('trust proxy', 1);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in controllers
app.set('io', io);

// ============ MIDDLEWARE ============

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'wss:', 'ws:'],
    },
  },
}));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:3000',
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting - general
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api/', limiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB injection protection
app.use(mongoSanitize({
  replaceWith: '_',
}));

// ============ ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ComplaintEase API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Public routes (no auth)
app.use('/api/departments', publicRoutes);

// Protected routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);

// ============ SOCKET.IO ============

const connectedUsers = new Map();

io.on('connection', (socket) => {
  // Join personal room
  socket.on('join:user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      connectedUsers.set(userId, socket.id);
    }
  });

  // Join complaint room (for live comment updates)
  socket.on('join:complaint', (complaintId) => {
    if (complaintId) socket.join(`complaint_${complaintId}`);
  });

  socket.on('leave:complaint', (complaintId) => {
    if (complaintId) socket.leave(`complaint_${complaintId}`);
  });

  // Typing indicator
  socket.on('typing:start', ({ complaintId, userId, userName }) => {
    socket.to(`complaint_${complaintId}`).emit('typing:start', { userId, userName });
  });

  socket.on('typing:stop', ({ complaintId, userId }) => {
    socket.to(`complaint_${complaintId}`).emit('typing:stop', { userId });
  });

  socket.on('disconnect', () => {
    connectedUsers.forEach((socketId, userId) => {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
      }
    });
  });
});

// ============ ERROR HANDLING ============
app.use(notFound);
app.use(errorHandler);

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n  ╔════════════════════════════════════════╗`);
  console.log(`  ║         ComplaintEase API Server       ║`);
  console.log(`  ╠════════════════════════════════════════╣`);
  console.log(`  ║  🚀 Port: ${PORT}                          ║`);
  console.log(`  ║  🌐 Environment: ${process.env.NODE_ENV || 'development'}           ║`);
  console.log(`  ║  📡 Socket.io: enabled                 ║`);
  console.log(`  ╚════════════════════════════════════════╝\n`);
});

module.exports = { app, server, io };
