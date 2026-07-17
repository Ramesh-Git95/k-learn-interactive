import React, { useEffect, useState } from 'react';
import type { Section } from '../types';
import { apiClient, DailySessionData, DailySessionStep } from '../services/apiClient';
import { todayISO } from '../utils/xpStreak';
import { useXPStreak } from '../hooks/useXPStreak';
import type { SRSDeck } from '../services/spacedRepetition';

// "Today's Session" — a guided ~15-minute daily plan, persisted server-side
// (DailySession) so it survives crashes/refreshes/device switches. Every step
// carries its own baseline+goal; completion is AUTO-detected by comparing
// live progress numbers against them.
//
// Composition is STAGE-AWARE:
//  - Newbie (level 1, less than half of Hangul done): a gentle no-Korean-
//    required plan — Hangul characters, culture tips (English), first phrases.
//  - Standard: review due SRS cards → learn in the current path section → quiz.

const REVIEW_GOAL = 5; // due-card reduction that completes the review step

// Path order for picking the standard "learn" step.
const PATH: { id: Section; name: string }[] = [
  { id: 'hangul',     name: 'Hangul' },
  { id: 'vocabulary', name: 'Vocabulary' },
  { id: 'grammar',    name: 'Grammar' },
  { id: 'phrases',    name: 'Phrases' },
  { id: 'culture',    name: 'Culture' },
];

const STEP_ICONS: Record<DailySessionStep['id'], string> = { srs: '🧠', learn: '📖', quiz: '✍️' };

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
      const hangulTotal = getSectionTotalItems('hangul');
      const hangulDone = getSectionCompletedItems('hangul');
      const isNewbie = xp.level === 1 && hangulTotal > 0 && hangulDone / hangulTotal < 0.5;

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
        const next = PATH.find(s => {
          const total = getSectionTotalItems(s.id);
          return total > 0 && getSectionCompletedItems(s.id) < total;
        });
        if (next) steps.push(learnStepFor(next.id, 3, `Learn 3 new in ${next.name}`));
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
    return (
      <div className="rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 flex items-center gap-4 flex-wrap">
        <span className="text-3xl" aria-hidden="true">🎉</span>
        <div className="flex-1 min-w-[220px]">
          <h2 className="text-base font-black text-emerald-900 dark:text-emerald-200">Today's session complete!</h2>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {total} of {total} steps done — your streak is safe. 오늘도 화이팅! 🔥
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">See you tomorrow 🌱</span>
      </div>
    );
  }

  // ── Active session card ───────────────────────────────────────────────────
  return (
    <div className="rounded-2xl p-5 sm:p-6 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #0D141F 0%, #16202F 55%, #1E3A5C 100%)' }}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-base font-black flex items-center gap-2">
          ⚡ Today's Session
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/70">~15 min</span>
        </h2>
        <span className="text-xs font-bold text-white/60">{doneCount}/{total} done · progress saved automatically</span>
      </div>

      {/* Steps */}
      <div className="space-y-2 mb-4">
        {session.steps.map(step => {
          const isCurrent = current?.id === step.id && current?.target === step.target;
          return (
            <button
              key={`${step.id}-${step.target}`}
              onClick={() => !step.done && startStep(step)}
              disabled={step.done}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-150 ${
                step.done
                  ? 'bg-white/5 text-white/40'
                  : isCurrent
                  ? 'bg-white/15 border border-[#F07A55]/50 hover:bg-white/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              <span className="text-lg" aria-hidden="true">{step.done ? '✅' : STEP_ICONS[step.id]}</span>
              <span className={`flex-1 text-sm font-semibold ${step.done ? 'line-through' : ''}`}>{displayLabel(step)}</span>
              {isCurrent && <span className="text-[10px] font-black uppercase tracking-wider text-[#F07A55]">Up next →</span>}
            </button>
          );
        })}
      </div>

      {/* Progress + CTA */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(doneCount / total) * 100}%`, background: 'var(--brand-gradient-h)' }} />
        </div>
        {current && (
          <button
            onClick={() => startStep(current)}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-black text-white btn-brand"
          >
            {doneCount === 0 ? "Start today's session →" : 'Continue →'}
          </button>
        )}
      </div>
    </div>
  );
}
