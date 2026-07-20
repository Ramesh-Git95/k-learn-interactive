// Celebrations — the small events that make finishing something feel like
// something.
//
// Fired as a DOM event rather than through a context, matching how xpStreak
// already broadcasts ('klearn-xp-updated'). That keeps this callable from
// non-React code — the level-up check lives inside earnXP, which isn't a
// component — and avoids adding another provider to an already-deep tree.

export type CelebrationVariant = 'level' | 'streak' | 'unit' | 'letter' | 'perfect';

export interface Celebration {
  variant: CelebrationVariant;
  title: string;
  subtitle?: string;
  emoji: string;
}

export const CELEBRATE_EVENT = 'klearn-celebrate';

export function celebrate(c: Celebration): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<Celebration>(CELEBRATE_EVENT, { detail: c }));
}

/** Streak lengths worth stopping for. Every day would be noise. */
export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 365];

export function streakMilestoneFor(days: number): number | null {
  return STREAK_MILESTONES.includes(days) ? days : null;
}
