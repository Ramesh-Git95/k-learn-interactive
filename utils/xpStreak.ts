// XP & streak engine.
//
// The ACCOUNT is the source of truth (backend `user.gamification`) so the
// numbers follow the user across devices. localStorage is kept as a mirror for
// two reasons: guests have no account, and mirroring lets every read stay
// synchronous so the UI updates instantly instead of waiting on the network.
//
// Writes are optimistic: bump the mirror, tell the UI, then reconcile with the
// server's authoritative answer when it lands.
//
// Components subscribe via custom DOM events: 'klearn-xp-updated', 'klearn-streak-updated'.

import { apiClient, Gamification } from '../services/apiClient';

const XP_KEY     = 'k-learn-xp';
const STREAK_KEY = 'k-learn-streak';

export interface XPData {
  total: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string; // 'YYYY-MM-DD'
  studyDates: string[];  // rolling 180-day log (feeds the study heatmap)
}

// Level thresholds — XP needed to START each level
// At ~80-100 XP/day of regular study: Lv2 ≈3 days, Lv5 ≈1 month, Lv8 ≈6 months, Lv10 ≈18 months
const THRESHOLDS = [0, 250, 600, 1200, 2500, 5000, 10000, 18000, 30000, 50000];

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const isLoggedIn = (): boolean => !!localStorage.getItem('token');

// ── Readers ──────────────────────────────────────────────────────────────────

export function getXPData(): XPData {
  try { return JSON.parse(localStorage.getItem(XP_KEY) || 'null') ?? { total: 0 }; }
  catch { return { total: 0 }; }
}

export function getStreakData(): StreakData {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || 'null') ?? {
      currentStreak: 0, longestStreak: 0, lastStudyDate: '', studyDates: [],
    };
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastStudyDate: '', studyDates: [] };
  }
}

export function getLevelInfo(total: number): { level: number; xpInLevel: number; xpForLevel: number } {
  let level = 1;
  for (let i = 1; i < THRESHOLDS.length; i++) {
    if (total >= THRESHOLDS[i]) level = i + 1; else break;
  }
  const start = THRESHOLDS[level - 1] ?? 0;
  const end   = THRESHOLDS[level]     ?? THRESHOLDS[THRESHOLDS.length - 1] * 2;
  return { level, xpInLevel: total - start, xpForLevel: end - start };
}

// ── Mirror plumbing ──────────────────────────────────────────────────────────

function writeXP(total: number): void {
  localStorage.setItem(XP_KEY, JSON.stringify({ total: Math.max(0, total) }));
  window.dispatchEvent(new CustomEvent('klearn-xp-updated'));
}

function writeStreak(s: StreakData): void {
  localStorage.setItem(STREAK_KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent('klearn-streak-updated'));
}

/** Adopt the server's authoritative numbers into the mirror. */
function applyServer(g: Gamification): void {
  writeXP(g.xp);
  writeStreak({
    currentStreak: g.currentStreak,
    longestStreak: g.longestStreak,
    lastStudyDate: g.lastStudyDate,
    studyDates: g.studyDates || [],
  });
}

// apiClient resolves (rather than rejects) on failure with success:false and a
// null payload, so the success check is what protects the mirror — adopting a
// failed response would zero out the very numbers we're trying to preserve.
// Network failures are non-fatal by design: the mirror already holds the
// optimistic value, and the next merge (on the next app open) reconciles it.
type GamResult = { data: Gamification; success: boolean; error?: string };

function reconcile(p: Promise<GamResult>): void {
  p.then(res => { if (res.success && res.data) applyServer(res.data); })
   .catch(() => { /* offline — mirror stands, merge fixes it later */ });
}

/**
 * Reconcile this device with the account. Call on login and on app open.
 *
 * Merge-up, never overwrite: the server takes the HIGHER xp and the UNION of
 * study dates. That matters twice — a fresh device (0 xp) can't wipe the
 * account, and a device still holding pre-sync localStorage donates that
 * history instead of losing it.
 */
export async function syncGamification(): Promise<void> {
  if (!isLoggedIn()) return;
  const { total } = getXPData();
  const { studyDates } = getStreakData();
  try {
    const res = await apiClient.mergeGamification({
      xp: total,
      studyDates: studyDates || [],
      today: todayISO(),
    });
    if (res.success && res.data) applyServer(res.data);
  } catch {
    // Offline or server asleep (Render cold start) — keep showing the mirror.
  }
}

/**
 * Drop this device's mirror. Called on logout so the next person to sign in on
 * this browser doesn't inherit — or worse, merge up — the previous user's XP.
 */
export function clearLocalGamification(): void {
  localStorage.removeItem(XP_KEY);
  localStorage.removeItem(STREAK_KEY);
  window.dispatchEvent(new CustomEvent('klearn-xp-updated'));
  window.dispatchEvent(new CustomEvent('klearn-streak-updated'));
}

// ── Writers ──────────────────────────────────────────────────────────────────

export function earnXP(amount: number): void {
  if (amount === 0) return;
  writeXP(getXPData().total + amount);            // optimistic — the UI moves now
  if (amount > 0 && isLoggedIn()) {
    reconcile(apiClient.awardXP(amount));         // server-side $inc is race-safe
  }
}

/**
 * Mark today as a study day and update the streak.
 * Returns true if this was the first study event today (streak bonus granted).
 *
 * Stays synchronous so callers can award the bonus immediately; the server then
 * recomputes the streak from the merged date history and corrects the mirror.
 */
export function markStudyToday(): boolean {
  const streak = getStreakData();
  const today  = todayISO();

  if (streak.lastStudyDate === today) return false; // already counted

  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  if (streak.lastStudyDate === yesterday) {
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1; // broke streak or first time
  }

  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastStudyDate = today;
  if (!streak.studyDates.includes(today)) {
    // Keep ~6 months of history — feeds the dashboard study heatmap (26 weeks).
    streak.studyDates = [...streak.studyDates, today].slice(-180);
  }

  writeStreak(streak);

  if (isLoggedIn()) {
    // The server owns the real streak maths — it can see history this device
    // never had. Its answer overwrites the optimistic one above.
    reconcile(apiClient.markStudyDay(today));
  }

  // First-study-of-day bonus
  earnXP(25);
  return true;
}
