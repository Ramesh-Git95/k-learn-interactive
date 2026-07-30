import React, { useEffect, useState } from 'react';
import type { Section } from '../types';
import { apiClient, DailySessionData, DailySessionStep } from '../services/apiClient';
import { todayISO } from '../utils/xpStreak';
import { canSkipHangul } from '../utils/topikEstimate';
import { useXPStreak } from '../hooks/useXPStreak';
import { useProgress } from '../contexts/ProgressContext';
import { getNextUnit } from '../utils/learningUnits';
import type { SRSDeck } from '../services/spacedRepetition';
import { accentFor } from '../utils/moduleAccent';

// "Today's Session" — a guided ~15-minute daily plan, persisted server-side
// (DailySession) so it survives crashes/refreshes/device switches. Every step
// carries its own baseline+goal; completion is AUTO-detected by comparing
// live progress numbers against them.
//
// Composition is STAGE-AWARE:
//  - Newbie (level 1, less than half of Hangul done): a gentle no-Korean-
//    required plan — Hangul characters, culture tips (English), first phrases.
//  - Standard: review due SRS cards → finish the next lesson-sized unit → quiz.

const REVIEW_GOAL = 5; // due-card reduction that completes the review step

// Korean glyph per step, in the mockup's language — a tinted well with a real
// character, not an emoji. Learn steps take the glyph of the section they point
// at, so the row tells you what kind of work it is before you read it.
const SECTION_GLYPH: Partial<Record<Section, string>> = {
  hangul: '한', vocabulary: '단', phrases: '말', grammar: '법',
  culture: '문', reading: '독', writing: '쓰', typing: '타', honorifics: '님',
};
const glyphFor = (step: DailySessionStep): string =>
  step.id === 'srs' ? '복' : step.id === 'quiz' ? '시' : (SECTION_GLYPH[step.target as Section] ?? '학');

// Which module colour a step borrows.
const accentSection = (step: DailySessionStep): Section =>
  step.id === 'srs' ? 'srs' : step.id === 'quiz' ? 'quiz' : (step.target as Section);

// Rough minutes per step kind — the card already advertises "~15 min" total;
// these split it so each row says what it costs. Estimates, not measurements.
const STEP_MINUTES: Record<DailySessionStep['id'], number> = { srs: 4, learn: 6, quiz: 3 };

const KIND_LABEL: Record<DailySessionStep['id'], string> = { srs: 'REVIEW', learn: 'LEARN', quiz: 'QUIZ' };

interface TodaysSessionProps {
  srsDue: number;
  decks: SRSDeck[];
  getSectionTotalItems: (section: Section) => number;
  getSectionCompletedItems: (section: Section) => number;
  setActiveSection: (section: Section) => void;
  onStartStudy?: (deckId: string) => void;
  /** Fired when the session's completed state resolves/changes — lets the
   *  dashboard swap in follow-up content (e.g. the Continue card). */
  onCompleteChange?: (complete: boolean) => void;
}

