const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ ok: res.statusCode < 400, json: jsonData, status: res.statusCode });
        } catch (e) {
          resolve({ ok: res.statusCode < 400, text: data, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function checkServerStatus() {
  console.log('🔍 Checking server status on port 5001...');
  
  try {
    // Test basic root endpoint
    console.log('1. Testing root endpoint...');
    const rootResponse = await makeRequest('http://localhost:5001/');
    if (rootResponse.ok) {
      console.log('✅ Root endpoint response:', rootResponse.json);
    } else {
      console.log('❌ Root endpoint failed:', rootResponse.status);
    }
    
    // Test health endpoint
    console.log('2. Testing health endpoint...');
    const healthResponse = await makeRequest('http://localhost:5001/health');
    if (healthResponse.ok) {
      console.log('✅ Health endpoint response:', healthResponse.json);
    } else {
      console.log('❌ Health endpoint failed:', healthResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Server connectivity test failed:', error.message);
    console.log('🔍 This suggests the server is not running on port 5001');
  }
}

checkServerStatus();
