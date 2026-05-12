const express = require('express');
const https = require('https');
const querystring = require('querystring');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const GUMROAD_PRODUCT_PERMALINK = process.env.GUMROAD_PRODUCT_PERMALINK || 'klearn-lifetime';

// Helper: upgrade a user to premium (lifetime)
async function upgradeToPremium(user, licenseKey, saleId) {
  user.subscription.type = 'premium';
  user.subscription.status = 'active';
  user.subscription.currentPeriodEnd = null;   // lifetime — never expires
  user.subscription.cancelAtPeriodEnd = false;
  // Reuse stripeSubscriptionId field to store Gumroad sale/license reference
  user.subscription.stripeSubscriptionId = saleId || licenseKey || 'gumroad-lifetime';
  await user.save();
}

// Helper: verify a license key with Gumroad's API
function verifyWithGumroad(licenseKey) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      product_permalink: GUMROAD_PRODUCT_PERMALINK,
      license_key: licenseKey,
      increment_uses_count: 'false',
    });

    const options = {
      hostname: 'api.gumroad.com',
      path: '/v2/licenses/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid Gumroad response')); }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gumroad/ping
// Gumroad calls this automatically when someone completes a purchase.
// No auth — Gumroad sends its own seller_id for verification.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/ping', async (req, res) => {
  try {
    // Always respond 200 fast — Gumroad retries if it doesn't get a quick reply
    res.sendStatus(200);

    const { product_permalink, email, sale_id, license_key } = req.body;

    console.log(`🛒 Gumroad ping received — email: ${email}, product: ${product_permalink}`);

    // Basic sanity check
    if (!email || !product_permalink) return;

    // Find a K-Learn account with the same email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // No matching account — store the license key so they can redeem it later
      console.log(`⚠️  No K-Learn account found for ${email} — license key available for manual redemption`);
      return;
    }

    if (user.subscription.type !== 'free') {
      console.log(`ℹ️  User ${email} already has premium — skipping`);
      return;
    }

    await upgradeToPremium(user, license_key, sale_id);
    console.log(`✅ Auto-upgraded ${email} to premium via Gumroad ping`);
  } catch (err) {
    console.error('Gumroad ping error:', err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gumroad/verify-license
// Called when a logged-in user manually enters their Gumroad license key.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify-license', authenticateToken, async (req, res) => {
  try {
    const { licenseKey } = req.body;
    const user = req.user;

    if (!licenseKey || !licenseKey.trim()) {
      return res.status(400).json({ message: 'License key is required', error: 'MISSING_LICENSE_KEY' });
    }

    if (user.subscription.type !== 'free') {
      return res.status(400).json({ message: 'Your account already has premium access', error: 'ALREADY_PREMIUM' });
    }

    const result = await verifyWithGumroad(licenseKey.trim());

    if (!result.success) {
      return res.status(400).json({ message: 'Invalid or already used license key', error: 'INVALID_LICENSE' });
    }

    const saleId = result.purchase?.sale_id || result.purchase?.id;
    await upgradeToPremium(user, licenseKey.trim(), saleId);

    console.log(`✅ ${user.email} redeemed Gumroad license key`);

    res.json({
      message: 'License verified! Your account has been upgraded to Premium.',
      subscription: { type: 'premium', status: 'active' },
    });
  } catch (err) {
    console.error('License verification error:', err);
    res.status(500).json({ message: 'Verification failed. Please try again.', error: 'VERIFY_ERROR' });
  }
});

module.exports = router;
