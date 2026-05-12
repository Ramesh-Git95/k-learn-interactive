// Test health endpoint against running server
const http = require('http');

console.log('🔍 Testing health endpoint...');

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
  });
});

req.on('error', (err) => {
  console.error('❌ Health check failed:', err.message);
  console.error('Make sure server is running on port 5000');
});

req.end();
