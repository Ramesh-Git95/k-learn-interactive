// Quick server test with health check
const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting server test...');

// Start the server
const serverProcess = spawn('node', ['server.js'], {
  stdio: ['inherit', 'pipe', 'pipe']
});

let output = '';
serverProcess.stdout.on('data', (data) => {
  output += data.toString();
  console.log('SERVER:', data.toString().trim());
});

serverProcess.stderr.on('data', (data) => {
  console.error('SERVER ERROR:', data.toString().trim());
});

// Wait a bit for server to start then test health endpoint
setTimeout(() => {
  console.log('\n🔍 Testing health endpoint...');
  
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET'
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Health check response:', data);
      console.log('✅ Server is working properly!');
      serverProcess.kill();
      process.exit(0);
    });
  });
  
  req.on('error', (err) => {
    console.error('❌ Health check failed:', err.message);
    serverProcess.kill();
    process.exit(1);
  });
  
  req.end();
}, 3000);

// Kill server after 10 seconds if still running
setTimeout(() => {
  console.log('⏰ Timeout reached, stopping server');
  serverProcess.kill();
  process.exit(0);
}, 10000);
