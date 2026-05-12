const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

console.log('=== DEBUGGING SERVER ===');

const app = express();

// Middleware
console.log('1. Setting up middleware...');
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
console.log('✅ Middleware setup complete');

// Basic routes
console.log('2. Setting up basic routes...');
app.get('/', (req, res) => {
  res.json({ 
    message: '🎉 Korean Learning API is working!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});
console.log('✅ Basic routes setup complete');

// Error handling
console.log('3. Setting up error handling...');
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
console.log('✅ Error handling setup complete');

// MongoDB connection
console.log('4. Connecting to MongoDB...');
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/korean-learning-app';
    console.log('MongoDB URI:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error('❌ MongoDB error:', error.message);
    throw error;
  }
};

// Start server
console.log('5. Starting server...');
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log('=== SERVER STARTED ===');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Test URL: http://localhost:${PORT}`);
      console.log(`🏥 Health URL: http://localhost:${PORT}/health`);
      console.log('=====================');
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
