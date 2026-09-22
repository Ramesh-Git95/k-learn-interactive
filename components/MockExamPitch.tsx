import React, { useEffect, useRef, useState } from 'react';
import { PAPERS, FREE_QUESTION_COUNT, formatClock } from '../utils/mockExam';

// The mock exam, sold on the feeling rather than the feature list.
//
// What people fail on is not knowing less than they thought — it is the pace,
// and the way a clock removes the option to sit and think. Describing that
// converts nobody. Watching someone work steadily down an answer sheet while
// the timer turns red, and then run out with four questions still blank, does
// the whole job: the reader already knows that feeling from every exam they
// have ever sat.
//
// So this is a scene rather than a screenshot. A paper being answered, a sheet
// filling in, and an ending that is not a win.
//
// Reduced motion gets the last frame instead — time up, four blank — which
// makes the same point with nothing moving.

const PINE = '#2E6B59';
const OCHRE = '#A8761F';
const RED = '#C13F22';

const TOTAL_QUESTIONS = 20;
/** Where the pencil gets to before the clock beats it. The gap is the argument. */
const ANSWERED_BY_END = 16;
const START_SECONDS = 40;

/** Slower than a real second: the reader needs time to notice the colour change. */
const TICK_MS = 620;
const HOLD_AT_ZERO_MS = 2600;

/**
 * Real questions from the app's own bank (level 1), not invented Korean.
 * Copied rather than imported so the landing bundle does not carry the whole
 * TOPIK bank for the sake of a decoration.
 */
const SAMPLES = [
  { sentence: '제 이름( ) 김민준이에요.', options: ['은', '는', '이', '가'], answer: 0 },
  { sentence: '내일 친구( ) 같이 영화를 볼 거예요.', options: ['에게', '와', '에서', '로'], answer: 1 },
  { sentence: '저는 밥( ) 먹어요.', options: ['을', '를', '이', '가'], answer: 0 },
  { sentence: '저는 매일 아침 커피( ) 마셔요.', options: ['이', '가', '을', '를'], answer: 3 },
  { sentence: '저는 학생( ) 아니에요.', options: ['이', '가', '을', '에'], answer: 0 },
];

/**
 * Rotate the options so the answer is not always in the same place.
 *
 * Most questions in the bank are written with the correct option first — the
 * data file says so, and it is why the real quiz shuffles. Without this the
 * pencil landed on ① every single time, which reads as a stuck animation
 * rather than someone working.
 *
 * Rotation rather than a random shuffle: deterministic from the step, so the
 * same frame always looks the same and nothing flickers on a re-render.
 */
const rotated = (sample: (typeof SAMPLES)[number], by: number) => {
  const k = ((by % 4) + 4) % 4;
  return {
    sentence: sample.sentence,
    options: sample.options.map((_, i) => sample.options[(i + k) % 4]),
    answer: (sample.answer - k + 4) % 4,
  };
};

const OPTION_LABELS = ['①', '②', '③', '④'];

