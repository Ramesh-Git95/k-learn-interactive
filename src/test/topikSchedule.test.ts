import { describe, it, expect } from 'vitest';
import {
  TOPIK_SITTINGS,
  SCHEDULE_VERIFIED_ON,
  upcomingSittings,
  scheduleIsExhausted,
  koreaRegistrationOpen,
  daysUntil,
  localDate,
} from '../../data/topikSchedule';

const at = (iso: string) => localDate(iso);

describe('the dates themselves', () => {
  // Cheap guards against a typo in a hand-maintained file. A malformed or
  // wildly wrong date would otherwise be discovered by a learner planning
  // around it.
  it('are all well-formed ISO dates', () => {
    for (const s of TOPIK_SITTINGS) {
      expect(s.testDate, `${s.kind} ${s.round}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(localDate(s.testDate).getTime())).toBe(false);
    }
  });

  it('register before they are sat', () => {
    for (const s of TOPIK_SITTINGS) {
      if (!s.koreaRegistration) continue;
      expect(
        s.koreaRegistration.from < s.koreaRegistration.to,
        `${s.kind} ${s.round} registration opens after it closes`,
      ).toBe(true);
      expect(
        s.koreaRegistration.to < s.testDate,
        `${s.kind} ${s.round} registration closes after the exam`,
      ).toBe(true);
    }
  });

  it('runs a two-day paper sitting in the right order', () => {
    for (const s of TOPIK_SITTINGS) {
      if (s.testDateEnd) expect(s.testDate < s.testDateEnd).toBe(true);
    }
  });

  it('has a verification date that is not in the future', () => {
    expect(daysUntil(SCHEDULE_VERIFIED_ON, new Date())).toBeLessThanOrEqual(0);
  });
});

describe('what counts as upcoming', () => {
  it('drops sittings that have passed', () => {
    const after = upcomingSittings(at('2026-11-20'));
    expect(after.map(s => s.round)).toEqual([16]);
  });

  it('keeps a sitting through its own day, not until the day before', () => {
    // Someone opening the app on exam morning should still see it.
    expect(upcomingSittings(at('2026-11-15')).some(s => s.round === 109)).toBe(true);
    expect(upcomingSittings(at('2026-11-16')).some(s => s.round === 109)).toBe(false);
  });

  it('keeps a two-day paper sitting through its second day', () => {
    expect(upcomingSittings(at('2026-10-18')).some(s => s.round === 108)).toBe(true);
    expect(upcomingSittings(at('2026-10-19')).some(s => s.round === 108)).toBe(false);
  });

  it('returns them soonest first', () => {
    const dates = upcomingSittings(at('2026-09-22')).map(s => s.testDate);
    expect(dates).toEqual([...dates].sort());
  });

  it('knows when it has run out, so the UI can say so', () => {
    expect(scheduleIsExhausted(at('2026-09-22'))).toBe(false);
    expect(scheduleIsExhausted(at('2027-01-01'))).toBe(true);
  });
});

describe('registration windows', () => {
  it('is open on the first and last day of the window', () => {
    const r109 = TOPIK_SITTINGS.find(s => s.round === 109 && s.kind === 'PBT')!;
    expect(koreaRegistrationOpen(r109, at('2026-09-01'))).toBe(true);
    expect(koreaRegistrationOpen(r109, at('2026-09-07'))).toBe(true);
  });

  it('is shut either side of it', () => {
    const r109 = TOPIK_SITTINGS.find(s => s.round === 109 && s.kind === 'PBT')!;
    expect(koreaRegistrationOpen(r109, at('2026-08-31'))).toBe(false);
    expect(koreaRegistrationOpen(r109, at('2026-09-08'))).toBe(false);
  });
});

describe('daysUntil', () => {
  // The bug this exists for: new Date('2026-10-17') is UTC midnight, which is
  // the day before for anyone west of Greenwich. A learner in New York would
  // have seen every exam counted one day early.
  it('counts whole days in the reader\'s own timezone', () => {
    expect(daysUntil('2026-11-15', at('2026-11-15'))).toBe(0);
    expect(daysUntil('2026-11-15', at('2026-11-14'))).toBe(1);
    expect(daysUntil('2026-11-15', at('2026-11-16'))).toBe(-1);
  });

  it('is unaffected by the time of day', () => {
    const lateEvening = new Date(2026, 10, 14, 23, 45);
    expect(daysUntil('2026-11-15', lateEvening)).toBe(1);
  });
});
