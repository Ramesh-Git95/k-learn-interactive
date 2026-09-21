import { describe, it, expect } from 'vitest';
import { buildWordCaption, ROTATING_LINES } from '../../utils/wordCaption';

const word = { korean: '안녕하세요', romanization: 'annyeonghaseyo', english: 'hello (polite)' };

// Sundays through Saturdays in 2026, to drive getDay() 0..6.
const DAYS = [
  new Date(2026, 8, 20), // Sun
  new Date(2026, 8, 21),
  new Date(2026, 8, 22),
  new Date(2026, 8, 23),
  new Date(2026, 8, 24),
  new Date(2026, 8, 25),
  new Date(2026, 8, 26), // Sat
];

describe('the daily caption', () => {
  it('opens with the word and its meaning', () => {
    // Facebook shows only the first line before "See more", so nothing may
    // come before the word.
    const first = buildWordCaption(word, DAYS[0]).split('\n')[0];
    expect(first).toBe('안녕하세요 — hello (polite)');
  });

  it('carries the word as text, not only in the image', () => {
    const caption = buildWordCaption(word, DAYS[0]);
    expect(caption).toContain('안녕하세요');
    expect(caption).toContain('annyeonghaseyo');
    expect(caption).toContain('hello (polite)');
  });

  it('always includes a link, because an image is not clickable', () => {
    for (const d of DAYS) {
      expect(buildWordCaption(word, d)).toContain('korean-learn.com');
    }
  });

  it('is the same caption for the same day', () => {
    expect(buildWordCaption(word, DAYS[3])).toBe(buildWordCaption(word, DAYS[3]));
  });

  it('never repeats the same text two days running', () => {
    // Identical daily text is what spam looks like, to the ranking and to a
    // reader. The skeleton stays; the middle line moves.
    const week = DAYS.map(d => buildWordCaption(word, d));
    expect(new Set(week).size).toBe(7);
    for (let i = 1; i < week.length; i++) {
      expect(week[i]).not.toBe(week[i - 1]);
    }
  });

  it('uses each rotating line exactly once a week', () => {
    const used = DAYS.map(d => ROTATING_LINES.find(l => buildWordCaption(word, d).includes(l)));
    expect(used.filter(Boolean)).toHaveLength(7);
    expect(new Set(used).size).toBe(7);
  });

  it('asks for a reply at least once a week', () => {
    // Comments are what make the next post reach anyone.
    const prompts = ROTATING_LINES.filter(l => l.includes('👇'));
    expect(prompts.length).toBeGreaterThanOrEqual(1);
  });

  it('stays clear of the point where Facebook truncates', () => {
    // Roughly 125 characters show before "See more".
    const caption = buildWordCaption(word, DAYS[0]);
    expect(caption.split('\n')[0].length).toBeLessThan(125);
  });

  it('handles a long word without breaking the shape', () => {
    const long = {
      korean: '반갑습니다',
      romanization: 'bangapseumnida',
      english: 'pleased to meet you — said on a first meeting',
    };
    const caption = buildWordCaption(long, DAYS[2]);
    expect(caption.split('\n')[0]).toContain('반갑습니다');
    expect(caption).toContain('korean-learn.com');
  });
});
