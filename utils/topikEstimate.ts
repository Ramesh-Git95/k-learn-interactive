// TOPIK level estimate — persisted when the user finishes the TOPIK Level
// Assessment, then used for PLACEMENT: a learner who tests at level 2+ can
// already read Hangul, so path suggestions (Today's Session, Next-up,
// Learning Path) skip the alphabet instead of pointing them at ㄱㄴㄷ.
//
// The account is the source of truth. localStorage is kept as a synchronous
// mirror so callers like canSkipHangul() can stay synchronous and guests still
// work — the same shape as utils/xpStreak.ts. Before this, the estimate lived
// ONLY in the browser, so signing in on a second device silently un-placed the
// learner and started aiming an intermediate user back at the alphabet.

import { apiClient } from '../services/apiClient';

const KEY = 'kl-topik-estimate';

export interface TopikEstimate {
  level: number;      // 1–6
  date: string;       // ISO date of the assessment
}

const readLocal = (): TopikEstimate | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.level !== 'number' || parsed.level < 1 || parsed.level > 6) return null;
    return parsed as TopikEstimate;
  } catch {
    return null;
  }
};

const writeLocal = (level: number, date: string): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ level, date }));
    window.dispatchEvent(new CustomEvent('klearn-topik-updated'));
  } catch { /* ignore */ }
};

export function getTopikEstimate(): TopikEstimate | null {
  return readLocal();
}

/** Save the level just tested. Writes through to the account when signed in. */
export function saveTopikEstimate(level: number): void {
  const date = new Date().toISOString();
  writeLocal(level, date);
  // Fire-and-forget: the mirror is already updated, so the UI never waits on the
  // network, and a failed call leaves the local value intact to be pushed up by
  // the next syncTopikEstimate().
  apiClient.saveTopikLevel(level);
}

/**
 * Reconcile with the account on login / app open.
 *
 * Latest test wins, not highest: a retest that places lower is still the most
 * accurate thing known, and silently keeping an old higher score would leave the
 * learner facing material they have just told us is too hard. When only one side
 * has a value, that value is adopted — so a device holding a pre-sync result
 * donates it to the account rather than losing it.
 */
export async function syncTopikEstimate(): Promise<void> {
  const local = readLocal();
  const res = await apiClient.getTopikLevel();
  const remote = res.success && res.data?.level
    ? { level: res.data.level as number, date: (res.data.testedAt as string) || '' }
    : null;

  if (!remote && !local) return;

  if (remote && !local) {
    writeLocal(remote.level, remote.date);
    return;
  }
  if (local && !remote) {
    apiClient.saveTopikLevel(local.level);
    return;
  }
  if (local && remote) {
    const localNewer = new Date(local.date).getTime() > new Date(remote.date).getTime();
    if (localNewer) apiClient.saveTopikLevel(local.level);
    else writeLocal(remote.level, remote.date);
  }
}

/** Clear on logout, or the next sign-in on this browser inherits a placement. */
export function clearLocalTopikEstimate(): void {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent('klearn-topik-updated'));
  } catch { /* ignore */ }
}

/** Placement rule: TOPIK 2+ implies the learner reads Hangul comfortably. */
export function canSkipHangul(estimate: TopikEstimate | null = getTopikEstimate()): boolean {
  return (estimate?.level ?? 0) >= 2;
}
