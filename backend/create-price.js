// One-time setup script: creates the K-Learn Lifetime product + price in Stripe.
// Run ONCE, locally, after putting STRIPE_SECRET_KEY in backend/.env:
//
//   cd backend && node create-price.js
//
// It prints a price ID (price_...) — copy that into backend/.env as STRIPE_PRICE_ID.
// Safe to share the printed price ID with anyone; it is NOT secret.

require('dotenv').config();

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('❌ STRIPE_SECRET_KEY is missing. Add it to backend/.env first.');
  process.exit(1);
}
console.log(`🔑 Using Stripe key: ${key.slice(0, 8)}…  (mode: ${key.startsWith('sk_live') ? 'LIVE ⚠️' : 'test/sandbox ✅'})`);

// Extra retries + a longer timeout help on flaky connections (e.g. a dongle).
const stripe = require('stripe')(key, { maxNetworkRetries: 3, timeout: 30000 });

const PRICE_USD_CENTS = 3900; // $39.00 one-time — matches the current Gumroad lifetime price

async function run() {
  try {
    console.log('🛠  Creating product "K-Learn Lifetime Access"…');
    const product = await stripe.products.create({
      name: 'K-Learn Lifetime Access',
      description: 'One-time payment — unlocks all premium features forever.',
    });
    console.log(`✅ Product created: ${product.id}`);

    console.log(`🛠  Creating one-time price ($${(PRICE_USD_CENTS / 100).toFixed(2)} USD)…`);
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: PRICE_USD_CENTS,
      currency: 'usd',
      // No `recurring` block => one-time payment.
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
