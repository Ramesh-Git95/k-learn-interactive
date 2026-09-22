import { describe, it, expect } from 'vitest';
import {
  PAPERS,
  FREE_QUESTION_COUNT,
  buildPaper,
  scoreExam,
  formatClock,
  clockState,
} from '../../utils/mockExam';
import { QUESTIONS } from '../../data/topikQuestions';

/** Deterministic stand-in for the shuffle, so a draw can be asserted on. */
const noShuffle = <T,>(items: T[]): T[] => [...items];

describe('drawing a paper', () => {
  it('gives a subscriber the full paper and a free user a short one', () => {
    expect(buildPaper('I', true, noShuffle).questions).toHaveLength(PAPERS.I.questionCount);
    expect(buildPaper('I', false, noShuffle).questions).toHaveLength(FREE_QUESTION_COUNT);
  });

  it('draws TOPIK I from levels 1–2 only', () => {
    const { questions } = buildPaper('I', true, noShuffle);
    expect(questions.every(q => q.level === 1 || q.level === 2)).toBe(true);
  });

  it('draws TOPIK II from levels 3–6 only', () => {
    const { questions } = buildPaper('II', true, noShuffle);
    expect(questions.every(q => q.level >= 3 && q.level <= 6)).toBe(true);
  });

  it('never repeats a question within one paper', () => {
    for (const id of ['I', 'II'] as const) {
      const ids = buildPaper(id, true, noShuffle).questions.map(q => q.id);
      expect(new Set(ids).size, `${id} drew a duplicate`).toBe(ids.length);
    }
  });

  it('sets the clock from the paper\'s real pace', () => {
    const p = buildPaper('I', true, noShuffle);
    expect(p.totalSeconds).toBe(p.questions.length * 90);

    const free = buildPaper('I', false, noShuffle);
    expect(free.totalSeconds).toBe(FREE_QUESTION_COUNT * 90);
  });

  it('cannot ask for more questions than the bank holds', () => {
    // The guard that matters: if someone raises questionCount past the bank,
    // the paper should come up short rather than repeat or crash.
    for (const id of ['I', 'II'] as const) {
      const paper = PAPERS[id];
      const available = QUESTIONS.filter(q => paper.levels.includes(q.level)).length;
      expect(buildPaper(id, true, noShuffle).questions.length).toBeLessThanOrEqual(available);
    }
  });

  it('shuffles, so the paper does not climb neatly through the levels', () => {
    const { questions } = buildPaper('II', true);
    const levels = questions.map(q => q.level);
    const sorted = [...levels].sort();
    // Astronomically unlikely to come out sorted by chance across 40 draws.
    expect(levels).not.toEqual(sorted);
  });
});

describe('scoring', () => {
  const qs = QUESTIONS.slice(0, 4);

  it('counts right answers', () => {
    const answers = qs.map(q => q.answer);
    expect(scoreExam(qs, answers, false).correct).toBe(4);
    expect(scoreExam(qs, answers, false).percent).toBe(100);
  });

  it('separates blank from wrong, because running out of time is a different failure', () => {
    const answers = [qs[0].answer, null, (qs[2].answer + 1) % 4, null];
    const r = scoreExam(qs, answers, true);
    expect(r.correct).toBe(1);
    expect(r.unanswered).toBe(2);
    expect(r.total).toBe(4);
  });

  it('records whether the clock ended it', () => {
    expect(scoreExam(qs, [], true).ranOutOfTime).toBe(true);
    expect(scoreExam(qs, [], false).ranOutOfTime).toBe(false);
  });

  it('does not divide by zero on an empty paper', () => {
    expect(scoreExam([], [], false).percent).toBe(0);
  });
});

describe('the clock', () => {
  it('reads as mm:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(59)).toBe('0:59');
    expect(formatClock(60)).toBe('1:00');
    expect(formatClock(1800)).toBe('30:00');
  });

  it('never shows a negative time', () => {
    expect(formatClock(-5)).toBe('0:00');
  });

  it('escalates as the time goes — warning at a tenth left', () => {
    const total = 1800; // 30 minutes, so the warning lands at 180s
    expect(clockState(1800, total)).toBe('calm');
    expect(clockState(181, total)).toBe('calm');
    expect(clockState(180, total)).toBe('warning');
    expect(clockState(61, total)).toBe('warning');
    expect(clockState(60, total)).toBe('urgent');
    expect(clockState(0, total)).toBe('urgent');
  });

  it('caps the warning at five minutes on a long paper', () => {
    // TOPIK II full run is 40 x 84s = 56 minutes; a tenth would be 5m36s.
    const total = 3360;
    expect(clockState(301, total)).toBe('calm');
    expect(clockState(300, total)).toBe('warning');
  });

  it('still warns on a short free paper before going straight to urgent', () => {
    // 10 questions x 90s = 15 minutes. A flat 5-minute warning would fire at a
    // third of the paper; the 10% rule keeps it proportional.
    const total = 900;
    expect(clockState(200, total)).toBe('calm');
    expect(clockState(90, total)).toBe('warning');
    expect(clockState(60, total)).toBe('urgent');
  });
});
