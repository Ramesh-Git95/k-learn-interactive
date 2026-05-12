# 🚀 Stripe Integration Setup Guide

## Step 1: Get Your Stripe Keys
1. Go to your Stripe Dashboard: https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

## Step 2: Create a Product in Stripe
1. Go to: https://dashboard.stripe.com/test/products
2. Click "Create product"
3. Set up your Premium subscription:
   - Product name: "K-Learn Premium"
   - Billing: "Recurring"
   - Price: $9.99
   - Billing period: Monthly
4. Save and copy the **Price ID** (starts with `price_`)

## Step 3: Update Your Config Files

### Frontend (useStripeCheckout.ts):
```typescript
const stripePromise = loadStripe('pk_test_YOUR_ACTUAL_KEY_HERE');

export const STRIPE_CONFIG = {
  PREMIUM_MONTHLY_PRICE_ID: 'price_YOUR_ACTUAL_PRICE_ID_HERE',
  // ...
};
```

### Backend (.env file):
```
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
FRONTEND_URL=http://localhost:5173
```

## Step 4: Test the Integration
1. Start your backend: `npm run dev` (in backend folder)
2. Start your frontend: `npm run dev` (in frontend folder)
3. Click "Upgrade" anywhere in the app
4. Use Stripe test card: `4242 4242 4242 4242`
5. Any future date for expiry, any CVV

## Step 5: Test Cards for Different Scenarios
- **Successful payment**: 4242 4242 4242 4242
- **Declined payment**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

## What Happens When User Upgrades:
1. User clicks "Upgrade" → Redirects to Stripe Checkout
2. User pays → Stripe processes payment
3. Success → User redirected back to your app
4. Database updated → User gets premium features immediately

## 🧪 Testing Checklist:
- [ ] Modal opens when clicking premium features
- [ ] Upgrade button redirects to Stripe
- [ ] Test payment with 4242 card works
- [ ] User subscription updated in database
- [ ] Premium features unlocked after payment
- [ ] Success page shows correctly

## 🚨 Important Notes:
- This is TEST MODE - no real money involved
- Test cards only work in test mode
- Real cards will be declined in test mode
- Switch to live mode only when everything works perfectly

## Need Help?
- Stripe Dashboard: https://dashboard.stripe.com/test
- Stripe Test Cards: https://stripe.com/docs/testing#cards
- This integration handles subscriptions, not one-time payments
