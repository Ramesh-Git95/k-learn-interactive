/**
 * Add funds to PayPal Sandbox Account
 * This script adds funds to your sandbox buyer account
 */

import fetch from 'node-fetch';

// Your PayPal sandbox credentials
const PAYPAL_CLIENT_ID = "Aa-iCAOutWockxTzJg7SqHatpnPjvuWd9uhv8sms2sTf36pkBLZYCb8sKf_hNZVVHqNUyo9-3Iy9IIb5";
const PAYPAL_CLIENT_SECRET = "ECs82sRcivKYKy52rt_2JxedQ1aC6p-P7MZf5kiDTm0FTkr_cjivkqOh7ABL0ugpbtnTpBIabme4NwRq";
const PAYPAL_API_BASE = "https://api.sandbox.paypal.com";

// Your sandbox buyer account
const BUYER_EMAIL = "sb-oq9ms31932099@personal.example.com";

/**
 * Get Access Token
 */
async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });
  
  const data = await response.json();
  return data.access_token;
}

/**
 * Add funds to sandbox account
 */
async function addFundsToAccount() {
  try {
    console.log('🔄 Getting access token...');
    const accessToken = await getAccessToken();
    
    console.log('💰 Adding $100 to sandbox account...');
    
    // Note: PayPal doesn't allow direct fund addition via API
    // You need to do this through the sandbox dashboard
    
    console.log('🚨 ACTION REQUIRED:');
    console.log('To add funds to your sandbox account:');
    console.log('1. Go to: https://developer.paypal.com/');
    console.log('2. Log into your developer account');
    console.log('3. Go to "Sandbox" → "Accounts"');
    console.log(`4. Find your buyer account: ${BUYER_EMAIL}`);
    console.log('5. Click "..." → "View/edit account"');
    console.log('6. Go to "Funding" tab');
    console.log('7. Add funds (e.g., $100 USD)');
    console.log('');
    console.log('OR use the test card numbers I provided earlier!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
addFundsToAccount();
