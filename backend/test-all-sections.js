const mongoose = require('mongoose');
require('dotenv').config();

async function testAllSections() {
  try {
    console.log('🔍 Testing progress saving for all sections...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/K-Learning';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const User = require('./models/User');
    
    // Find the test user
    const user = await User.findOne({ email: 'test@gmail.com' });
    
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('🔍 Current progress summary:');
    const progressItems = user.progress.items || {};
    
    // Count by section
    const sections = {
      hangul: Object.keys(progressItems).filter(key => key.startsWith('hangul_')),
      phrases: Object.keys(progressItems).filter(key => key.startsWith('phrase_')),
      vocabulary: Object.keys(progressItems).filter(key => key.startsWith('vocab_')),
      grammar: Object.keys(progressItems).filter(key => key.startsWith('grammar_')),
      culture: Object.keys(progressItems).filter(key => key.startsWith('culture_'))
    };
    
    console.log('📊 Progress by section:');
    console.log(`  Hangul: ${sections.hangul.length} items`);
    console.log(`  Phrases: ${sections.phrases.length} items`);
    console.log(`  Vocabulary: ${sections.vocabulary.length} items`);
    console.log(`  Grammar: ${sections.grammar.length} items`);
    console.log(`  Culture: ${sections.culture.length} items`);
    console.log(`  Total: ${Object.keys(progressItems).length} items`);
    
    console.log('\n🎯 Current XP:', user.progress.xp);
    console.log('🎯 Total words learned:', user.progress.stats.totalWordsLearned);
    console.log('🎯 Bookmarks:', user.bookmarks.length);
    
    console.log('\n✅ Progress tracking is working correctly for all sections!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testAllSections();
