import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Section } from '../types';
import { SRSCard, SpacedRepetitionSystem } from '../services/spacedRepetition';
import { useSRSContext } from '../contexts/SRSContext';
import Tooltip from './Tooltip';
import NextUpCard from './NextUpCard';
import { StudyCardSkeleton } from './Skeleton';

export type ReviewResult = 'again' | 'hard' | 'good' | 'easy';

const getQualityFromResult = (result: ReviewResult): number => {
  switch (result) {
    case 'again': return 0;
    case 'hard': return 2;
    case 'good': return 4;
    case 'easy': return 5;
  }
};

interface SRSStudySessionProps {
  deckId: string;
  onComplete: () => void;
  onExit: () => void;
  /** Navigate to a section from the completion screen (clears study state
   *  first in App) — powers the Next-up chaining card. */
  onNavigateNext?: (section: Section) => void;
}

const DIFFICULTY_CONFIG: Record<ReviewResult, { label: string; emoji: string; color: string; hoverColor: string }> = {
  again: { label: 'Again', emoji: '😓', color: '#EF4444', hoverColor: '#DC2626' },
  hard:  { label: 'Hard',  emoji: '😅', color: '#F97316', hoverColor: '#EA580C' },
  good:  { label: 'Good',  emoji: '😊', color: '#24476B', hoverColor: '#2563EB' },
  easy:  { label: 'Easy',  emoji: '🤩', color: '#22C55E', hoverColor: '#16A34A' },
};

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-800">
        {children}
      </div>
    </div>
  );
}

