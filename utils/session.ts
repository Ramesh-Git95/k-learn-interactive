// The last known signed-in user, kept beside the token.
//
// Without this, a returning visitor waited for GET /users/profile before the
// app rendered anything — and on the free Render tier that request is what
// wakes the server, so the wait was the full 30–50s cold start with a skeleton
// on screen. The session is already proven by the token; re-fetching the
// profile confirms details, it does not decide whether to let them in.
//
// So: render immediately from this copy, verify in the background, and correct
// or sign out only once the server has actually answered.
//
// What is stored is the user's own profile, in their own browser, and it is
// cleared on logout — the same shape of data the token already implies. It can
// be seconds stale after a change made on another device; nothing security-
// relevant rests on it, because the server re-checks every request it serves.

import type { User } from '../services/apiClient';

const CACHED_USER_KEY = 'k-learn-user';

/** Reads the cached profile. Returns null if absent, unreadable, or malformed. */
export const readCachedUser = (): User | null => {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // A truncated or hand-edited value must not boot the app into a broken
    // half-session; anything without an id is treated as absent.
    if (!parsed || typeof parsed !== 'object' || !parsed.id) return null;
    return parsed as User;
  } catch {
    // Private browsing can throw on access, and JSON.parse throws on a partial
    // write. Either way there is no usable cache.
    return null;
  }
};

export const writeCachedUser = (user: User | null): void => {
  try {
    if (!user) {
      localStorage.removeItem(CACHED_USER_KEY);
      return;
    }
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
  } catch {
    // Storage full or blocked — the app still works, it just waits next time.
  }
};

export const clearCachedUser = (): void => writeCachedUser(null);

/**
 * Whether a failed profile check means the token is genuinely rejected.
 *
 * 401/403 is the server saying no. Everything else — 0 (never reached it),
 * 5xx (it is awake but broken, or still waking) — is the server failing to
 * answer, which says nothing about the token. Signing someone out for that
 * loses a valid session, and on free hosting it happens routinely.
 */
export const isAuthRejection = (status: number): boolean => status === 401 || status === 403;
