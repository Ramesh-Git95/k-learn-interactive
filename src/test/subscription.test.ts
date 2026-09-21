import { describe, it, expect } from 'vitest';
import { computePremiumAccess, hasPremiumAccess } from '../../utils/subscription';

const NOW = new Date('2026-09-21T12:00:00Z');
const PAST = '2026-07-28T00:00:00Z';
const FUTURE = '2026-12-31T00:00:00Z';

describe('the rule the server uses', () => {
  it('grants access inside the paid period', () => {
    expect(
      computePremiumAccess({ type: 'premium', status: 'active', currentPeriodEnd: FUTURE }, NOW),
    ).toBe(true);
  });

  // The bug this whole change exists for: the browser checked type and status
  // but not the date, so an ended subscription still showed every premium
  // feature while the API treated the account as free.
  it('denies access once the period has ended', () => {
    expect(
      computePremiumAccess({ type: 'premium', status: 'active', currentPeriodEnd: PAST }, NOW),
    ).toBe(false);
  });

  it('denies a free account', () => {
    expect(computePremiumAccess({ type: 'free', status: 'active' }, NOW)).toBe(false);
  });

  it('denies an inactive subscription even inside its period', () => {
    for (const status of ['canceled', 'past_due', 'trialing']) {
      expect(
        computePremiumAccess({ type: 'premium', status, currentPeriodEnd: FUTURE }, NOW),
        `${status} must not grant access`,
      ).toBe(false);
    }
  });

  it('denies when there is no subscription at all', () => {
    expect(computePremiumAccess(undefined, NOW)).toBe(false);
    expect(computePremiumAccess(null, NOW)).toBe(false);
    expect(computePremiumAccess({}, NOW)).toBe(false);
  });
});

describe('legacy lifetime accounts', () => {
  // CLAUDE.md: type 'premium' with currentPeriodEnd null and a non-'sub_' id.
  // They paid once and were promised access forever. Reading a missing end date
  // as "expired" would cut off real paying users — this is the case most worth
  // protecting in this file.
  it('grants access forever when there is no end date', () => {
    expect(computePremiumAccess({ type: 'premium', status: 'active', currentPeriodEnd: null }, NOW))
      .toBe(true);
    expect(computePremiumAccess({ type: 'premium', status: 'active' }, NOW)).toBe(true);
  });

  it('accepts a Date object as well as a string', () => {
    expect(
      computePremiumAccess(
        { type: 'premium', status: 'active', currentPeriodEnd: new Date(FUTURE) },
        NOW,
      ),
    ).toBe(true);
  });

  it('refuses access on an unparseable date rather than assuming lifetime', () => {
    expect(
      computePremiumAccess({ type: 'premium', status: 'active', currentPeriodEnd: 'not-a-date' }, NOW),
    ).toBe(false);
  });
});

describe('preferring the server answer', () => {
  it('uses hasAccess when the server sent one', () => {
    // Even against a local computation that would say otherwise — the server
    // is what the API enforces.
    expect(
      hasPremiumAccess({ type: 'premium', status: 'active', currentPeriodEnd: PAST, hasAccess: true }, NOW),
    ).toBe(true);
    expect(
      hasPremiumAccess({ type: 'premium', status: 'active', currentPeriodEnd: FUTURE, hasAccess: false }, NOW),
    ).toBe(false);
  });

  it('falls back to the rule when the field is absent', () => {
    // An older cached profile, written before the field existed.
    expect(hasPremiumAccess({ type: 'premium', status: 'active', currentPeriodEnd: PAST }, NOW)).toBe(false);
    expect(hasPremiumAccess({ type: 'premium', status: 'active', currentPeriodEnd: FUTURE }, NOW)).toBe(true);
  });

  it('treats a non-boolean hasAccess as absent', () => {
    expect(
      hasPremiumAccess(
        { type: 'premium', status: 'active', currentPeriodEnd: PAST, hasAccess: undefined },
        NOW,
      ),
    ).toBe(false);
  });
});

describe('the reported account', () => {
  it('is not premium — period ended 2026-07-28, today is 2026-09-21', () => {
    const reported = { type: 'premium', status: 'active', currentPeriodEnd: '2026-07-28T00:00:00Z' };
    expect(computePremiumAccess(reported, NOW)).toBe(false);
  });
});
