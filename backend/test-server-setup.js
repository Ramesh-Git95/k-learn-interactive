// Test server startup with all routes
const express = require('express');
require('dotenv').config();

console.log('🧪 Testing server startup...');

try {
  const app = express();
  
  // Basic middleware
  app.use(express.json());
  
  // Import all routes
  const authRoutes = require('./routes/auth');
  const userRoutes = require('./routes/users');
  const progressRoutes = require('./routes/progress');
  
  console.log('✅ All routes imported successfully');
  
  // Test route setup
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/progress', progressRoutes);
  
  console.log('✅ All routes configured successfully');
  console.log('✅ Server setup test passed - full server should work');
  
} catch (error) {
  console.error('❌ Server setup test failed:', error.message);
  console.error('Full error:', error);
}
