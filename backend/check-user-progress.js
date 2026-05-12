const mongoose = require('mongoose');
require('dotenv').config();

async function checkUserProgress() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/K-Learning';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Import User model
    const User = require('./models/User');
    
    // Find the test user
    const user = await User.findOne({ email: 'test@gmail.com' });
    
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('🔍 User found:', user.email);
    console.log('🔍 User ID:', user._id);
    console.log('🔍 Current progress.items:');
    console.log(JSON.stringify(user.progress.items, null, 2));
    console.log('🔍 Progress items count:', Object.keys(user.progress.items || {}).length);
    
    // Show last update time
    console.log('🔍 Last active date:', user.progress.lastActiveDate);
    console.log('🔍 Document updated at:', user.updatedAt);
    
    // Show stats
    console.log('🔍 Stats:', JSON.stringify(user.progress.stats, null, 2));
    console.log('🔍 XP:', user.progress.xp);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkUserProgress();
