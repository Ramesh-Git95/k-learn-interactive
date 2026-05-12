/**
 * PayPal Client ID Verification
 * This will test if your client ID is valid and working
 */

import fetch from 'node-fetch';

async function testPayPalClientID() {
    const clientId = "Aa-iCAOutWockxTzJg7SqHatpnPjvuWd9uhv8sms2sTf36pkBLZYCb8sKf_hNZVVHqNUyo9-3Iy9IIb5";
    const clientSecret = "ECs82sRcivKYKy52rt_2JxedQ1aC6p-P7MZf5kiDTm0FTkr_cjivkqOh7ABL0ugpbtnTpBIabme4NwRq";
    
    console.log('🔍 Testing PayPal Client ID:', clientId);
    
    try {
        // Test getting access token
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        
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
            console.log('✅ Client ID is valid and working');
            console.log('✅ Sandbox environment is accessible');
            
            // Test SDK URL manually
            const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
            console.log('🔗 SDK URL to test:', sdkUrl);
            
            // Simplified SDK URL for testing
            const simpleSdkUrl = `https://www.paypal.com/sdk/js?client-id=${clientId}`;
            console.log('🔗 Minimal SDK URL:', simpleSdkUrl);
            
        } else {
            console.log('❌ Client ID validation failed:', data);
        }
        
    } catch (error) {
        console.log('❌ Error testing client ID:', error.message);
    }
}

testPayPalClientID();
