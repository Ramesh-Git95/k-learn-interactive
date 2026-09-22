// Real TOPIK sitting dates.
//
// ── WHERE THESE CAME FROM, AND WHY THAT MATTERS ─────────────────────────────
// Every date below was cross-checked against two independent published
// schedules on 2026-09-22 and appears identically in both. A wrong exam date is
// worse than no exam date: someone plans months of study around it, and we have
// no way to tell them it changed. So nothing goes in this file that has not
// been seen in two places, and SCHEDULE_VERIFIED_ON is shown in the UI so a
// visitor can judge how fresh it is for themselves.
//
// Results dates are deliberately absent: the two sources disagreed on them.
//
// ── REGISTRATION IS NOT ONE WINDOW ──────────────────────────────────────────
// The official plan separates registration inside Korea from registration
// abroad, and overseas windows are set by each local centre. The dates here are
// the Korean ones and are labelled as such. Presenting them as universal would
// make someone in another country miss their actual deadline — the exact harm
// this feature exists to prevent.
//
// ── 2027 IS NOT LISTED BECAUSE IT DOES NOT EXIST YET ────────────────────────
// As of this file's verification date the Ministry of Education and NIIED had
// not published the 2027 plan. Guessing next year's dates from this year's
// pattern would be inventing them. When the plan appears, add the rounds and
// move SCHEDULE_VERIFIED_ON forward.
//
// When every sitting here is in the past, the UI says so and points at the
// official site rather than showing an empty box.

export type SittingKind = 'PBT' | 'IBT' | 'Speaking';

export interface TopikSitting {
  /** Round number as the organisers count it — PBT, IBT and Speaking each have their own series. */
  round: number;
  kind: SittingKind;
  /** ISO date of the test, or of its first day when it runs over a weekend. */
  testDate: string;
  /** Second day, for paper sittings split across two days. */
  testDateEnd?: string;
  /** Registration window for tests taken in Korea. Overseas differs by centre. */
  koreaRegistration?: { from: string; to: string };
}

/** The day the dates below were last checked against published schedules. */
export const SCHEDULE_VERIFIED_ON = '2026-09-22';

/** Where to confirm, and the only authority worth trusting for a change. */
export const OFFICIAL_URL = 'https://www.topik.go.kr';

/** Past sittings are kept so the list is auditable; the UI filters them out. */
export const TOPIK_SITTINGS: TopikSitting[] = [
  {
    round: 108,
    kind: 'PBT',
    testDate: '2026-10-17',
    testDateEnd: '2026-10-18',
    koreaRegistration: { from: '2026-08-04', to: '2026-08-10' },
  },
  {
    round: 15,
    kind: 'IBT',
    testDate: '2026-10-24',
    koreaRegistration: { from: '2026-08-18', to: '2026-08-24' },
  },
  {
    round: 12,
    kind: 'Speaking',
    testDate: '2026-10-24',
    koreaRegistration: { from: '2026-08-18', to: '2026-08-24' },
  },
  {
    round: 109,
    kind: 'PBT',
    testDate: '2026-11-15',
    koreaRegistration: { from: '2026-09-01', to: '2026-09-07' },
  },
  {
    round: 16,
    kind: 'IBT',
    testDate: '2026-11-28',
    koreaRegistration: { from: '2026-09-15', to: '2026-09-21' },
  },
];

/**
 * Midnight local time for an ISO date.
 *
 * `new Date('2026-10-17')` is parsed as UTC midnight, which is the previous day
 * for anyone west of Greenwich — so a learner in New York would see an exam
 * counted as one day sooner than it is. Building the date from its parts keeps
 * it in the reader's own day.
 */
export const localDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Whole days from `now` to `iso`, in the reader's timezone. Negative once past. */
export const daysUntil = (iso: string, now: Date = new Date()): number => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const then = localDate(iso);
  return Math.round((then.getTime() - today.getTime()) / 86_400_000);
};

/** Sittings still to come, soonest first. A test is "upcoming" through its own day. */
export const upcomingSittings = (now: Date = new Date()): TopikSitting[] =>
  TOPIK_SITTINGS
    .filter(s => daysUntil(s.testDateEnd ?? s.testDate, now) >= 0)
    .sort((a, b) => a.testDate.localeCompare(b.testDate));

/** True once nothing here is in the future — the cue to stop showing stale dates. */
export const scheduleIsExhausted = (now: Date = new Date()): boolean =>
  upcomingSittings(now).length === 0;

/** Whether a registration window is open right now, for tests taken in Korea. */
export const koreaRegistrationOpen = (s: TopikSitting, now: Date = new Date()): boolean => {
  if (!s.koreaRegistration) return false;
  return daysUntil(s.koreaRegistration.from, now) <= 0 && daysUntil(s.koreaRegistration.to, now) >= 0;
};
