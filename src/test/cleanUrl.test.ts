import { describe, it, expect } from 'vitest';
import { stripTrackingParams } from '../../utils/cleanUrl';

describe('what gets stripped', () => {
  it('removes the Facebook click id', () => {
    expect(stripTrackingParams('?fbclid=IwY2xjawUduNRwZG9mAWV4dG4')).toBe('');
  });

  it('removes the other platforms too', () => {
    for (const p of ['gclid', 'msclkid', 'ttclid', 'twclid', 'igshid', 'yclid', 'li_fat_id']) {
      expect(stripTrackingParams(`?${p}=abc123`), `${p} should be stripped`).toBe('');
    }
  });

  it('removes every utm_ parameter', () => {
    expect(
      stripTrackingParams('?utm_source=facebook&utm_medium=social&utm_campaign=wordoftheday'),
    ).toBe('');
  });

  it('ignores case, since parameters arrive however they were written', () => {
    expect(stripTrackingParams('?FBCLID=abc')).toBe('');
    expect(stripTrackingParams('?UTM_Source=fb')).toBe('');
  });
});

describe('what must survive', () => {
  // These two drive real flows. Clearing the query string wholesale — the
  // obvious implementation — would break both.
  it('keeps the Stripe return parameter', () => {
    expect(stripTrackingParams('?checkout=success&fbclid=abc')).toBe('?checkout=success');
    expect(stripTrackingParams('?checkout=cancel')).toBeNull();
  });

  it('keeps a password reset token', () => {
    expect(stripTrackingParams('?token=abc123&fbclid=xyz')).toBe('?token=abc123');
  });

  it('keeps anything it does not recognise', () => {
    expect(stripTrackingParams('?ref=friend&page=2')).toBeNull();
  });

  it('keeps the real parameters when mixed with several trackers', () => {
    const out = stripTrackingParams('?fbclid=a&checkout=success&utm_source=fb&token=t');
    expect(out).toContain('checkout=success');
    expect(out).toContain('token=t');
    expect(out).not.toContain('fbclid');
    expect(out).not.toContain('utm_source');
  });
});

describe('when there is nothing to do', () => {
  // null means "no history write needed" — it keeps the common case from
  // touching the address bar at all.
  it('returns null for an empty or absent query string', () => {
    expect(stripTrackingParams('')).toBeNull();
    expect(stripTrackingParams('?')).toBeNull();
  });

  it('returns null when no tracking parameter is present', () => {
    expect(stripTrackingParams('?checkout=success')).toBeNull();
  });
});

describe('edge cases', () => {
  it('preserves a value containing an encoded ampersand', () => {
    const out = stripTrackingParams('?name=a%26b&fbclid=x');
    expect(new URLSearchParams(out!).get('name')).toBe('a&b');
  });

  it('handles a tracking parameter with an empty value', () => {
    expect(stripTrackingParams('?fbclid=')).toBe('');
  });

  it('handles the same tracker repeated', () => {
    expect(stripTrackingParams('?fbclid=a&fbclid=b&checkout=success')).toBe('?checkout=success');
  });
});
