// Test script to verify progress item saving in MongoDB
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testProgressSaving() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/korean-learning-app';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Find a test user (or create one)
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      console.log('Creating test user...');
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword', // In real app this would be bcrypt hashed
        progress: {
          items: {},
          stats: { totalWordsLearned: 0, sectionsCompleted: 0 },
          level: 'beginner',
          xp: 0,
          streak: 0
        }
      });
      await testUser.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user found');
    }

    console.log('\n🧪 Testing progress item updates...');
    
    // Test different types of progress keys
    const testCases = [
      { key: 'phrase_0', value: true },
      { key: 'phrase_1', value: true },
      { key: 'vocab_item_안녕하세요', value: true },
      { key: 'hangul_char_ㄱ', value: true },
      { key: 'grammar_pattern_0', value: true },
      { key: 'culture_tip_0', value: true }
    ];

    for (const testCase of testCases) {
      console.log(`\n📝 Testing: ${testCase.key} = ${testCase.value}`);
      
      // Update progress item
      testUser.progress.items[testCase.key] = testCase.value;
      
      // Mark as modified so MongoDB saves it
      testUser.markModified('progress.items');
      
      testUser.calculateStats();
      testUser.progress.lastActiveDate = new Date();
      
      // Save to database
      await testUser.save();
      
      // Reload from database to verify
      const reloadedUser = await User.findById(testUser._id);
      const savedValue = reloadedUser.progress.items[testCase.key];
      
      if (savedValue === testCase.value) {
        console.log(`✅ PASS: ${testCase.key} saved correctly as ${savedValue}`);
      } else {
        console.log(`❌ FAIL: ${testCase.key} expected ${testCase.value}, got ${savedValue}`);
      }
    }

    console.log('\n📊 Final progress state:');
    const finalUser = await User.findById(testUser._id);
    console.log('Progress items:', finalUser.progress.items);
    console.log('Stats:', finalUser.progress.stats);
    console.log('XP:', finalUser.progress.xp);

    console.log('\n🧪 Testing getProgress() method:');
    const progressData = finalUser.getProgress();
    console.log('getProgress() result:', progressData);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testProgressSaving().catch(console.error);
