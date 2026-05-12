// Clean up test data and reset user progress for testing
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function cleanupTestData() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/korean-learning-app';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Find your test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    
    if (testUser) {
      console.log('🧹 Cleaning up test progress data...');
      
      // Reset progress to clean state
      testUser.progress.items = {};
      testUser.progress.stats = {
        totalWordsLearned: 0,
        sectionsCompleted: 0,
        totalTimeSpent: 0,
        quizzesTaken: 0,
        averageScore: 0
      };
      testUser.progress.xp = 0;
      testUser.progress.lastActiveDate = new Date();
      
      // Mark as modified and save
      testUser.markModified('progress.items');
      testUser.markModified('progress.stats');
      await testUser.save();
      
      console.log('✅ Test user progress reset');
      console.log('📊 Current progress items:', testUser.progress.items);
    } else {
      console.log('❌ Test user not found');
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

cleanupTestData().catch(console.error);
