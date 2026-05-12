// XP & streak engine — pure localStorage utilities, no React.
// Components subscribe via custom DOM events: 'klearn-xp-updated', 'klearn-streak-updated'.

const XP_KEY     = 'k-learn-xp';
const STREAK_KEY = 'k-learn-streak';

export interface XPData {
  total: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string; // 'YYYY-MM-DD'
  studyDates: string[];  // rolling 30-day log
}

// Level thresholds — XP needed to START each level
const THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000];

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

// ── Writers ──────────────────────────────────────────────────────────────────

export function earnXP(amount: number): void {
  if (amount === 0) return;
  const d = getXPData();
  d.total = Math.max(0, d.total + amount);
  localStorage.setItem(XP_KEY, JSON.stringify(d));
  window.dispatchEvent(new CustomEvent('klearn-xp-updated'));
}

/**
 * Mark today as a study day and update the streak.
 * Returns true if this was the first study event today (streak bonus granted).
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
    streak.studyDates = [...streak.studyDates, today].slice(-30);
  }

  localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  window.dispatchEvent(new CustomEvent('klearn-streak-updated'));

  // First-study-of-day bonus
  earnXP(25);
  return true;
}
