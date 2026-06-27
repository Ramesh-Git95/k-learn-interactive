const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Lazily construct the Stripe client so a missing key produces a clear log
// rather than crashing the whole server at startup.
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Extra retries + a longer timeout help on flaky connections (e.g. a dongle).
  return require('stripe')(key, { maxNetworkRetries: 3, timeout: 30000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stripe/create-checkout-session
// Creates a one-time Stripe Checkout session for the logged-in user and returns
// its hosted-page URL. The frontend redirects the browser to that URL.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  console.log('💳 [STRIPE] create-checkout-session called');
  try {
    const stripe = getStripe();
    if (!stripe) {
      console.error('❌ [STRIPE] STRIPE_SECRET_KEY is not set on the server');
      return res.status(500).json({ message: 'Payment system not configured', error: 'NO_STRIPE_KEY' });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      console.error('❌ [STRIPE] STRIPE_PRICE_ID is not set — run create-price.js and add it to .env');
      return res.status(500).json({ message: 'Payment system not configured', error: 'NO_PRICE_ID' });
    }

    const user = req.user;
    console.log(`💳 [STRIPE] user: ${user.email} (${user._id}), current plan: ${user.subscription?.type}`);

    if (user.subscription?.type !== 'free') {
      console.log('ℹ️  [STRIPE] user already premium — not creating a session');
      return res.status(400).json({ message: 'Your account already has premium access', error: 'ALREADY_PREMIUM' });
    }

    // Where Stripe sends the browser after success/cancel. Hash routes back to the profile.
    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
    console.log(`💳 [STRIPE] frontend redirect base: ${frontendUrl}`);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', // recurring monthly subscription
      line_items: [{ price: priceId, quantity: 1 }],
      // client_reference_id ties the payment to THIS account — the webhook reads
      // it to know who to upgrade. No email-matching/claim dance needed.
      client_reference_id: String(user._id),
      customer_email: user.email,
      success_url: `${frontendUrl}/?checkout=success#profile`,
      cancel_url: `${frontendUrl}/?checkout=cancel#profile`,
      metadata: { userId: String(user._id), email: user.email },
    });

    console.log(`✅ [STRIPE] session created: ${session.id}`);
    console.log(`✅ [STRIPE] redirect url: ${session.url}`);

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('❌ [STRIPE] Failed to create checkout session:', err.message);
    res.status(500).json({ message: 'Could not start checkout. Please try again.', error: 'CHECKOUT_ERROR' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stripe/create-portal-session
// Returns a Stripe Customer Portal URL where the user can cancel / update their
// card / view invoices. The frontend redirects the browser there.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-portal-session', authenticateToken, async (req, res) => {
  console.log('🧾 [STRIPE] create-portal-session called');
  try {
    const stripe = getStripe();
    if (!stripe) {
      console.error('❌ [STRIPE] STRIPE_SECRET_KEY is not set');
      return res.status(500).json({ message: 'Payment system not configured', error: 'NO_STRIPE_KEY' });
    }

    const user = req.user;
    const customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      console.error(`❌ [STRIPE] no stripeCustomerId for ${user.email} — nothing to manage`);
      return res.status(400).json({ message: 'No subscription to manage on this account.', error: 'NO_CUSTOMER' });
    }

    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendUrl}/#profile`,
    });

    console.log(`✅ [STRIPE] portal session for ${user.email}: ${portal.url}`);
    res.json({ url: portal.url });
  } catch (err) {
    console.error('❌ [STRIPE] Failed to create portal session:', err.message);
    res.status(500).json({ message: 'Could not open the billing portal. Please try again.', error: 'PORTAL_ERROR' });
  }
});

// Activate (or re-sync) a user's subscription from a completed Checkout session.
// Re-writing the same premium state is harmless, so duplicate webhook deliveries
// never cause a "double grant" — and the actual money is one Stripe subscription,
// not a second charge.
async function activateSubscription(userId, session, stripe) {
  const user = await User.findById(userId);
  if (!user) {
    console.error(`❌ [STRIPE webhook] no user found for id ${userId}`);
    return;
  }

  // Pull the live subscription details (period end, status, cancel flag) from Stripe.
  let periodStart = null, periodEnd = null, cancelAtPeriodEnd = false, status = 'active';
  if (session.subscription) {
    try {
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      status = sub.status === 'trialing' ? 'trialing' : 'active';
      cancelAtPeriodEnd = !!sub.cancel_at_period_end;
      // Newer Stripe API versions moved the billing period onto the subscription
      // ITEM rather than the subscription itself — read the item first, then fall
      // back to the top-level field for older API versions.
      const item = sub.items && sub.items.data && sub.items.data[0];
      const rawStart = (item && item.current_period_start) || sub.current_period_start;
      const rawEnd = (item && item.current_period_end) || sub.current_period_end;
      if (rawStart) periodStart = new Date(rawStart * 1000);
      if (rawEnd) periodEnd = new Date(rawEnd * 1000);
    } catch (e) {
      console.error('❌ [STRIPE webhook] could not retrieve subscription:', e.message);
    }
  }

  user.subscription.type = 'premium';
  user.subscription.status = status;
  user.subscription.currentPeriodStart = periodStart;
  user.subscription.currentPeriodEnd = periodEnd;
  user.subscription.cancelAtPeriodEnd = cancelAtPeriodEnd;
  user.subscription.stripeCustomerId = session.customer || user.subscription.stripeCustomerId;
  user.subscription.stripeSubscriptionId = session.subscription || user.subscription.stripeSubscriptionId;
  await user.save();
  console.log(`✅ [STRIPE webhook] ${user.email} → premium until ${periodEnd ? periodEnd.toISOString() : '(no end)'}`);
}

