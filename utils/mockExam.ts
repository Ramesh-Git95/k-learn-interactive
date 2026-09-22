// A mock exam paper: what is on it, how long there is, and what the score means.
//
// ── WHAT THIS IS, AND WHAT IT IS NOT ────────────────────────────────────────
// This is not a TOPIK paper. Real papers are produced by NIIED and are theirs;
// reproducing them behind a subscription is not something this app does. What
// is simulated here is the *conditions* — a clock that does not stop, an answer
// sheet rather than a tutor, no feedback until it is over, and a submission
// that happens whether or not you were ready. That is the part a textbook
// cannot give you, and it is the part people actually fail on.
//
// ── THE PAPER IS SHORT, AND SAYS SO ─────────────────────────────────────────
// A real TOPIK I is 70 questions in 100 minutes; TOPIK II is 104 in 180. The
// question bank here is 60 in total, so a full-length paper is not honestly
// possible yet and pretending otherwise would be the fabrication this project
// keeps removing. What is possible is the real *pace*: TOPIK I reading allows
// 90 seconds a question, TOPIK II reading 84. Holding that pace over a shorter
// paper is a true rehearsal of the pressure, and the UI states the length
// plainly rather than implying a full sitting.
//
// ── NO BAND ESTIMATE ────────────────────────────────────────────────────────
// Deliberately absent. TOPIK bands come from total scores across sections with
// published cut-offs; deriving "you are level 4" from twenty questions would be
// inventing a grade. The level test already answers "where am I". This answers
// "can I keep the pace", and reports only what it actually measured.

import { QUESTIONS, type TopikQuestion } from '../data/topikQuestions';

export type PaperId = 'I' | 'II';

export interface Paper {
  id: PaperId;
  /** What the real exam calls it. */
  title: string;
  /** Levels this paper draws from — TOPIK I covers 1–2, TOPIK II covers 3–6. */
  levels: number[];
  /** Seconds allowed per question, taken from the real paper's reading pace. */
  secondsPerQuestion: number;
  /** Questions in a full run for a subscriber. */
  questionCount: number;
  /** The real paper, for the honesty line in the UI. */
  realWorld: { questions: number; minutes: number };
}

export const PAPERS: Record<PaperId, Paper> = {
  I: {
    id: 'I',
    title: 'TOPIK I',
    levels: [1, 2],
    secondsPerQuestion: 90, // 40 reading questions in 60 minutes
    questionCount: 20,
    realWorld: { questions: 70, minutes: 100 },
  },
  II: {
    id: 'II',
    title: 'TOPIK II',
    levels: [3, 4, 5, 6],
    secondsPerQuestion: 84, // 50 reading questions in 70 minutes
    questionCount: 40,
    realWorld: { questions: 104, minutes: 180 },
  },
};

/** A free run is short on purpose: long enough to feel the clock, not a whole paper. */
export const FREE_QUESTION_COUNT = 10;

export interface ExamPaper {
  paper: Paper;
  questions: TopikQuestion[];
  /** Total seconds on the clock, derived from the paper's pace. */
  totalSeconds: number;
}

/**
 * Draw a paper.
 *
 * Questions are sampled evenly across the paper's levels and then shuffled, so
 * a TOPIK II run does not walk neatly from level 3 to level 6 — a real paper
 * does not warn you that the hard ones are coming.
 */
export function buildPaper(
  paperId: PaperId,
  isPremium: boolean,
  shuffle: <T>(items: T[]) => T[] = defaultShuffle,
): ExamPaper {
  const paper = PAPERS[paperId];
  const wanted = isPremium ? paper.questionCount : FREE_QUESTION_COUNT;

  const perLevel = Math.ceil(wanted / paper.levels.length);
  const drawn: TopikQuestion[] = [];

  for (const level of paper.levels) {
    const pool = QUESTIONS.filter(q => q.level === level);
    drawn.push(...shuffle(pool).slice(0, perLevel));
  }

  const questions = shuffle(drawn).slice(0, wanted);

  return {
    paper,
    questions,
    totalSeconds: questions.length * paper.secondsPerQuestion,
  };
}

function defaultShuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface ExamResult {
  correct: number;
  total: number;
  /** Questions left blank — separated from wrong answers, because running out of time is a different failure. */
  unanswered: number;
  percent: number;
  /** True when the clock, not the candidate, ended the exam. */
  ranOutOfTime: boolean;
}

/** `answers[i]` is the chosen option index, or null if left blank. */
export function scoreExam(
  questions: TopikQuestion[],
  answers: (number | null)[],
  ranOutOfTime: boolean,
): ExamResult {
  let correct = 0;
  let unanswered = 0;

  questions.forEach((q, i) => {
    const a = answers[i];
    if (a === null || a === undefined) unanswered++;
    else if (a === q.answer) correct++;
  });

  return {
    correct,
    total: questions.length,
    unanswered,
    percent: questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100),
    ranOutOfTime,
  };
}

/** mm:ss, for a clock that has to stay readable at a glance while under pressure. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * How alarmed the clock should look.
 *
 * The warnings are the point: in a real exam nobody tells you the time is
 * going, and the moment you notice is the moment your pace collapses.
 */
export type ClockState = 'calm' | 'warning' | 'urgent';

export function clockState(secondsLeft: number, totalSeconds: number): ClockState {
  if (secondsLeft <= 60) return 'urgent';
  // A tenth of the paper remaining, capped at five minutes.
  //
  // Proportional rather than fixed: five minutes is a sensible nudge in a
  // 56-minute paper and a third of a 15-minute free run, where it would fire so
  // early it stopped meaning anything. The cap keeps the longest papers from
  // warning six minutes out. On the shortest run this lands at 84 seconds,
  // still clear of the one-minute urgent mark.
  if (secondsLeft <= Math.min(300, totalSeconds * 0.1)) return 'warning';
  return 'calm';
}
