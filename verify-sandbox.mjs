/**
 * PayPal Sandbox Verification Script
 * This will help verify your sandbox setup is correct
 */

import fetch from 'node-fetch';

const PAYPAL_CLIENT_ID = "Aa-iCAOutWockxTzJg7SqHatpnPjvuWd9uhv8sms2sTf36pkBLZYCb8sKf_hNZVVHqNUyo9-3Iy9IIb5";
const PAYPAL_CLIENT_SECRET = "ECs82sRcivKYKy52rt_2JxedQ1aC6p-P7MZf5kiDTm0FTkr_cjivkqOh7ABL0ugpbtnTpBIabme4NwRq";

async function verifyPayPalSandbox() {
  console.log('🔍 VERIFYING PAYPAL SANDBOX CONFIGURATION');
  console.log('==========================================');
  
  // Test 1: Verify we're using sandbox URLs
  const sandboxBaseURL = "https://api.sandbox.paypal.com";
  console.log('✅ Using sandbox URL:', sandboxBaseURL);
  
  // Test 2: Get access token to verify credentials work
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${sandboxBaseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      console.log('✅ Sandbox credentials are valid');
      console.log('✅ Access token received (sandbox mode confirmed)');
      
      // Test 3: Verify the subscription plan exists in sandbox
      const planResponse = await fetch(`${sandboxBaseURL}/v1/billing/plans/P-7NG533434M885384WNC2ADRI`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const planData = await planResponse.json();
      
      if (planData.id) {
        console.log('✅ Subscription plan exists in sandbox:', planData.id);
        console.log('✅ Plan status:', planData.status);
      } else {
        console.log('❌ Plan not found or error:', planData);
      }
      
    } else {
      console.log('❌ Failed to get access token:', data);
    }
    
  } catch (error) {
    console.log('❌ Error verifying sandbox:', error);
  }
  
  console.log('\n🎯 SANDBOX TESTING INSTRUCTIONS:');
  console.log('1. Make sure you login to: https://www.sandbox.paypal.com (NOT paypal.com)');
  console.log('2. Use the sandbox buyer account: sb-oq9ms31932099@personal.example.com');
  console.log('3. Password: >8gB&]?g');
  console.log('4. The $5000 balance should be used automatically');
  console.log('5. NO real SMS/OTP should be required in pure sandbox mode');
  
  console.log('\n⚠️  IF STILL GETTING REAL OTP:');
  console.log('- Clear all browser cookies for paypal.com');
  console.log('- Use incognito/private browsing mode');
  console.log('- Make sure you\'re not logged into real PayPal in another tab');
}

verifyPayPalSandbox().catch(console.error);
