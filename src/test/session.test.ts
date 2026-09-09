import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readCachedUser, writeCachedUser, clearCachedUser, isAuthRejection } from '../../utils/session';

const KEY = 'k-learn-user';
const user = { id: 'u1', email: 'a@b.com', name: 'Ramesh' } as any;

describe('isAuthRejection — who gets signed out', () => {
  // The bug: any failed profile check cleared the token. A free-tier backend
  // returns 502 while it wakes, so a returning user could be signed out for
  // nothing more than arriving first.
  it('signs out only when the server rejected the token', () => {
    expect(isAuthRejection(401)).toBe(true);
    expect(isAuthRejection(403)).toBe(true);
  });

  it('keeps the session when the server never answered or failed', () => {
    for (const status of [0, 500, 502, 503, 504, 408, 429]) {
      expect(isAuthRejection(status), `${status} must not sign anyone out`).toBe(false);
    }
  });
});

describe('cached profile', () => {
  beforeEach(() => localStorage.clear());

  it('round trips a user', () => {
    writeCachedUser(user);
    expect(readCachedUser()).toEqual(user);
  });

  it('is empty when nothing was stored', () => {
    expect(readCachedUser()).toBeNull();
  });

  it('ignores a malformed or truncated value rather than booting a half-session', () => {
    localStorage.setItem(KEY, '{"id":"u1"');
    expect(readCachedUser()).toBeNull();

    localStorage.setItem(KEY, 'null');
    expect(readCachedUser()).toBeNull();

    localStorage.setItem(KEY, '"a string"');
    expect(readCachedUser()).toBeNull();
  });

  it('ignores an object with no id', () => {
    localStorage.setItem(KEY, JSON.stringify({ email: 'a@b.com' }));
    expect(readCachedUser()).toBeNull();
  });

  it('clears on logout, so the next person here is not the last one', () => {
    writeCachedUser(user);
    clearCachedUser();
    expect(readCachedUser()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe('when storage itself misbehaves', () => {
  afterEach(() => vi.restoreAllMocks());

  it('survives reads throwing (private browsing)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('access denied');
    });
    expect(() => readCachedUser()).not.toThrow();
    expect(readCachedUser()).toBeNull();
  });

  it('survives writes throwing (quota exceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    // Failing to cache is allowed to be silent — the cost is a slow load next
    // time, not a broken session.
    expect(() => writeCachedUser(user)).not.toThrow();
  });
});
