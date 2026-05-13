const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('=================================');
console.log('🟢 STARTING KOREAN LEARNING BACKEND');
console.log('=================================');
console.log('📍 Environment Variables Loaded');
console.log('📍 Node Version:', process.version);
console.log('📍 Current Directory:', process.cwd());
console.log('=================================');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // needed for Gumroad ping (form-encoded)

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: '🎉 Korean Learning API is working!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Import routes
console.log('📂 Loading routes...');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const progressRoutes = require('./routes/progress');
const aiExamplesRoutes = require('./routes/ai-examples');
const srsRoutes = require('./routes/srs');
const aiRoutes = require('./routes/ai');
const gumroadRoutes = require('./routes/gumroad');
// const subscriptionRoutes = require('./routes/subscriptions'); // Temporarily disabled
console.log('✅ Routes loaded successfully');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ai-examples', aiExamplesRoutes);
app.use('/api/srs', srsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gumroad', gumroadRoutes);
// app.use('/api/subscriptions', subscriptionRoutes); // Temporarily disabled

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('📚 Attempting MongoDB connection...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/K-Learning';
    console.log('📚 MongoDB URI:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('❌ Full error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  console.log('🚀 Starting server initialization...');
  await connectDB();
  
  app.listen(PORT, () => {
    console.log('=================================');
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
    console.log(`🌍 Frontend CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📱 API URL: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log('=================================');
  });
};

console.log('📋 Calling startServer()...');
startServer().catch((error) => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});
