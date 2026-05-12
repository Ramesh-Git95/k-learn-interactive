// Quick script to create a price for your existing product
// Run this once to create the price ID

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createPrice() {
  try {
    const price = await stripe.prices.create({
      product: 'prod_Ss1lAQTY9il4GI', // Your product ID
      unit_amount: 999, // $9.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    
    console.log('✅ Price created successfully!');
    console.log('🎯 Your Price ID is:', price.id);
    console.log('💰 Price details:', {
      id: price.id,
      amount: '$' + (price.unit_amount / 100),
      interval: price.recurring.interval
    });
    
  } catch (error) {
    console.error('❌ Error creating price:', error.message);
  }
}

createPrice();
