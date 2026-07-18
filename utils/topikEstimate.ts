// TOPIK level estimate — persisted when the user finishes the TOPIK Level
// Assessment, then used for PLACEMENT: a learner who tests at level 2+ can
// already read Hangul, so path suggestions (Today's Session, Next-up,
// Learning Path) skip the alphabet instead of pointing them at ㄱㄴㄷ.

const KEY = 'kl-topik-estimate';

export interface TopikEstimate {
  level: number;      // 1–6
  date: string;       // ISO date of the assessment
}

export function getTopikEstimate(): TopikEstimate | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.level !== 'number' || parsed.level < 1 || parsed.level > 6) return null;
    return parsed as TopikEstimate;
  } catch {
    return null;
  }
}

export function saveTopikEstimate(level: number): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ level, date: new Date().toISOString() }));
    window.dispatchEvent(new CustomEvent('klearn-topik-updated'));
  } catch { /* ignore */ }
}

/** Placement rule: TOPIK 2+ implies the learner reads Hangul comfortably. */
export function canSkipHangul(estimate: TopikEstimate | null = getTopikEstimate()): boolean {
  return (estimate?.level ?? 0) >= 2;
}