export default function SRSStudySession({ deckId, onComplete, onExit, onNavigateNext }: SRSStudySessionProps) {
  const { decks, studySession, actions } = useSRSContext();
  const deck = decks.find(d => d.id === deckId);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0, total: 0 });
  const [showIntro, setShowIntro] = useState(false);
  const currentDeckIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (deck && deckId && currentDeckIdRef.current !== deckId) {
      currentDeckIdRef.current = deckId;
      setSessionStats({ reviewed: 0, correct: 0, total: 0 });
      actions.startStudySession(deckId);
    }
  }, [deck?.id, deckId]);

  useEffect(() => {
    if (studySession.cards.length > 0) setSessionStats(p => ({ ...p, total: studySession.cards.length }));
  }, [studySession.cards.length]);

  useEffect(() => {
    if (studySession.isComplete && studySession.cards.length > 0 && sessionStats.reviewed > 0) {
      const t = setTimeout(onComplete, 2000);
      return () => clearTimeout(t);
    }
  }, [studySession.isComplete, studySession.cards.length, sessionStats.reviewed, onComplete]);

  useEffect(() => {
    try {
      const shown = localStorage.getItem(`srsIntroShown:${deckId}`);
      setShowIntro(!shown && !!deckId);
    } catch { setShowIntro(false); }
  }, [deckId]);

  const dismissIntro = () => {
    try { localStorage.setItem(`srsIntroShown:${deckId}`, '1'); } catch {}
    setShowIntro(false);
  };

  const currentCard = studySession.currentCard;
  const progress = studySession.progress;

  const handleReview = (result: ReviewResult) => {
    actions.submitReview(getQualityFromResult(result), 5);
    setSessionStats(p => ({
      reviewed: p.reviewed + 1,
      correct: p.correct + (result === 'easy' || result === 'good' ? 1 : 0),
      total: p.total,
    }));
    actions.nextCard();
    setShowAnswer(false);
  };

  // Keyboard shortcuts (desktop power flow): Space/Enter reveals, 1–4 grades,
  // Esc exits. Re-subscribes on card/answer change so the closure stays fresh.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (!currentCard || studySession.isComplete) return;
      if (e.key === 'Escape') { onExit(); return; }
      if (!showAnswer) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setShowAnswer(true); }
        return;
      }
      const gradeKeys: Record<string, ReviewResult> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' };
      if (gradeKeys[e.key]) { e.preventDefault(); handleReview(gradeKeys[e.key]); }
      else if (e.key === ' ') e.preventDefault(); // keep Space from scrolling the page
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // handleReview is recreated per render; re-subscribing on these deps keeps it current.
  }, [showAnswer, currentCard, studySession.isComplete, onExit]);

  if (!deck) {
    return (
      <CenteredCard>
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-red-500 mb-2">Deck Not Found</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">The requested study deck could not be found.</p>
        <button onClick={onExit} className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ background: 'var(--brand-gradient)' }}>Return to Dashboard</button>
      </CenteredCard>
    );
  }

  if (studySession.isComplete && studySession.cards.length > 0 && sessionStats.reviewed > 0) {
    const accuracy = Math.round((sessionStats.correct / Math.max(sessionStats.reviewed, 1)) * 100);
    return (
      <CenteredCard>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl" style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' }}>✅</div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Session Complete!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          You reviewed <strong>{sessionStats.reviewed}</strong> cards with <strong>{accuracy}%</strong> accuracy.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { value: sessionStats.reviewed, label: 'Reviewed', color: '#3F8571' },
            { value: sessionStats.correct, label: 'Correct', color: '#22C55E' },
            { value: accuracy + '%', label: 'Accuracy', color: '#E4572E' },
          ].map(({ value, label, color }) => (
            <div key={label} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div className="text-xl font-black" style={{ color }}>{value}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">{label}</div>
            </div>
          ))}
        </div>
        {/* Next-up chaining — momentum instead of re-deciding */}
        <NextUpCard onNavigate={onNavigateNext} className="mb-3" />
        <button onClick={onExit} className="w-full py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          Return to Dashboard
        </button>
      </CenteredCard>
    );
  }

  if (!currentCard) {
    return <StudyCardSkeleton onCancel={onExit} />;
  }

  const getIntervalBadge = (difficulty: ReviewResult): string => {
    if (!currentCard) {
      switch (difficulty) {
        case 'again': return 'Next: few minutes';
        case 'hard':  return 'Next: ~1–2 days';
        case 'good':  return 'Next: ~4–7 days';
        case 'easy':  return 'Next: 10+ days';
      }
    }
    const { repetitions, interval, easeFactor } = currentCard.srs;
    const quality = getQualityFromResult(difficulty);
    if (repetitions === 0) {
      return difficulty === 'easy' ? 'Next: 4 days' : 'Next: 1 day';
    }
    if (repetitions === 1) {
      switch (difficulty) {
        case 'again': return 'Next: 1 day';
        case 'hard':  return 'Next: 3 days';
        case 'good':  return 'Next: 6 days';
        case 'easy':  return 'Next: 10 days';
      }
    }
    const srs = new SpacedRepetitionSystem();
    let next: number;
    if (quality < 3) next = 1;
    else if (difficulty === 'hard') next = Math.round(interval * easeFactor * 0.8);
    else if (difficulty === 'easy') next = Math.round(interval * easeFactor * 1.3);
    else next = srs.calculateNextInterval(currentCard, quality);
    if (next <= 1) return 'Next: 1 day';
    if (next < 7) return `Next: ${next} days`;
    if (next < 30) return `Next: ${Math.round(next / 7)}w`;
    return `Next: ${Math.round(next / 30)}mo`;
  };

  const TOOLTIP: Record<ReviewResult, string> = {
    again: 'Complete blackout — reset to short interval.',
    hard:  'Remembered with difficulty — shorter interval.',
    good:  'Correct with effort — standard interval growth.',
    easy:  'Perfect recall — large interval increase.',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onExit} className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors" aria-label="Exit study session">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{deck.name}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Card {studySession.currentCardIndex + 1} of {studySession.cards.length}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 dark:text-gray-500">Progress</div>
            <div className="text-lg font-black" style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {Math.round(progress)}%
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-2.5">
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--brand-gradient-h)' }} />
          </div>
        </div>
      </div>

      {/* Card Area */}
      <div className="max-w-2xl mx-auto p-4 pt-6">
        <div key={currentCard.id} className="animate-scaleIn bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* Front */}
          <div className="p-8 text-center min-h-[280px] flex flex-col justify-center">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 badge-brand">
              {currentCard.content.type}
            </span>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
              {currentCard.content.korean}
            </h2>
            {currentCard.content.romanization && (
              <p className="text-gray-400 dark:text-gray-500 italic text-base">{currentCard.content.romanization}</p>
            )}

            {showAnswer && (
              <div className="animate-fadeIn mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="text-2xl font-bold mb-2" style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {currentCard.content.english}
                </div>
                {currentCard.content.category && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">Category: {currentCard.content.category}</span>
                )}
              </div>
            )}
          </div>

          {/* Action area */}
          <div className="p-5 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800">
            {!showAnswer ? (
              <>
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-3.5 rounded-xl font-bold text-base btn-brand"
                >
                  Reveal Answer
                </button>
                <p className="hidden sm:block text-center text-[11px] text-gray-400 dark:text-gray-500 mt-2.5">
                  Press <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-[10px]">Space</kbd> to reveal
                </p>
              </>
            ) : (
              <>
                <div className="mb-3 relative">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">How well did you remember?</p>
                  {showIntro && (
                    <div className="absolute left-0 top-full mt-2 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 z-30">
                      <div className="flex items-start gap-2">
                        <span className="text-base">💡</span>
                        <p className="text-xs text-gray-600 dark:text-gray-300 flex-1">Tap a button to rate your recall. Higher ratings = longer interval before next review.</p>
                        <button onClick={dismissIntro} className="text-xs font-bold text-[#E4572E] hover:text-[#C13F22] flex-shrink-0">Got it</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(['again', 'hard', 'good', 'easy'] as ReviewResult[]).map((r, i) => {
                    const cfg = DIFFICULTY_CONFIG[r];
                    return (
                      <Tooltip key={r} content={`${cfg.emoji} ${TOOLTIP[r]}`} position="top" maxWidth="max-w-xs">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleReview(r)}
                            className="w-full py-2.5 rounded-xl text-white text-sm font-bold transition-transform hover:scale-105 active:scale-95 shadow-sm"
                            style={{ background: cfg.color }}
                          >
                            <span className="hidden sm:inline-block text-[10px] font-black bg-white/25 rounded px-1 mr-1 align-middle">{i + 1}</span>
                            {cfg.emoji} {cfg.label}
                          </button>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{getIntervalBadge(r)}</span>
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
                <p className="hidden sm:block text-center text-[11px] text-gray-400 dark:text-gray-500 mt-3">
                  Keys <kbd className="px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-[10px]">1</kbd>–<kbd className="px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-[10px]">4</kbd> to grade · <kbd className="px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-[10px]">Esc</kbd> to exit
                </p>
              </>
            )}
          </div>
        </div>

        {/* Session Stats */}
        <div className="mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { value: sessionStats.reviewed, label: 'Reviewed', color: '#3F8571' },
              { value: sessionStats.correct, label: 'Correct', color: '#22C55E' },
              { value: sessionStats.total - sessionStats.reviewed, label: 'Remaining', color: '#E4572E' },
            ].map(({ value, label, color }) => (
              <div key={label}>
                <div className="text-xl font-black" style={{ color }}>{value}</div>
                <div className="text-[11px] text-gray-400 dark:text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
