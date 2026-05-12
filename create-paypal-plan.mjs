/**
 * PayPal Subscription Plan Creation Script
 * 
 * This script creates a subscription plan using PayPal's REST API
 * Run this in your backend or use a tool like Postman
 */

import fetch from 'node-fetch';

// Your PayPal credentials
const PAYPAL_CLIENT_ID = "Aa-iCAOutWockxTzJg7SqHatpnPjvuWd9uhv8sms2sTf36pkBLZYCb8sKf_hNZVVHqNUyo9-3Iy9IIb5";
const PAYPAL_CLIENT_SECRET = "ECs82sRcivKYKy52rt_2JxedQ1aC6p-P7MZf5kiDTm0FTkr_cjivkqOh7ABL0ugpbtnTpBIabme4NwRq";
const PAYPAL_API_BASE = "https://api.sandbox.paypal.com"; // Sandbox URL

/**
 * Step 1: Get Access Token
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
 * Step 2: Create Product
 */
async function createProduct(accessToken) {
  const productData = {
    name: "Korean Learning Premium",
    description: "Premium Korean language learning subscription with unlimited AI conversations and advanced features",
    type: "SERVICE",
    category: "SOFTWARE",
    image_url: "https://your-domain.com/logo.png", // Optional
    home_url: "https://your-domain.com" // Optional
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `PRODUCT-${Date.now()}`, // Unique ID
    },
    body: JSON.stringify(productData)
  });

  const product = await response.json();
  
  if (product.name && product.name === 'INVALID_REQUEST') {
    throw new Error(`Product creation failed: ${product.message}\nDetails: ${JSON.stringify(product.details, null, 2)}`);
  }
  
  console.log('✅ Product created:', product);
  return product.id;
}

/**
 * Step 3: Create Subscription Plan
 */
async function createSubscriptionPlan(accessToken, productId) {
  const planData = {
    product_id: productId,
    name: "Premium Monthly Plan",
    description: "Monthly subscription for Korean Learning Premium features",
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: {
          interval_unit: "MONTH",
          interval_count: 1
        },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0, // 0 = unlimited
        pricing_scheme: {
          fixed_price: {
            value: "9.99",
            currency_code: "USD"
          }
        }
      }
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: "0",
        currency_code: "USD"
      },
      setup_fee_failure_action: "CONTINUE",
      payment_failure_threshold: 3
    },
    taxes: {
      percentage: "0",
      inclusive: false
    }
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `PLAN-${Date.now()}`, // Unique ID
    },
    body: JSON.stringify(planData)
  });

  const plan = await response.json();
  
  if (plan.name && plan.name === 'INVALID_REQUEST') {
    throw new Error(`Plan creation failed: ${plan.message}\nDetails: ${JSON.stringify(plan.details, null, 2)}`);
  }
  
  console.log('✅ Subscription plan created:', plan);
  return plan.id;
}

/**
 * Main function to create everything
 */
async function createPayPalSubscriptionPlan() {
  try {
    console.log('🔄 Getting PayPal access token...');
    const accessToken = await getAccessToken();
    
    console.log('🔄 Creating product...');
    const productId = await createProduct(accessToken);
    
    console.log('🔄 Creating subscription plan...');
    const planId = await createSubscriptionPlan(accessToken, productId);
    
    console.log('\n🎉 SUCCESS! Your PayPal subscription plan is ready:');
    console.log(`📦 Product ID: ${productId}`);
    console.log(`💳 Plan ID: ${planId}`);
    console.log('\n📝 Next steps:');
    console.log(`1. Copy this Plan ID: ${planId}`);
    console.log('2. Replace "P-YOUR-REAL-PLAN-ID-HERE" in your PayPalSubscription.tsx');
    console.log('3. Test the subscription flow in your app');
    
  } catch (error) {
    console.error('❌ Error creating subscription plan:', error);
  }
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createPayPalSubscriptionPlan };
}

// For browser/direct execution
if (typeof window !== 'undefined') {
  window.createPayPalSubscriptionPlan = createPayPalSubscriptionPlan;
}

// Auto-run if executed with Node.js
console.log('🚀 Starting PayPal plan creation...');
createPayPalSubscriptionPlan().catch(console.error);

/* 
 * USAGE INSTRUCTIONS:
 * 
 * Option 1 - Node.js:
 * 1. Save this as create-paypal-plan.js
 * 2. Run: node create-paypal-plan.js
 * 
 * Option 2 - Browser Console:
 * 1. Copy this entire script
 * 2. Paste in browser console on any page
 * 3. Run: createPayPalSubscriptionPlan()
 * 
 * Option 3 - Postman:
 * Use the API calls manually with your credentials
 */
