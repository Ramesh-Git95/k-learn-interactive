/**
 * PayPal Account Verification
 * This will help verify which business account your client ID belongs to
 */

import fetch from 'node-fetch';

async function verifyPayPalAccounts() {
    console.log('🔍 PAYPAL SANDBOX ACCOUNT VERIFICATION');
    console.log('=====================================');
    
    const PAYPAL_CLIENT_ID = "Aa-iCAOutWockxTzJg7SqHatpnPjvuWd9uhv8sms2sTf36pkBLZYCb8sKf_hNZVVHqNUyo9-3Iy9IIb5";
    const PAYPAL_CLIENT_SECRET = "ECs82sRcivKYKy52rt_2JxedQ1aC6p-P7MZf5kiDTm0FTkr_cjivkqOh7ABL0ugpbtnTpBIabme4NwRq";
    
    try {
        // Get access token
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
        
        const response = await fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials'
        });
        
        const data = await response.json();
        
        if (data.access_token) {
            console.log('✅ Client ID is valid');
            
            // Get account info
            const accountResponse = await fetch('https://api.sandbox.paypal.com/v1/identity/oauth2/userinfo?schema=paypalv1.1', {
                headers: {
                    'Authorization': `Bearer ${data.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const accountData = await accountResponse.json();
            console.log('📧 Business Account Info:', accountData);
            
        } else {
            console.log('❌ Client ID validation failed:', data);
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('\n🎯 ACCOUNT SETUP SUMMARY:');
    console.log('========================');
    console.log('Business Account (receives payments):');
    console.log('  Email: sb-w47z43d45081919@business.example.com');
    console.log('  Password: %WAmqc@7');
    console.log('  Purpose: This is YOUR app account that receives subscription payments');
    console.log('');
    console.log('Personal Account (makes payments):');
    console.log('  Email: sb-ue214345667468@personal.example.com');
    console.log('  Password: &.}au)M8');
    console.log('  Purpose: This is the CUSTOMER account that pays for subscriptions');
    console.log('');
    console.log('✅ CORRECT TESTING FLOW:');
    console.log('1. Your app uses business account credentials (Client ID/Secret)');
    console.log('2. Customer logs in with personal account');
    console.log('3. Personal account pays business account');
    console.log('4. Business account receives the subscription payment');
}

verifyPayPalAccounts().catch(console.error);
