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
          resolve({ ok: res.statusCode < 400, json: () => jsonData, status: res.statusCode });
        } catch (e) {
          resolve({ ok: res.statusCode < 400, text: data, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testAPIConnectivity() {
  console.log('🔍 Testing API connectivity...');
  
  try {
    // Test basic health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await makeRequest('http://localhost:5001/health');
    if (healthResponse.ok) {
      const healthData = healthResponse.json();
      console.log('✅ Health check:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
      return;
    }
    
    // Test auth endpoint to get a token
    console.log('2. Testing auth endpoint...');
    const authResponse = await makeRequest('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (authResponse.ok) {
      const authData = authResponse.json();
      console.log('✅ Auth successful, token received');
      
      // Test progress endpoint
      console.log('3. Testing progress endpoint...');
      const progressResponse = await makeRequest('http://localhost:5001/api/progress/item', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          key: 'phrases_test_item',
          value: true
        })
      });
      
      const progressData = progressResponse.json();
      console.log('✅ Progress update response:', progressData);
      
    } else {
      const errorData = authResponse.json();
      console.log('❌ Auth failed:', errorData);
    }
    
  } catch (error) {
    console.error('❌ API connectivity test failed:', error.message);
  }
}

testAPIConnectivity();