export default function TodaysSession({
  srsDue, decks, getSectionTotalItems, getSectionCompletedItems, setActiveSection, onStartStudy, onCompleteChange,
}: TodaysSessionProps) {
  const [session, setSession] = useState<DailySessionData | null>(null);
  const [quizzesToday, setQuizzesToday] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const xp = useXPStreak();
  // Read inside the composer only — the session is composed once per day, so a
  // later progress change must not recompose and move the goalposts mid-session.
  const { progress } = useProgress();

  const date = todayISO();

  // Deck with the most due cards — the target for the review step.
  const bestDeckId = (() => {
    const now = new Date();
    let best: { id: string; due: number } | null = null;
    for (const d of decks) {
      const due = d.cards.filter(c => new Date(c.srs.nextReviewDate) <= now).length;
      if (due > 0 && (!best || due > best.due)) best = { id: d.id, due };
    }
    return best?.id ?? '';
  })();

  // Live metric for a step, by kind.
  const metricFor = (step: DailySessionStep): number => {
    if (step.id === 'srs') return srsDue;
    if (step.id === 'quiz') return quizzesToday ?? 0;
    return getSectionCompletedItems(step.target as Section);
  };

  const isStepDone = (step: DailySessionStep): boolean => {
    if (step.done) return true;
    const metric = metricFor(step);
    if (step.id === 'srs') return metric <= Math.max(0, step.baseline - step.goal);
    if (step.id === 'learn') {
      const total = getSectionTotalItems(step.target as Section);
      return metric >= step.baseline + step.goal || (total > 0 && metric >= total);
    }
    return metric >= step.baseline + step.goal; // quiz
  };

  // ── Load (resume) or compose today's session ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [sessRes, actRes] = await Promise.all([
        apiClient.getTodaySession(date),
        apiClient.getDailyActivity(),
      ]);
      if (cancelled) return;

      const quizzes = actRes.success ? (actRes.data.dailyActivity?.quizzesTaken ?? 0) : 0;
      setQuizzesToday(quizzes);

      // Resume — but recompose if the doc predates the per-step baseline/goal shape.
      const stored = sessRes.success ? sessRes.data.session : null;
      if (stored && Array.isArray(stored.steps) && stored.steps.every(s => typeof s.goal === 'number' && s.goal > 0)) {
        setSession(stored);
        setLoading(false);
        return;
      }

      // ── Compose, stage-aware ──
      // TOPIK placement: a tested level of 2+ means the learner reads Hangul —
      // never treat them as a newbie, and skip the alphabet in suggestions.
      const skipHangul = canSkipHangul();
      const hangulTotal = getSectionTotalItems('hangul');
      const hangulDone = getSectionCompletedItems('hangul');
      const isNewbie = !skipHangul && xp.level === 1 && hangulTotal > 0 && hangulDone / hangulTotal < 0.5;

      const learnStepFor = (id: Section, goal: number, label: string): DailySessionStep => ({
        id: 'learn', target: id, label, baseline: getSectionCompletedItems(id), goal, done: false, doneAt: null,
      });

      let steps: DailySessionStep[] = [];
      if (isNewbie) {
        // Gentle first days: nothing that assumes the user can read Korean yet.
        steps = [
          learnStepFor('hangul', 3, 'Learn 3 Hangul characters'),
          learnStepFor('culture', 2, 'Explore 2 Korean culture tips'),
          learnStepFor('phrases', 2, 'Learn 2 essential phrases'),
        ];
      } else {
        if (srsDue > 0 && bestDeckId) {
          steps.push({
            id: 'srs', target: bestDeckId, label: 'Review your due cards',
            baseline: srsDue, goal: Math.min(srsDue, REVIEW_GOAL), done: false, doneAt: null,
          });
        }
        // Target the next lesson-sized UNIT rather than a whole section.
        // "Finish Aspirated sounds · 3 left" is a thing you can actually picture
        // completing; "Learn 3 new in Hangul" points at a section that takes
        // hours. Completion is still measured against the section's item count,
        // which rises as the unit's own items are finished.
        const nextUnit = getNextUnit(progress, skipHangul ? ['hangul'] : []);
        if (nextUnit) {
          const remaining = nextUnit.total - nextUnit.completed;
          const goal = Math.min(remaining, 5);
          const label = goal >= remaining
            ? `Finish ${nextUnit.unit.title}`
            : `Learn ${goal} more in ${nextUnit.unit.title}`;
          steps.push(learnStepFor(nextUnit.unit.section, goal, label));
        }
        steps.push({ id: 'quiz', target: 'quiz', label: 'Take one quick quiz', baseline: quizzes, goal: 1, done: false, doneAt: null });
      }

      const fresh: DailySessionData = { date, steps, completedAt: null };
      setSession(fresh);
      setLoading(false);
      apiClient.saveTodaySession(fresh); // fire-and-forget persist
    })();
    return () => { cancelled = true; };
    // Compose once per mount — the resume path covers everything else.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // ── Auto-detect completion against per-step baselines ─────────────────────
  // Depend on a fingerprint of live NUMBERS (not context functions — CLAUDE.md
  // unstable-function gotcha).
  const fingerprint = session
    ? session.steps.map(s => metricFor(s)).join('|')
    : '';

  useEffect(() => {
    if (!session || session.completedAt || quizzesToday === null) return;

    let changed = false;
    const steps = session.steps.map(step => {
      if (step.done) return step;
      if (isStepDone(step)) { changed = true; return { ...step, done: true, doneAt: new Date().toISOString() }; }
      return step;
    });

    if (!changed) return;
    const allDone = steps.every(s => s.done);
    const updated: DailySessionData = { ...session, steps, completedAt: allDone ? new Date().toISOString() : null };
    setSession(updated);
    apiClient.saveTodaySession(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, fingerprint, quizzesToday]);

  // Report completion upward (dashboard swaps in follow-up content). The
  // setter passed from the dashboard bails on same-value updates, so the
  // unstable inline-prop identity is harmless here.
  const isComplete = !!session && (!!session.completedAt || (session.steps.length > 0 && session.steps.every(s => s.done)));
  useEffect(() => {
    if (!loading && session) onCompleteChange?.(isComplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, loading]);

  if (loading) {
    return <div className="skeleton h-32 rounded-2xl" aria-label="Loading today's session" />;
  }
  if (!session || session.steps.length === 0) return null;

  const doneCount = session.steps.filter(s => s.done).length;
  const total = session.steps.length;
  const complete = isComplete;
  const current = session.steps.find(s => !s.done);

  const startStep = (step: DailySessionStep) => {
    if (step.id === 'srs' && onStartStudy && step.target) onStartStudy(step.target);
    else if (step.id === 'quiz') setActiveSection('quiz');
    else setActiveSection(step.target as Section);
  };

  // Live labels for unfinished steps — progress counts down/up as you work.
  const displayLabel = (step: DailySessionStep): string => {
    if (step.done) return step.label;
    if (step.id === 'srs') {
      const toGo = Math.max(0, srsDue - Math.max(0, step.baseline - step.goal));
      return `${step.label} · ${toGo} to go`;
    }
    if (step.id === 'learn') {
      const progress = Math.min(step.goal, Math.max(0, metricFor(step) - step.baseline));
      return `${step.label} · ${progress}/${step.goal}`;
    }
    return step.label;
  };

  // ── Completed state ───────────────────────────────────────────────────────
  if (complete) {
    const acc = accentFor('vocabulary');
    return (
      <div className="kl-card flex flex-wrap items-center gap-5 p-6">
        <div
          className="flex h-[62px] w-[62px] flex-none items-center justify-center rounded-[14px] font-korean text-2xl font-bold"
          style={{ background: `${acc.light}24`, border: `1px solid ${acc.light}52`, color: acc.light }}
        >
          완
        </div>
        <div className="min-w-[220px] flex-1">
          <div className="mb-1 text-[12.5px] font-semibold text-[#2E6B59] dark:text-[#5FB89B]">
            ALL {total} STEPS DONE
          </div>
          <h2 className="font-display text-[21px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
            Today's session is complete
          </h2>
          <p className="mt-1.5 text-[13.5px] text-[#3E4A5A] dark:text-gray-400">
            Your streak is safe. Rest is part of it — see you tomorrow.
          </p>
        </div>
      </div>
    );
  }

  // ── Active session card ───────────────────────────────────────────────────
  // The mockup's queue shape: the step you are on owns the top of the card as a
  // hero row (big well, kind label, headline, one sentence, solid button); the
  // remaining steps are compact rows underneath, each with its own visible
  // button. Nothing is hover-only.
  const isCurrentStep = (s: DailySessionStep) => current?.id === s.id && current?.target === s.target;

  // One honest sentence per step kind, from real numbers.
  const blurbFor = (step: DailySessionStep): string => {
    if (step.id === 'srs') {
      const toGo = Math.max(0, srsDue - Math.max(0, step.baseline - step.goal));
      return `${toGo} ${toGo === 1 ? 'card is' : 'cards are'} due now. Clearing them keeps words you have already met from slipping away.`;
    }
    if (step.id === 'learn') {
      const got = Math.min(step.goal, Math.max(0, metricFor(step) - step.baseline));
      return `${got} of ${step.goal} done. Small units — you can finish this one in a sitting.`;
    }
    return 'One short quiz to lock in what you learned today.';
  };

  return (
    <div className="kl-card overflow-hidden">
      {/* Card header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(20,32,47,0.12)] px-6 pb-3.5 pt-5 dark:border-gray-800">
        <h2 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-[#16202F] dark:text-white">
          Today's session
        </h2>
        <span className="text-[12.5px] text-[#4A5566] dark:text-gray-400">
          {doneCount}/{total} done · ~15 min · saved automatically
        </span>
      </div>

      {session.steps.map((step, i) => {
        const acc = accentFor(accentSection(step));
        const hero = isCurrentStep(step);
        const stepNo = i + 1;

        // ── Hero row: the step you are on ──
        if (hero) {
          return (
            <div
              key={`${step.id}-${step.target}`}
              className="flex flex-col gap-5 border-b border-[rgba(20,32,47,0.12)] px-6 py-5 sm:flex-row sm:items-center sm:gap-6 dark:border-gray-800"
            >
              <div
                className="flex h-[78px] w-[78px] flex-none flex-col items-center justify-center rounded-[14px]"
                style={{ background: `${acc.light}24`, border: `1px solid ${acc.light}52` }}
              >
                {step.id === 'srs' ? (
                  <>
                    <span className="text-[26px] font-bold leading-none" style={{ color: acc.light }}>{srsDue}</span>
                    <span className="mt-1 text-[11.5px] font-medium" style={{ color: acc.light }}>cards</span>
                  </>
                ) : (
                  <span className="font-korean text-[30px] font-bold leading-none" style={{ color: acc.light }}>
                    {glyphFor(step)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1.5 text-[13px] font-semibold" style={{ color: acc.light }}>
                  STEP {stepNo} OF {total} · {KIND_LABEL[step.id]} · {STEP_MINUTES[step.id]} MIN
                </div>
                <div className="font-display text-[23px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#16202F] dark:text-white">
                  {step.label}
                </div>
                <p className="mt-2 text-[14px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
                  {blurbFor(step)}
                </p>
              </div>

              <button
                onClick={() => startStep(step)}
                className="flex h-12 flex-none items-center justify-center rounded-[10px] px-6 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: acc.light, boxShadow: `0 5px 16px ${acc.light}52` }}
              >
                {step.id === 'srs' ? 'Start review' : step.id === 'quiz' ? 'Start quiz' : 'Open lesson'}
              </button>
            </div>
          );
        }

        // ── Compact row: done, or waiting its turn ──
        return (
          <div
            key={`${step.id}-${step.target}`}
            className={`flex items-center gap-4 px-6 py-4 ${
              i < session.steps.length - 1 ? 'border-b border-[rgba(20,32,47,0.12)] dark:border-gray-800' : ''
            }`}
          >
            <div
              className="flex h-[54px] w-[54px] flex-none items-center justify-center rounded-xl font-korean text-[22px] font-bold"
              style={
                step.done
                  ? { background: 'rgba(20,32,47,0.04)', border: '1px solid rgba(20,32,47,0.10)', color: '#4A5566' }
                  : { background: `${acc.light}1A`, border: `1px solid ${acc.light}45`, color: acc.light }
              }
            >
              {step.done ? '✓' : glyphFor(step)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 text-[12.5px] font-semibold text-[#4A5566] dark:text-gray-500">
                STEP {stepNo} · {KIND_LABEL[step.id]}
                {!step.done && ` · ${STEP_MINUTES[step.id]} MIN`}
                {step.done && ' · DONE'}
              </div>
              <div
                className={`truncate text-[16px] font-semibold ${
                  step.done ? 'text-[#4A5566] line-through dark:text-gray-500' : 'text-[#16202F] dark:text-white'
                }`}
              >
                {displayLabel(step)}
              </div>
            </div>

            {!step.done && (
              <button
                onClick={() => startStep(step)}
                className="flex h-11 flex-none items-center rounded-[9px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[14px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
              >
                Open
              </button>
            )}
          </div>
        );
      })}

      {/* Overall progress */}
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / total) * 100}%`, background: 'var(--brand-gradient-h)' }}
          />
        </div>
        <span className="flex-none text-[12px] font-medium text-[#4A5566] dark:text-gray-500">
          {Math.round((doneCount / total) * 100)}%
        </span>
      </div>
    </div>
  );
}
