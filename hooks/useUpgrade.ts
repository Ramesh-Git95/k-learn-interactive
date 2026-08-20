import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useToastContext } from '../contexts/ToastContext';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

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
    '<div class="kl-overlay-card">' +
    '<div style="width:38px;height:38px;border:4px solid #E4572E;border-top-color:transparent;border-radius:50%;' +
    'animation:kl-spin 0.8s linear infinite;"></div>' +
    '<div class="kl-overlay-text">Redirecting to secure checkout…</div></div>';
  document.body.appendChild(el);
}
function hideRedirectOverlay() {
  if (typeof document === 'undefined') return;
  document.getElementById(OVERLAY_ID)?.remove();
}

/**
 * Raised by startUpgrade, listened for by UpgradeModalProvider.
 *
 * An event rather than a direct call because the hook would otherwise have to
 * import the modal context, which imports the modal, which imports this hook —
 * a cycle. The app already signals across that boundary this way for
 * 'open-auth-modal'.
 */
export const UPGRADE_MODAL_EVENT = 'kl-open-upgrade';

/**
 * Single entry point for "Upgrade to Premium" across the whole app.
 *
 * `startUpgrade` is what every premium button calls. It shows the paywall, so
 * nobody is dropped onto a Stripe payment page without first seeing what
 * Premium is and what it costs — which is what used to happen from Reading,
 * Writing, K-Drama, K-Pop, the Level Test and the header, while Quiz, Typing,
 * Phrases and Culture Cards showed the comparison first. Same button, two
 * different experiences, depending on which file you were in.
 *
 * `checkout` is the payment step itself, and only the paywall's own call to
 * action should use it. Payment is tied to the account, so a logged-out
 * visitor registers first.
 */
export function useUpgrade() {
  const { isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();
  const { showToast } = useToastContext();

  const startUpgrade = () => {
    if (!isAuthenticated) {
      openRegister();
      return;
    }
    window.dispatchEvent(new CustomEvent(UPGRADE_MODAL_EVENT));
  };

  const checkout = async () => {
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
        showToast(data.message || 'Could not start checkout. Please try again.', 'error');
      }
    } catch (e) {
      console.error('[useUpgrade] checkout error:', e);
      hideRedirectOverlay();
      showToast('Network error starting checkout. Please try again.', 'error');
    }
  };

  return { startUpgrade, checkout };
}