// Find the K-Learn user that owns a given Stripe subscription.
async function findUserBySubscription(sub) {
  let user = await User.findOne({ 'subscription.stripeSubscriptionId': sub.id });
  if (!user && sub.customer) {
    user = await User.findOne({ 'subscription.stripeCustomerId': sub.customer });
  }
  return user;
}

// customer.subscription.updated — renewals, scheduled cancels, past_due, etc.
// Keep access while the subscription is alive (active/trialing, and past_due as a
// grace window); revert to free if Stripe reports it as ended.
async function syncUserFromSubscription(sub) {
  const user = await findUserBySubscription(sub);
  if (!user) {
    console.error(`❌ [STRIPE webhook] no user for subscription ${sub.id} / customer ${sub.customer}`);
    return;
  }

  const ENDED = ['canceled', 'unpaid', 'incomplete_expired'];
  if (ENDED.includes(sub.status)) {
    user.subscription.type = 'free';
    user.subscription.status = 'canceled';
    user.subscription.cancelAtPeriodEnd = false;
    await user.save();
    console.log(`⬇️  [STRIPE webhook] ${user.email} subscription ${sub.status} → reverted to free`);
    return;
  }

  // Alive: active / trialing / past_due. Keep status 'active' so access is retained
  // during payment retries (grace); a final cancellation arrives as a separate event.
  const item = sub.items && sub.items.data && sub.items.data[0];
  const rawEnd = (item && item.current_period_end) || sub.current_period_end;
  user.subscription.type = 'premium';
  user.subscription.status = 'active';
  user.subscription.cancelAtPeriodEnd = !!sub.cancel_at_period_end;
  if (rawEnd) user.subscription.currentPeriodEnd = new Date(rawEnd * 1000);
  await user.save();

  const note = sub.cancel_at_period_end ? ' (cancels at period end)' : (sub.status === 'past_due' ? ' (past_due — grace)' : '');
  console.log(`🔄 [STRIPE webhook] ${user.email} subscription synced: ${sub.status}${note}, until ${user.subscription.currentPeriodEnd ? user.subscription.currentPeriodEnd.toISOString() : '?'}`);
}

// customer.subscription.deleted — the subscription has fully ended. Revert to free.
async function revertUserToFree(sub) {
  const user = await findUserBySubscription(sub);
  if (!user) {
    console.error(`❌ [STRIPE webhook] no user for deleted subscription ${sub.id} / customer ${sub.customer}`);
    return;
  }
  user.subscription.type = 'free';
  user.subscription.status = 'canceled';
  user.subscription.cancelAtPeriodEnd = false;
  await user.save();
  console.log(`⬇️  [STRIPE webhook] ${user.email} subscription deleted → reverted to free`);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stripe/webhook  — Stripe calls this when a payment completes.
// Requires the raw body (configured in server.js) for signature verification.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.error('❌ [STRIPE webhook] missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return res.status(500).send('Webhook not configured');
  }

  let event;
  try {
    // req.body is a raw Buffer here (see express.raw in server.js)
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], webhookSecret);
  } catch (err) {
    console.error('❌ [STRIPE webhook] signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📨 [STRIPE webhook] received: ${event.type} (event ${event.id})`);

  // Acknowledge fast so Stripe doesn't retry on a slow DB write.
  res.json({ received: true });

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log(`📨 [STRIPE webhook] checkout.session.completed — user: ${session.client_reference_id}, session: ${session.id}, payment_status: ${session.payment_status}`);

      // Only grant access on a genuinely paid session.
      if (session.payment_status !== 'paid') {
        console.log(`ℹ️  [STRIPE webhook] session not paid (${session.payment_status}) — ignoring`);
        return;
      }
      if (!session.client_reference_id) {
        console.error('❌ [STRIPE webhook] no client_reference_id on session — cannot map to a user');
        return;
      }
      await activateSubscription(session.client_reference_id, session, stripe);
    } else if (event.type === 'customer.subscription.updated') {
      await syncUserFromSubscription(event.data.object);
    } else if (event.type === 'customer.subscription.deleted') {
      await revertUserToFree(event.data.object);
    } else {
      console.log(`ℹ️  [STRIPE webhook] ignoring event type: ${event.type}`);
    }
  } catch (err) {
    console.error('❌ [STRIPE webhook] handler error:', err.message);
  }
});

module.exports = router;
