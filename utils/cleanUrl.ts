// Removes other companies' click-tracking parameters from the address bar.
//
// Arriving from a Facebook link means arriving at
// korean-learn.com/?fbclid=IwY2xjaw… — Facebook's click identifier, appended so
// it can attribute the visit. Every platform does this. Nothing here reads it,
// and with no analytics configured it does nothing at all.
//
// It is removed anyway, for one reason: handleSetActiveSection carries the
// query string across navigation (it has to, for ?checkout=success), so the id
// follows a visitor onto every page they open. Copy the address to send to a
// friend and Facebook's tracking id goes with it, attributing that person's
// visit to the original click. Passing a stranger's tracking id to a third
// party is precisely what the cookie page says this app does not do.
//
// Removed by name rather than by clearing the query string, because some
// parameters are load-bearing: ?checkout= drives the post-Stripe flow and
// ?token= carries a password reset. An allow-everything-but-these approach
// would break both the day someone adds a third.
//
// If analytics is ever switched on, this has to move: a tracker reads the
// campaign parameters when it loads, and stripping utm_* before that point
// would hide every campaign from it. Drop the utm_ prefix rule then, or run
// this after the tracker has initialised.

const TRACKING_PARAMS = [
  'fbclid',   // Facebook
  'igshid',   // Instagram
  'gclid',    // Google Ads
  'gbraid',   // Google Ads, iOS app-to-web
  'wbraid',   // Google Ads, iOS web-to-app
  'dclid',    // Google Display
  'msclkid',  // Microsoft Ads
  'ttclid',   // TikTok
  'twclid',   // X
  'li_fat_id',// LinkedIn
  'yclid',    // Yandex
  'mc_cid',   // Mailchimp campaign
  'mc_eid',   // Mailchimp recipient
  '_ga',      // Google Analytics cross-domain
  'ref_src',
  'ref_url',
];

/** utm_source, utm_medium, utm_campaign, utm_term, utm_content, utm_id… */
const TRACKING_PREFIX = 'utm_';

/**
 * Returns the search string with tracking parameters removed, or null when
 * there was nothing to remove — letting the caller skip a needless history
 * write. Pure, so the rules can be tested without a browser.
 */
export function stripTrackingParams(search: string): string | null {
  if (!search || search === '?') return null;

  const params = new URLSearchParams(search);
  let removed = false;

  for (const key of [...params.keys()]) {
    const lower = key.toLowerCase();
    if (TRACKING_PARAMS.includes(lower) || lower.startsWith(TRACKING_PREFIX)) {
      params.delete(key);
      removed = true;
    }
  }

  if (!removed) return null;

  const rest = params.toString();
  return rest ? `?${rest}` : '';
}

/**
 * Rewrites the current URL without its tracking parameters.
 *
 * replaceState rather than pushState: the cleaned URL replaces the one that was
 * arrived at, so the browser's Back button still leaves the site instead of
 * stepping through a tidied copy of the page just shown.
 */
export function cleanTrackingParamsFromUrl(): void {
  try {
    const cleaned = stripTrackingParams(window.location.search);
    if (cleaned === null) return;
    window.history.replaceState({}, '', window.location.pathname + cleaned + window.location.hash);
  } catch {
    // A failed tidy-up must never stop the app booting.
  }
}
