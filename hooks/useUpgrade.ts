import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { GUMROAD_URL } from '../constants';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';
// Build-time switch. Defaults to 'gumroad' so the app behaves exactly as today
// until we flip VITE_PAYMENT_PROVIDER=stripe at go-live. Safe to deploy anytime.
const PROVIDER = (import.meta.env.VITE_PAYMENT_PROVIDER as string) || 'gumroad';

// Full-screen "redirecting…" overlay so the ~2-3s gap while the backend creates
// the Stripe Checkout session doesn't feel like a dead click. Injected into the
// DOM so it works for every upgrade button without per-button state.
const OVERLAY_ID = 'kl-upgrade-redirect-overlay';
function showRedirectOverlay() {
  if (typeof document === 'undefined' || document.getElementById(OVERLAY_ID)) return;
  const el = document.createElement('div');
  el.id = OVERLAY_ID;
  el.setAttribute('style',
    'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
    'background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);');
  el.innerHTML =
    '<style>@keyframes kl-spin{to{transform:rotate(360deg)}}</style>' +
    '<div style="background:#fff;border-radius:18px;padding:28px 32px;display:flex;flex-direction:column;' +
    'align-items:center;gap:16px;box-shadow:0 20px 60px rgba(0,0,0,0.25);font-family:Inter,system-ui,sans-serif;">' +
    '<div style="width:38px;height:38px;border:4px solid #EC4899;border-top-color:transparent;border-radius:50%;' +
    'animation:kl-spin 0.8s linear infinite;"></div>' +
    '<div style="font-weight:800;color:#111827;font-size:14px;">Redirecting to secure checkout…</div></div>';
  document.body.appendChild(el);
}
function hideRedirectOverlay() {
  if (typeof document === 'undefined') return;
  document.getElementById(OVERLAY_ID)?.remove();
}

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

    showRedirectOverlay();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url; // redirect to Stripe Checkout (overlay stays until navigation)
      } else {
        console.error('[useUpgrade] checkout failed:', res.status, data);
        hideRedirectOverlay();
        window.open(GUMROAD_URL, '_blank'); // safety fallback
      }
    } catch (e) {
      console.error('[useUpgrade] checkout error:', e);
      hideRedirectOverlay();
      window.open(GUMROAD_URL, '_blank');
    }
  };

  return { startUpgrade, provider: PROVIDER };
}
