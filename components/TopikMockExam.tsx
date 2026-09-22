import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Flag, Clock, AlertTriangle } from 'lucide-react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';
import { accentFor } from '../utils/moduleAccent';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import {
  PAPERS,
  FREE_QUESTION_COUNT,
  buildPaper,
  scoreExam,
  formatClock,
  clockState,
  type PaperId,
  type ExamPaper,
  type ExamResult,
} from '../utils/mockExam';
import TopikExamDates from './TopikExamDates';

// Exam conditions.
//
// The prep section teaches: one question at a time, reasoning shown, no clock.
// This is the opposite, on purpose. What people fail on is not knowing less
// than they thought — it is the pace, and the way a clock removes the option to
// think for a while. So: no feedback until it is over, no going back once it is
// submitted, and a submission that happens whether or not you were ready.
//
// The length is stated plainly on the brief rather than implied. A real TOPIK I
// is 70 questions; this is twenty at the same seconds-per-question. Saying "mock
// exam" and quietly serving a quarter of a paper would be the kind of claim this
// project keeps removing from its own copy.

const ACC = accentFor('topik');
const PINE = '#2E6B59';
const OCHRE = '#A8761F';
const RED = '#C13F22';
const OPTION_LABELS = ['①', '②', '③', '④'];

type Screen = 'brief' | 'running' | 'done';

