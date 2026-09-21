// Does this account have premium access?
//
// The server already answers this — User.hasPremiumAccess() in
// backend/models/User.js — and its answer is the one that decides what the API
// actually serves. The client used to decide separately, and the two rules
// disagreed: the browser checked type and status but not the expiry date, so an
// account whose period had ended kept showing every premium feature while the
// server treated it as free. Features appeared unlocked and then failed.
//
// So the server now sends `hasAccess` with the subscription and this is only
// consulted when that field is absent — an older cached profile written before
// the field existed. The rule below is the server's rule, kept in one tested
// place rather than inline in a context where it drifted unnoticed.
//
// The `null` case is load-bearing. Legacy lifetime accounts carry
// type: 'premium' with currentPeriodEnd: null and a subscription id that does
// not start with 'sub_'. They keep access forever. Treating a missing end date
// as "expired" would cut off real people who paid once and were promised
// exactly this — so absent means never expires, and only a date in the past
// ends access.

export interface SubscriptionLike {
  type?: string;
  status?: string;
  currentPeriodEnd?: string | Date | null;
  hasAccess?: boolean;
}

/** The server's rule, computed locally. Mirrors User.hasPremiumAccess(). */
export function computePremiumAccess(
  subscription: SubscriptionLike | undefined | null,
  now: Date = new Date(),
): boolean {
  if (!subscription) return false;
  if (subscription.type === undefined || subscription.type === 'free') return false;
  if (subscription.status !== 'active') return false;

  const end = subscription.currentPeriodEnd;
  if (end === null || end === undefined || end === '') return true; // lifetime

  const endsAt = end instanceof Date ? end : new Date(end);
  // An unparseable date is treated as no access rather than as lifetime: a
  // corrupt value should not silently hand out premium.
  if (Number.isNaN(endsAt.getTime())) return false;

  return endsAt.getTime() > now.getTime();
}

/**
 * Whether to show premium features.
 *
 * Prefers the server's answer, which is what the API enforces, and falls back
 * to computing the same rule when the field is missing.
 */
export function hasPremiumAccess(
  subscription: SubscriptionLike | undefined | null,
  now: Date = new Date(),
): boolean {
  if (subscription && typeof subscription.hasAccess === 'boolean') {
    return subscription.hasAccess;
  }
  return computePremiumAccess(subscription, now);
}
