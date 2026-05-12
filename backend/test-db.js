const mongoose = require('mongoose');
require('dotenv').config();

console.log('🟢 Testing MongoDB connection...');
console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/K-Learning');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/K-Learning';
    console.log('Attempting to connect to:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();
