import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { GUMROAD_URL } from '../constants';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';
// Build-time switch. Defaults to 'gumroad' so the app behaves exactly as today
// until we flip VITE_PAYMENT_PROVIDER=stripe at go-live. Safe to deploy anytime.
const PROVIDER = (import.meta.env.VITE_PAYMENT_PROVIDER as string) || 'gumroad';

/**
 * Single entry point for "Upgrade to Premium" across the whole app.
 * - gumroad (default): opens the Gumroad lifetime page (current behaviour).
 * - stripe: starts a Stripe Checkout subscription. Requires login — a logged-out
 *   visitor is prompted to register first (their choice), then upgrades.
 */
export function useUpgrade() {
  const { isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();

  const startUpgrade = async () => {
    if (PROVIDER !== 'stripe') {
      window.open(GUMROAD_URL, '_blank');
      return;
    }

    // Stripe ties the payment to the account, so the user must be signed in.
    if (!isAuthenticated) {
      openRegister();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url; // redirect to Stripe Checkout
      } else {
        console.error('[useUpgrade] checkout failed:', res.status, data);
        window.open(GUMROAD_URL, '_blank'); // safety fallback
      }
    } catch (e) {
      console.error('[useUpgrade] checkout error:', e);
      window.open(GUMROAD_URL, '_blank');
    }
  };

  return { startUpgrade, provider: PROVIDER };
}
