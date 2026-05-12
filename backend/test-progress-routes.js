// Quick test to check if progress routes can be required without errors
console.log('Testing progress routes import...');

try {
  const progressRoutes = require('./routes/progress');
  console.log('✅ Progress routes imported successfully');
  
  const User = require('./models/User');
  console.log('✅ User model imported successfully');
  
  console.log('✅ All imports successful - server should work');
  process.exit(0);
} catch (error) {
  console.error('❌ Error importing progress routes:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}
