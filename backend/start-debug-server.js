console.log('🔍 KOREAN LEARNING APP - BACKEND DEBUGGING DIAGNOSTICS');
console.log('===================================================');

// Check if this is the current server instance
console.log('📍 Current Process ID:', process.pid);
console.log('📍 Current Working Directory:', process.cwd());
console.log('📍 Node Version:', process.version);
console.log('📍 Environment:', process.env.NODE_ENV || 'development');

// Check for any existing processes
const { execSync } = require('child_process');

try {
  // Check what's running on port 5001 (Windows)
  const portCheck = execSync('netstat -ano | findstr :5001', { encoding: 'utf8' });
  console.log('🔍 Port 5001 usage:');
  console.log(portCheck);
} catch (error) {
  console.log('🔍 No processes found on port 5001 or error checking:', error.message);
}

// Start the actual server
console.log('🚀 Starting the Korean Learning Backend Server...');
require('./server.js');