const TopikMockExam: React.FC = () => {
  const { isPremium } = useFeatureAccess();
  const { openUpgradeModal } = useUpgradeModal();

  const [screen, setScreen] = useState<Screen>('brief');
  const [paperId, setPaperId] = useState<PaperId>('I');
  const [exam, setExam] = useState<ExamPaper | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [qIdx, setQIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [confirming, setConfirming] = useState(false);

  // The clock counts from a fixed end time rather than by decrementing a
  // number once a second. A background tab gets its timers throttled, so a
  // decrementing counter would quietly award extra minutes to anyone who
  // switched away — which is exactly the pressure this screen exists to apply.
  const endsAtRef = useRef<number>(0);
  const finishRef = useRef<(ranOut: boolean) => void>(() => {});

  const finish = useCallback(
    (ranOut: boolean) => {
      if (!exam) return;
      const r = scoreExam(exam.questions, answers, ranOut);
      setResult(r);
      setScreen('done');
      markStudyToday();
      // Sitting the paper is the achievement; the score is its own feedback.
      earnXP(Math.min(10 + r.correct * 2, 60));
    },
    [exam, answers],
  );

  // Kept in a ref so the interval below can call the latest version without
  // being torn down and restarted on every answer.
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  useEffect(() => {
    if (screen !== 'running') return;

    const tick = () => {
      const left = Math.round((endsAtRef.current - Date.now()) / 1000);
      setSecondsLeft(left);
      if (left <= 0) finishRef.current(true);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [screen]);

  const start = () => {
    const built = buildPaper(paperId, isPremium);
    setExam(built);
    setAnswers(new Array(built.questions.length).fill(null));
    setFlagged(new Set());
    setQIdx(0);
    setResult(null);
    endsAtRef.current = Date.now() + built.totalSeconds * 1000;
    setSecondsLeft(built.totalSeconds);
    setConfirming(false);
    setScreen('running');
  };

  const choose = (optionIdx: number) => {
    setAnswers(prev => {
      const next = [...prev];
      next[qIdx] = optionIdx;
      return next;
    });
  };

  const toggleFlag = () =>
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(qIdx) ? next.delete(qIdx) : next.add(qIdx);
      return next;
    });

  const answeredCount = answers.filter(a => a !== null).length;
  const blankCount = exam ? exam.questions.length - answeredCount : 0;

  // Submitting with questions still blank is worth one question — the real
  // exam gives no undo either, and someone who paged past a hard one and meant
  // to return should not lose it to a stray click. Nothing to ask when the
  // paper is complete, so it goes straight through.
  const attemptSubmit = () => {
    if (blankCount > 0) setConfirming(true);
    else finish(false);
  };
  const state = exam ? clockState(secondsLeft, exam.totalSeconds) : 'calm';
  // Alarm colours only. The calm state takes its colour from the theme via a
  // class, because a fixed #16202F is near-black on the dark exam bar — the
  // clock, the one thing this screen is about, was unreadable in dark mode
  // until it turned amber.
  const clockAlarm = state === 'urgent' ? RED : state === 'warning' ? OCHRE : undefined;
  const clockStyle = clockAlarm ? { color: clockAlarm } : undefined;

  // ── Brief ────────────────────────────────────────────────────────────────
  if (screen === 'brief') {
    const paper = PAPERS[paperId];
    const count = isPremium ? paper.questionCount : FREE_QUESTION_COUNT;
    const minutes = Math.round((count * paper.secondsPerQuestion) / 60);

    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            Mock exam
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-[14px] leading-[1.6] text-[#3E4A5A] dark:text-gray-400">
            Exam conditions. A clock that does not stop, an answer sheet instead of a tutor, and no
            hints until you submit. This is the part a textbook cannot rehearse.
          </p>
        </div>

        <div className="flex flex-col items-start gap-5 lg:flex-row">
          <div className="order-1 w-full min-w-0 flex-1">
            <div className="mb-4 flex gap-2">
              {(['I', 'II'] as PaperId[]).map(id => (
                <button
                  key={id}
                  onClick={() => setPaperId(id)}
                  className="flex-1 rounded-[12px] border-[1.5px] border-[rgba(20,32,47,0.14)] px-4 py-3 text-left transition-colors dark:border-gray-700"
                  style={
                    paperId === id
                      ? { borderColor: ACC.light, background: `${ACC.light}14` }
                      : undefined
                  }
                >
                  <div className="text-[14.5px] font-semibold text-[#16202F] dark:text-white">
                    {PAPERS[id].title}
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-[#4A5566] dark:text-gray-500">
                    {id === 'I' ? 'Levels 1–2 · beginner' : 'Levels 3–6 · intermediate and up'}
                  </div>
                </button>
              ))}
            </div>

            <div className="kl-card p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                <span className="text-[26px] font-bold text-[#16202F] dark:text-white">{count}</span>
                <span className="text-[13.5px] text-[#4A5566] dark:text-gray-400">questions</span>
                <span className="text-[26px] font-bold text-[#16202F] dark:text-white">{minutes}</span>
                <span className="text-[13.5px] text-[#4A5566] dark:text-gray-400">minutes</span>
              </div>

              <ul className="mt-4 flex flex-col gap-2 text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-300">
                <li>· The clock keeps running if you switch tabs or look away.</li>
                <li>· No explanations, no right-or-wrong, until you submit.</li>
                <li>· You can move between questions and flag any to revisit.</li>
                <li>· When the time is up the paper submits itself, finished or not.</li>
              </ul>

              {/* Said plainly, because "mock exam" implies a full paper and this
                  is not one. The pace is real; the length is not. */}
              <p className="mt-4 rounded-[12px] bg-[rgba(20,32,47,0.045)] px-4 py-3 text-[12.5px] leading-[1.55] text-[#3E4A5A] dark:bg-white/[0.06] dark:text-gray-400">
                A real {paper.title} is {paper.realWorld.questions} questions in{' '}
                {paper.realWorld.minutes} minutes across listening and reading. This is a shorter
                paper at the same seconds per question — a rehearsal of the pace, not a full
                sitting. Questions are ours, written in the official style.
              </p>

              <button
                onClick={start}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-[12px] text-[15px] font-semibold text-white transition-transform hover:scale-[1.01]"
                style={{ background: ACC.light }}
              >
                Start the clock
              </button>

              {!isPremium && (
                <p className="mt-3 text-center text-[12.5px] text-[#4A5566] dark:text-gray-500">
                  Free runs are {FREE_QUESTION_COUNT} questions ·{' '}
                  <button
                    onClick={openUpgradeModal}
                    className="font-semibold hover:underline"
                    style={{ color: ACC.light }}
                  >
                    unlock the full {paper.questionCount}-question paper
                  </button>
                </p>
              )}
            </div>
          </div>

          <div className="order-2 w-full flex-none lg:w-[290px]">
            <TopikExamDates limit={2} />
          </div>
        </div>
      </div>
    );
  }

  // ── Running ──────────────────────────────────────────────────────────────
  if (screen === 'running' && exam) {
    const q = exam.questions[qIdx];

    return (
      <div className="mx-auto max-w-5xl">
        {/* Clock bar. Sticky, because the whole point is that you cannot forget
            it is there. */}
        <div className="sticky top-2 z-20 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#16202F] dark:text-white" style={clockStyle} />
            <span
              className="text-[20px] font-bold tabular-nums text-[#16202F] dark:text-white"
              style={clockStyle}
              role="timer"
              aria-live="off"
            >
              {formatClock(secondsLeft)}
            </span>
            {state !== 'calm' && (
              <span className="text-[12px] font-semibold" style={clockStyle}>
                {state === 'urgent' ? 'last minute' : 'time is going'}
              </span>
            )}
          </div>

          <div className="text-[13px] text-[#4A5566] dark:text-gray-400">
            {answeredCount} of {exam.questions.length} answered
          </div>

          <button
            onClick={attemptSubmit}
            className="h-9 rounded-[10px] px-4 text-[13px] font-semibold text-white"
            style={{ background: ACC.light }}
          >
            Submit
          </button>
        </div>

        {confirming && (
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] px-4 py-3"
            style={{ background: `${OCHRE}14`, border: `1px solid ${OCHRE}55` }}
          >
            <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-300">
              {blankCount} question{blankCount === 1 ? '' : 's'} still blank. Submit anyway? The
              clock keeps running while you decide.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="h-9 rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.18)] px-4 text-[13px] font-semibold text-[#16202F] dark:border-gray-700 dark:text-gray-200"
              >
                Keep going
              </button>
              <button
                onClick={() => finish(false)}
                className="h-9 rounded-[10px] px-4 text-[13px] font-semibold text-white"
                style={{ background: PINE }}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col items-start gap-5 lg:flex-row">
          <div className="order-1 w-full min-w-0 flex-1">
            <div className="kl-card p-5 sm:p-6">
              <div className="mb-1 text-[12.5px] font-semibold" style={{ color: ACC.light }}>
                Question {qIdx + 1} of {exam.questions.length}
              </div>
              <p className="text-[14px] text-[#3E4A5A] dark:text-gray-400">{q.instruction}</p>
              {q.sentence && (
                <p className="mt-3 font-korean text-[19px] font-semibold text-[#16202F] dark:text-white">
                  {q.sentence}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2">
                {q.options.map((opt, i) => {
                  const picked = answers[qIdx] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      className="flex items-center gap-3 rounded-[12px] border-[1.5px] border-[rgba(20,32,47,0.14)] px-4 py-3 text-left transition-colors dark:border-gray-700"
                      style={picked ? { borderColor: ACC.light, background: `${ACC.light}14` } : undefined}
                    >
                      <span
                        className="text-[15px] text-[#4A5566] dark:text-gray-400"
                        style={picked ? { color: ACC.light } : undefined}
                      >
                        {OPTION_LABELS[i]}
                      </span>
                      <span className="font-korean text-[15.5px] text-[#16202F] dark:text-white">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  onClick={toggleFlag}
                  className="flex h-10 items-center gap-1.5 rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.18)] px-3 text-[13px] font-semibold text-[#4A5566] transition-colors dark:border-gray-700 dark:text-gray-400"
                  style={
                    flagged.has(qIdx)
                      ? { borderColor: OCHRE, color: OCHRE, background: `${OCHRE}12` }
                      : undefined
                  }
                >
                  <Flag className="h-3.5 w-3.5" /> {flagged.has(qIdx) ? 'Flagged' : 'Flag'}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setQIdx(i => Math.max(0, i - 1))}
                    disabled={qIdx === 0}
                    className="h-10 rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.18)] px-4 text-[13px] font-semibold text-[#16202F] dark:border-gray-700 disabled:opacity-40 dark:text-gray-200"
                  >
                    Back
                  </button>
                  {/* On the last question "Next" had nothing to point at and
                      sat there disabled — a dead control at the one moment the
                      reader most needs to know what to do. It becomes the
                      finish instead, in a different colour so it cannot be
                      pressed by muscle memory while paging through. */}
                  {qIdx === exam.questions.length - 1 ? (
                    <button
                      onClick={attemptSubmit}
                      className="h-10 rounded-[10px] px-5 text-[13px] font-semibold text-white"
                      style={{ background: PINE }}
                    >
                      Finish and submit
                    </button>
                  ) : (
                    <button
                      onClick={() => setQIdx(i => Math.min(exam.questions.length - 1, i + 1))}
                      className="h-10 rounded-[10px] px-5 text-[13px] font-semibold text-white"
                      style={{ background: ACC.light }}
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Answer sheet */}
          <div className="order-2 w-full flex-none lg:w-[290px]">
            <div className="rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
                Answer sheet
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {exam.questions.map((_, i) => {
                  const isNow = i === qIdx;
                  const isFlagged = flagged.has(i);
                  const isAnswered = answers[i] !== null;
                  return (
                    <button
                      key={i}
                      onClick={() => setQIdx(i)}
                      aria-label={`Question ${i + 1}${isAnswered ? ', answered' : ', blank'}`}
                      // Blank and current cells take their neutral colours from
                      // the theme; only the filled states are set inline. A
                      // blank cell was ink at 5% — invisible on the dark card,
                      // so the sheet could not show what was still left to do.
                      className={`flex h-7 items-center justify-center rounded-md text-[11.5px] font-semibold text-[#16202F] transition-transform hover:scale-105 dark:text-gray-200 ${
                        !isNow && !isFlagged && !isAnswered ? 'bg-[rgba(20,32,47,0.06)] dark:bg-white/10' : ''
                      }`}
                      style={
                        isNow
                          ? { border: `1.5px solid ${ACC.light}`, background: `${ACC.light}24` }
                          : isFlagged
                            ? { background: OCHRE, color: '#fff' }
                            : isAnswered
                              ? { background: PINE, color: '#fff' }
                              : undefined
                      }
                    >
                      <span>
                        {i + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-[12.5px] text-[#4A5566] dark:text-gray-500">
                <span style={{ color: PINE }}>answered</span>
                <span style={{ color: OCHRE }}>flagged</span>
                <span>blank</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  if (screen === 'done' && exam && result) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="kl-card mb-4 p-6">
          {result.ranOutOfTime && (
            <div
              className="mb-4 flex items-start gap-2.5 rounded-[12px] px-4 py-3"
              style={{ background: `${RED}12` }}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" style={{ color: RED }} />
              <p className="text-[13.5px] leading-[1.55]" style={{ color: RED }}>
                Time ran out and the paper submitted itself — {result.unanswered} left blank. That is
                what happens in the hall, and pace is the most fixable part of it.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-[34px] font-bold text-[#16202F] dark:text-white">
              {result.correct}
            </span>
            <span className="text-[15px] text-[#4A5566] dark:text-gray-400">
              of {result.total} right · {result.percent}%
            </span>
          </div>
          {result.unanswered > 0 && !result.ranOutOfTime && (
            <p className="mt-1.5 text-[13.5px] text-[#4A5566] dark:text-gray-500">
              {result.unanswered} left blank.
            </p>
          )}

          {/* No band estimate. See the note in utils/mockExam.ts — a grade from
              a short paper would be invented, and the level test already
              answers that question properly. */}
          <p className="mt-3 text-[12.5px] leading-[1.55] text-[#4A5566] dark:text-gray-500">
            This is a score on our questions, not a TOPIK grade — real bands come from full papers
            with published cut-offs. What it does tell you is whether the pace is survivable.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={start}
              className="h-11 rounded-[10px] px-5 text-[14px] font-semibold text-white"
              style={{ background: ACC.light }}
            >
              Sit another paper
            </button>
            <button
              onClick={() => setScreen('brief')}
              className="h-11 rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.18)] px-5 text-[14px] font-semibold text-[#16202F] dark:border-gray-700 dark:text-gray-200"
            >
              Back to the brief
            </button>
          </div>
        </div>

        <div className="kl-card p-5 sm:p-6">
          <div className="mb-3.5 text-[14px] font-semibold text-[#16202F] dark:text-white">
            Every question, with the reasoning
          </div>
          <div className="flex flex-col gap-3">
            {exam.questions.map((q, i) => {
              const given = answers[i];
              const right = given === q.answer;
              return (
                <div key={q.id} className="kl-well rounded-xl p-4">
                  <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold">
                    <span
                      className="text-[#4A5566] dark:text-gray-400"
                      style={right ? { color: PINE } : given !== null ? { color: RED } : undefined}
                    >
                      {i + 1}. {right ? 'Right' : given === null ? 'Blank' : 'Wrong'}
                    </span>
                  </div>
                  {q.sentence && (
                    <p className="font-korean text-[16px] font-semibold text-[#16202F] dark:text-white">
                      {q.sentence}
                    </p>
                  )}
                  {!right && given !== null && (
                    <p className="mt-1.5 text-[13.5px]" style={{ color: RED }}>
                      You chose {OPTION_LABELS[given]} {q.options[given]}
                    </p>
                  )}
                  <p className="mt-1.5 text-[13.5px]" style={{ color: PINE }}>
                    {OPTION_LABELS[q.answer]} {q.options[q.answer]}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#3E4A5A] dark:text-gray-300">
                    {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TopikMockExam;
