/**
 * CloudVault Server Entry Point
 * Express + MongoDB + JWT + AWS S3
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const fileRoutes = require('./routes/fileRoutes');
const folderRoutes = require('./routes/folderRoutes');
const shareRoutes = require('./routes/shareRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Middleware imports
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ── Security Middlewares ─────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// // Rate Limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//   max: process.env.NODE_ENV === 'development' ? 10000 : (parseInt(process.env.RATE_LIMIT_MAX) || 100),
//   message: { success: false, message: 'Too many requests, please try again later.' },
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api/', limiter);

// // Stricter limiter for auth routes
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: process.env.NODE_ENV === 'development' ? 1000 : 20,
//   message: { success: false, message: 'Too many authentication attempts.' },
// });

// ── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Sanitization ─────────────────────────────────────────────────────────────
app.use(mongoSanitize());

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CloudVault API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Redirect legacy share links without hash to the new HashRouter format
app.get('/share/:token', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  res.redirect(`${clientUrl}/#/share/${req.params.token}`);
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Database Connection ───────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Automatically rebuild indexes for the User model to prevent conflicts
    try {
      const User = require('./models/User');
      await User.syncIndexes();
      console.log('✅ User indexes synchronized successfully.');
    } catch (indexErr) {
      console.error('⚠️ Error synchronizing User indexes:', indexErr.message);
    }
    // Migrate existing files to set correct fileType
    const File = require('./models/File');
    const getFileType = (mimeType) => {
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.startsWith('audio/')) return 'audio';
      if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
      if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
      if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
      if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('7z')) return 'archive';
      if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css')) return 'code';
      return 'other';
    };

    const allFiles = await File.find({});
    let updatedFilesCount = 0;
    for (const file of allFiles) {
      const correctType = getFileType(file.mimeType);
      if (file.fileType !== correctType) {
        file.fileType = correctType;
        await file.save({ validateBeforeSave: false });
        updatedFilesCount++;
      }
    }
    if (updatedFilesCount > 0) {
      console.log(`✅ Migrated ${updatedFilesCount} files to their correct fileType.`);
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 CloudVault Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err?.stack || err?.message || err);
  // process.exit(1); // Removed to prevent the server from crashing on background errors
});

module.exports = app;
