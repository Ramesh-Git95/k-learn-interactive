const express = require('express');
const https = require('https');
const querystring = require('querystring');
const mongoose = require('mongoose');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

const GUMROAD_PRODUCT_PERMALINK = process.env.GUMROAD_PRODUCT_PERMALINK || 'klearn-lifetime';

// Stores short-lived codes sent to the Gumroad purchase email for ownership proof
const claimCodeSchema = new mongoose.Schema({
  email:     { type: String, required: true, lowercase: true, trim: true },
  code:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '15m' },
});
const ClaimCode = mongoose.models.ClaimCode
  || mongoose.model('ClaimCode', claimCodeSchema);

// Stores purchases where the buyer email didn't match any K-Learn account
const pendingUpgradeSchema = new mongoose.Schema({
  email:      { type: String, required: true, lowercase: true, trim: true },
  saleId:     String,
  licenseKey: String,
  createdAt:  { type: Date, default: Date.now, expires: '30d' },
});
const PendingUpgrade = mongoose.models.PendingUpgrade
  || mongoose.model('PendingUpgrade', pendingUpgradeSchema);

// Helper: upgrade a user to premium (lifetime)
async function upgradeToPremium(user, licenseKey, saleId) {
  user.subscription.type = 'premium';
  user.subscription.status = 'active';
  user.subscription.currentPeriodEnd = null;
  user.subscription.cancelAtPeriodEnd = false;
  user.subscription.stripeSubscriptionId = saleId || licenseKey || 'gumroad-lifetime';
  await user.save();
}

// Helper: verify a license key with Gumroad's API
function verifyWithGumroad(licenseKey) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      product_permalink: GUMROAD_PRODUCT_PERMALINK,
      license_key: licenseKey,
      increment_uses_count: 'true',
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
// POST /api/gumroad/ping  — called by Gumroad on every purchase
// ─────────────────────────────────────────────────────────────────────────────
router.post('/ping', async (req, res) => {
  try {
    res.sendStatus(200); // respond fast — Gumroad retries on timeout

    const { product_permalink, email, sale_id, license_key } = req.body;
    console.log(`🛒 Gumroad ping — email: ${email}, product: ${product_permalink}`);

    if (!email || !product_permalink) return;

    if (product_permalink !== GUMROAD_PRODUCT_PERMALINK) {
      console.log(`⚠️  Ignoring ping for unknown product: ${product_permalink}`);
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Save for later — buyer can claim via /claim-purchase
      await PendingUpgrade.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { email: email.toLowerCase().trim(), saleId: sale_id, licenseKey: license_key },
        { upsert: true }
      );
      console.log(`⚠️  No K-Learn account for ${email} — stored as pending upgrade`);
      return;
    }

    if (user.subscription.type !== 'free') {
      console.log(`ℹ️  ${email} already has premium`);
      return;
    }

    await upgradeToPremium(user, license_key, sale_id);
    console.log(`✅ Auto-upgraded ${email} to premium via Gumroad ping`);
  } catch (err) {
    console.error('Gumroad ping error:', err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gumroad/send-claim-code
// Step 1: verify a purchase exists for the given email, then email a
// 6-digit code to that address so the user can prove they own it.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/send-claim-code', authenticateToken, async (req, res) => {
  try {
    const { purchaseEmail } = req.body;
    const user = req.user;

    if (!purchaseEmail || !purchaseEmail.trim()) {
      return res.status(400).json({ message: 'Purchase email is required' });
    }

    if (user.subscription.type !== 'free') {
      return res.status(400).json({ message: 'Your account already has premium access' });
    }

    const normalised = purchaseEmail.toLowerCase().trim();
    const pending = await PendingUpgrade.findOne({ email: normalised });

    if (!pending) {
      return res.status(404).json({
        message: 'No purchase found for that email. Make sure you use the exact email from your Gumroad receipt.',
        error: 'NOT_FOUND',
      });
    }

    // Generate a fresh 6-digit code, replacing any existing one
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await ClaimCode.findOneAndUpdate(
      { email: normalised },
      { email: normalised, code },
      { upsert: true }
    );

    await emailService.sendClaimCode(normalised, code);
    console.log(`📧 Claim code sent to ${normalised} for user ${user.email}`);

    res.json({ message: `Verification code sent to ${normalised}` });
  } catch (err) {
    console.error('Send claim code error:', err);
    res.status(500).json({ message: 'Failed to send verification code. Please try again.', error: 'SEND_CODE_ERROR' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gumroad/claim-purchase
// Step 2: verify the code the user received, then upgrade their account.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/claim-purchase', authenticateToken, async (req, res) => {
  try {
    const { purchaseEmail, code } = req.body;
    const user = req.user;

    if (!purchaseEmail || !purchaseEmail.trim()) {
      return res.status(400).json({ message: 'Purchase email is required' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    if (user.subscription.type !== 'free') {
      return res.status(400).json({ message: 'Your account already has premium access' });
    }

    const normalised = purchaseEmail.toLowerCase().trim();

    const claimCode = await ClaimCode.findOne({ email: normalised });
    if (!claimCode || claimCode.code !== code.trim()) {
      return res.status(400).json({
        message: 'Invalid or expired verification code. Please request a new one.',
        error: 'INVALID_CODE',
      });
    }

    const pending = await PendingUpgrade.findOne({ email: normalised });
    if (!pending) {
      return res.status(404).json({
        message: 'Purchase record no longer found. Please contact support.',
        error: 'NOT_FOUND',
      });
    }

    await upgradeToPremium(user, pending.licenseKey, pending.saleId);
    await Promise.all([
      PendingUpgrade.deleteOne({ _id: pending._id }),
      ClaimCode.deleteOne({ email: normalised }),
    ]);

    console.log(`✅ ${user.email} claimed purchase from ${purchaseEmail} (code verified)`);

    res.json({
      message: 'Purchase verified! Your account has been upgraded to Premium.',
      subscription: { type: 'premium', status: 'active' },
    });
  } catch (err) {
    console.error('Claim purchase error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.', error: 'CLAIM_ERROR' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gumroad/verify-license
// Manual license key entry fallback
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
      return res.status(400).json({ message: 'Invalid license key', error: 'INVALID_LICENSE' });
    }

    // uses_count is incremented on every verify call (increment_uses_count: 'true').
    // A count > 1 means the key was already redeemed by someone else.
    if ((result.purchase?.uses_count ?? 0) > 1) {
      return res.status(400).json({ message: 'This license key has already been redeemed on another account.', error: 'KEY_ALREADY_USED' });
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