const MockExamPitch: React.FC = () => {
  // One counter drives everything: the clock, how much of the sheet is filled,
  // and which question is on screen. Keeping them derived from a single step
  // means they cannot drift out of sync mid-loop.
  const [step, setStep] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReduceMotion(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setStep(START_SECONDS); // the final frame: time up, four blank
      return;
    }
    const host = hostRef.current;
    if (!host) return;

    let tick: number | undefined;
    let hold: number | undefined;
    const stop = () => {
      if (tick) window.clearInterval(tick);
      if (hold) window.clearTimeout(hold);
      tick = hold = undefined;
    };

    const run = () => {
      stop();
      tick = window.setInterval(() => {
        setStep(s => {
          if (s >= START_SECONDS) {
            // Hold on the ending so it reads as an ending, not a flicker.
            stop();
            hold = window.setTimeout(() => {
              setStep(0);
              run();
            }, HOLD_AT_ZERO_MS);
            return s;
          }
          return s + 1;
        });
      }, TICK_MS);
    };

    // Off-screen it does nothing: a landing page should not spend a stranger's
    // battery animating something they have scrolled past.
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? run() : stop()),
      { threshold: 0.35 },
    );
    observer.observe(host);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [reduceMotion]);

  const seconds = Math.max(0, START_SECONDS - step);
  const answered = Math.min(ANSWERED_BY_END, Math.floor((step * ANSWERED_BY_END) / START_SECONDS));
  const timeUp = seconds === 0;

  // The pencil sits on the question being worked, and stops when time does.
  const activeIdx = timeUp ? -1 : answered;
  // Five questions, each rotated by a different amount as the run goes on, so
  // neither the sentence nor the answer's position repeats in a visible cycle.
  const sample = rotated(SAMPLES[answered % SAMPLES.length], answered * 3 + 1);
  // The option lands a beat after the pencil arrives, so it reads as a choice
  // rather than a pre-filled form.
  const picked = step % 2 === 1;

  // Only the alarm colours are set inline. The calm colour is ink in light mode
  // and white in dark, which an inline style cannot express — it was a fixed
  // #16202F, near-black on the dark card, so the clock was invisible for the
  // first half of every run and only appeared once it turned amber.
  const alarm = timeUp || seconds <= 10 ? RED : seconds <= 20 ? OCHRE : undefined;

  return (
    <div ref={hostRef} className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* ── The paper ── */}
      <div className="order-2 lg:order-1">
        <div className="rounded-[20px] border border-[rgba(20,32,47,0.12)] bg-[#FFFCF4] p-5 shadow-[0_22px_60px_-28px_rgba(20,32,47,0.5)] sm:p-6 dark:border-gray-800 dark:bg-gray-900">
          {/* Clock row */}
          <div className="flex items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.1)] pb-4 dark:border-gray-800">
            <div>
              <div className="text-[10.5px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                Time remaining
              </div>
              <div
                className="mt-1 text-[44px] font-bold leading-none tabular-nums text-[#16202F] transition-colors duration-500 sm:text-[52px] dark:text-white"
                style={alarm ? { color: alarm } : undefined}
                aria-hidden="true"
              >
                {formatClock(seconds)}
              </div>
            </div>
            <div className="pb-1 text-right">
              <div className="text-[19px] font-bold tabular-nums text-[#16202F] dark:text-white">
                {answered}
                <span className="text-[14px] font-medium text-gray-400 dark:text-gray-500">
                  {' '}/ {TOTAL_QUESTIONS}
                </span>
              </div>
              <div className="text-[11.5px] text-gray-400 dark:text-gray-500">answered</div>
            </div>
          </div>

          {/* The question being worked on */}
          <div className="py-4" aria-hidden="true">
            {timeUp ? (
              <div className="flex items-center gap-2.5 rounded-[12px] px-4 py-3.5" style={{ background: `${RED}12` }}>
                <span className="text-[17px]">⏱</span>
                <p className="text-[13.5px] font-semibold leading-[1.5]" style={{ color: RED }}>
                  Time. The paper submitted itself — {TOTAL_QUESTIONS - ANSWERED_BY_END} left blank.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-2 text-[11.5px] font-semibold text-gray-400 dark:text-gray-500">
                  Question {answered + 1}
                </div>
                <p className="font-korean text-[19px] font-semibold text-[#16202F] dark:text-white">
                  {sample.sentence}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {sample.options.map((opt, i) => {
                    const chosen = picked && i === sample.answer;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.12)] px-3 py-2 transition-all duration-300 dark:border-white/15"
                        style={chosen ? { borderColor: PINE, background: `${PINE}1F` } : undefined}
                      >
                        <span className="text-[13px]" style={{ color: chosen ? PINE : '#9AA4B2' }}>
                          {OPTION_LABELS[i]}
                        </span>
                        <span className="font-korean text-[14.5px] text-[#16202F] dark:text-white">{opt}</span>
                        {chosen && <span className="ml-auto text-[12px]">✏️</span>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Answer sheet, filling in behind the pencil */}
          <div className="border-t border-[rgba(20,32,47,0.1)] pt-4 dark:border-gray-800">
            <div className="grid grid-cols-10 gap-1.5" aria-hidden="true">
              {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
                const done = i < answered;
                const isActive = i === activeIdx;
                return (
                  <span
                    key={i}
                    // Blank cells take their colour from the theme. They were
                    // ink at 9% opacity, which on the dark card is ink on ink:
                    // the sheet looked like one amber cell floating alone, and
                    // "four left blank" — the whole point — had nothing to see.
                    className={`flex h-6 items-center justify-center rounded-[5px] border-[1.5px] border-transparent text-[9px] transition-all duration-300 ${
                      done || isActive ? '' : 'bg-[rgba(20,32,47,0.09)] dark:bg-white/[0.13]'
                    }`}
                    style={
                      done
                        ? { background: PINE }
                        : isActive
                          ? { background: `${OCHRE}2E`, borderColor: OCHRE }
                          : undefined
                    }
                  >
                    {isActive ? '✏️' : ''}
                  </span>
                );
              })}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-3 text-[11.5px] text-gray-500 dark:text-gray-400">
              <span style={{ color: PINE }}>answered</span>
              <span style={{ color: OCHRE }}>working on it</span>
              <span>blank</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── The claim ── */}
      <div className="order-1 min-w-0 lg:order-2">
        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#3F8571]">
          Premium · Mock exam
        </span>
        <h3 className="mt-3 text-2xl font-black leading-[1.15] text-gray-900 sm:text-3xl dark:text-white">
          Nobody fails TOPIK because<br className="hidden sm:block" /> they didn't know the word.
        </h3>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.65] text-gray-600 dark:text-gray-400">
          They fail because the clock took the thinking time away. So practise the clock. A timed
          paper, an answer sheet instead of a tutor, no hints until you submit — and if the time
          goes, it submits itself with your blanks still blank.
        </p>

        <ul className="mt-5 flex flex-col gap-2 text-[14px] text-gray-600 dark:text-gray-400">
          <li>· Real seconds-per-question, taken from the official paper</li>
          <li>· Flag anything, jump anywhere, change your mind — until time</li>
          <li>· Every answer explained afterwards, never during</li>
        </ul>

        <p className="mt-5 text-[13px] leading-[1.6] text-gray-500 dark:text-gray-500">
          Free accounts sit a {FREE_QUESTION_COUNT}-question run — enough to feel it. Premium opens
          the {PAPERS.I.questionCount}-question TOPIK I and {PAPERS.II.questionCount}-question
          TOPIK II papers, at $4/month.
        </p>
      </div>
    </div>
  );
};

export default MockExamPitch;
