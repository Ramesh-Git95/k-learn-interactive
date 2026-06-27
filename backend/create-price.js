// One-time setup script: creates the K-Learn Premium MONTHLY product + price.
// Run ONCE, locally, after putting STRIPE_SECRET_KEY in backend/.env:
//
//   cd backend && node create-price.js
//
// It prints a NEW price ID (price_...) — copy it into backend/.env as STRIPE_PRICE_ID,
// and also update STRIPE_PRICE_ID in Railway. Safe to share; the price ID is NOT secret.

require('dotenv').config();

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('❌ STRIPE_SECRET_KEY is missing. Add it to backend/.env first.');
  process.exit(1);
}
console.log(`🔑 Using Stripe key: ${key.slice(0, 8)}…  (mode: ${key.startsWith('sk_live') ? 'LIVE ⚠️' : 'test/sandbox ✅'})`);

// Extra retries + a longer timeout help on flaky connections (e.g. a dongle).
const stripe = require('stripe')(key, { maxNetworkRetries: 3, timeout: 30000 });

const PRICE_USD_CENTS = 400; // $4.00 / month recurring subscription

async function run() {
  try {
    console.log('🛠  Creating product "K-Learn Premium"…');
    const product = await stripe.products.create({
      name: 'K-Learn Premium',
      description: 'Monthly subscription — unlocks all premium features.',
    });
    console.log(`✅ Product created: ${product.id}`);

    console.log(`🛠  Creating recurring price ($${(PRICE_USD_CENTS / 100).toFixed(2)}/month)…`);
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: PRICE_USD_CENTS,
      currency: 'usd',
      recurring: { interval: 'month' }, // => monthly subscription
    });

    console.log('\n──────────────────────────────────────────────');
    console.log('✅ DONE. Copy this into backend/.env:');
    console.log(`\n   STRIPE_PRICE_ID=${price.id}\n`);
    console.log('──────────────────────────────────────────────');
  } catch (err) {
    console.error('❌ Failed to create price:', err.message);
    process.exit(1);
  }
}

run();
