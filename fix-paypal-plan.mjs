/**
 * Create a new working PayPal subscription plan
 */

import fetch from 'node-fetch';

const PAYPAL_CLIENT_ID = "Aa-iCAOutWockxTzJg7SqHatpnPjvuWd9uhv8sms2sTf36pkBLZYCb8sKf_hNZVVHqNUyo9-3Iy9IIb5";
const PAYPAL_CLIENT_SECRET = "ECs82sRcivKYKy52rt_2JxedQ1aC6p-P7MZf5kiDTm0FTkr_cjivkqOh7ABL0ugpbtnTpBIabme4NwRq";
const PAYPAL_API_BASE = "https://api.sandbox.paypal.com";

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

async function createProduct(accessToken) {
  const productData = {
    name: "K-Learn Premium Subscription",
    description: "Premium Korean learning features with unlimited AI conversations",
    type: "SERVICE",
    category: "SOFTWARE"
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `PRODUCT-${Date.now()}`,
    },
    body: JSON.stringify(productData)
  });

  const product = await response.json();
  
  if (product.name && product.name === 'INVALID_REQUEST') {
    throw new Error(`Product creation failed: ${product.message}`);
  }
  
  console.log('✅ Product created:', product.id);
  return product.id;
}

async function createSubscriptionPlan(accessToken, productId) {
  const planData = {
    product_id: productId,
    name: "Premium Monthly Plan",
    description: "Monthly subscription for K-Learn Premium",
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: {
          interval_unit: "MONTH",
          interval_count: 1
        },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
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
    }
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `PLAN-${Date.now()}`,
    },
    body: JSON.stringify(planData)
  });

  const plan = await response.json();
  
  if (plan.name && plan.name === 'INVALID_REQUEST') {
    throw new Error(`Plan creation failed: ${plan.message}`);
  }
  
  console.log('✅ Subscription plan created:', plan.id);
  return plan.id;
}

async function createNewPlan() {
  try {
    console.log('🔄 Creating new PayPal subscription plan...');
    const accessToken = await getAccessToken();
    
    console.log('🔄 Creating product...');
    const productId = await createProduct(accessToken);
    
    console.log('🔄 Creating subscription plan...');
    const planId = await createSubscriptionPlan(accessToken, productId);
    
    console.log('\n🎉 NEW PLAN CREATED SUCCESSFULLY!');
    console.log(`📦 Product ID: ${productId}`);
    console.log(`💳 Plan ID: ${planId}`);
    console.log('\n📝 Next steps:');
    console.log(`1. Copy this new Plan ID: ${planId}`);
    console.log('2. I will update your React app with this new plan ID');
    
    return planId;
    
  } catch (error) {
    console.error('❌ Error creating plan:', error);
    throw error;
  }
}

export { createNewPlan };

// Run the script
createNewPlan().catch(console.error);
