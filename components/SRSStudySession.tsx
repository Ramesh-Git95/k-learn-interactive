import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import type { Section } from '../types';
import { SRSCard, SpacedRepetitionSystem } from '../services/spacedRepetition';
import { useSRSContext } from '../contexts/SRSContext';
import NextUpCard from './NextUpCard';
import { StudyCardSkeleton } from './Skeleton';
import { accentFor } from '../utils/moduleAccent';

export type ReviewResult = 'again' | 'hard' | 'good' | 'easy';

const ACC = accentFor('srs');

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

// The four grades take the module palette rather than traffic-light colours, so
// they read as degrees of the same thing instead of pass/fail.
const DIFFICULTY_CONFIG: Record<ReviewResult, { label: string; color: string; hint: string }> = {
  again: { label: 'Again',  color: '#C13F22', hint: 'It did not come back — start this one over.' },
  hard:  { label: 'Hard',   color: '#A8761F', hint: 'You got there, but it took work.' },
  good:  { label: 'Good',   color: '#2F5D8A', hint: 'Remembered with a little effort.' },
  easy:  { label: 'Easy',   color: '#2E6B59', hint: 'Instant — push it further out.' },
};

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0EADC] p-4 dark:bg-gray-950">
      <div className="kl-card w-full max-w-md p-8 text-center">{children}</div>
    </div>
  );
}

export default function SRSStudySession({ deckId, onComplete, onExit, onNavigateNext }: SRSStudySessionProps) {
  const { decks, studySession, actions } = useSRSContext();
  const deck = decks.find(d => d.id === deckId);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0, total: 0, skipped: 0 });
  const [showIntro, setShowIntro] = useState(false);
  const currentDeckIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (deck && deckId && currentDeckIdRef.current !== deckId) {
      currentDeckIdRef.current = deckId;
      setSessionStats({ reviewed: 0, correct: 0, total: 0, skipped: 0 });
      actions.startStudySession(deckId);
    }
  }, [deck?.id, deckId]);

  useEffect(() => {
    if (studySession.cards.length > 0) setSessionStats(p => ({ ...p, total: studySession.cards.length }));
  }, [studySession.cards.length]);

  // Skipping advances without a review, so a session where everything was
  // skipped still has to be able to finish.
  const touched = sessionStats.reviewed + sessionStats.skipped;

  useEffect(() => {
    if (studySession.isComplete && studySession.cards.length > 0 && touched > 0) {
      const t = setTimeout(onComplete, 2000);
      return () => clearTimeout(t);
    }
  }, [studySession.isComplete, studySession.cards.length, touched, onComplete]);

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
      ...p,
      reviewed: p.reviewed + 1,
      correct: p.correct + (result === 'easy' || result === 'good' ? 1 : 0),
    }));
    actions.nextCard();
    setShowAnswer(false);
  };

  // Move past a card without grading it. Nothing is written, so it stays due and
  // comes back — the honest meaning of "not right now".
  const handleSkip = () => {
    setSessionStats(p => ({ ...p, skipped: p.skipped + 1 }));
    actions.nextCard();
    setShowAnswer(false);
  };

  const say = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  };

  // Keyboard shortcuts (desktop power flow): Space/Enter reveals, 1–4 grades,
  // S skips, Esc exits. Re-subscribes on card/answer change so the closure stays fresh.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (!currentCard || studySession.isComplete) return;
      if (e.key === 'Escape') { onExit(); return; }
      if (!showAnswer) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setShowAnswer(true); }
        else if (e.key.toLowerCase() === 's') { e.preventDefault(); handleSkip(); }
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

  // How many cards fall due on each of the next seven days, across every deck.
  // Real scheduling data — the point is to show that today's queue is finite and
  // the days after it are already known.
  const weekAhead = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    const start = new Date(); start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const from = new Date(start); from.setDate(from.getDate() + i);
      const to = new Date(from); to.setDate(to.getDate() + 1);
      let count = 0;
      decks.forEach(d => d.cards.forEach(c => {
        const due = new Date(c.srs.nextReviewDate);
        // Anything overdue counts against today.
        if (i === 0 ? due < to : due >= from && due < to) count++;
      }));
      days.push({ label: from.toLocaleDateString('en', { weekday: 'narrow' }), count });
    }
    return days;
  }, [decks]);

  if (!deck) {
    return (
      <CenteredCard>
        <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
          That deck is not here
        </h2>
        <p className="mt-2.5 text-[14px] text-[#3E4A5A] dark:text-gray-400">
          It may have been deleted or renamed.
        </p>
        <button
          onClick={onExit}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-[10px] text-[15px] font-semibold text-white"
          style={{ background: ACC.light }}
        >
          Back to the dashboard
        </button>
      </CenteredCard>
    );
  }

  if (studySession.isComplete && studySession.cards.length > 0 && touched > 0) {
    const accuracy = Math.round((sessionStats.correct / Math.max(sessionStats.reviewed, 1)) * 100);
    return (
      <CenteredCard>
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D` }}
        >
          <Check className="h-6 w-6" style={{ color: ACC.light }} />
        </div>
        <h2 className="mt-4 font-display text-[24px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
          Queue cleared
        </h2>
        <p className="mt-2 text-[14px] text-[#3E4A5A] dark:text-gray-400">
          {sessionStats.reviewed} reviewed at {accuracy}% recall
          {sessionStats.skipped > 0 && ` · ${sessionStats.skipped} skipped, still due`}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {[
            { value: sessionStats.reviewed, label: 'reviewed' },
            { value: sessionStats.correct, label: 'recalled' },
            { value: `${accuracy}%`, label: 'accuracy' },
          ].map(({ value, label }) => (
            <div key={label} className="kl-well rounded-xl px-3 py-2.5">
              <div className="text-[19px] font-bold leading-none text-[#16202F] dark:text-white">{value}</div>
              <div className="mt-1.5 text-[12px] text-[#4A5566] dark:text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Next-up chaining — momentum instead of re-deciding */}
        <div className="mt-5 text-left">
          <NextUpCard onNavigate={onNavigateNext} />
        </div>
        <button
          onClick={onExit}
          className="mt-3 w-full text-[13.5px] font-semibold text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200"
        >
          Back to the dashboard
        </button>
      </CenteredCard>
    );
  }

  if (!currentCard) {
    return <StudyCardSkeleton onCancel={onExit} />;
  }

  const getIntervalBadge = (difficulty: ReviewResult): string => {
    const { repetitions, interval, easeFactor } = currentCard.srs;
    const quality = getQualityFromResult(difficulty);
    if (repetitions === 0) {
      return difficulty === 'easy' ? '4 days' : '1 day';
    }
    if (repetitions === 1) {
      switch (difficulty) {
        case 'again': return '1 day';
        case 'hard':  return '3 days';
        case 'good':  return '6 days';
        case 'easy':  return '10 days';
      }
    }
    const srs = new SpacedRepetitionSystem();
    let next: number;
    if (quality < 3) next = 1;
    else if (difficulty === 'hard') next = Math.round(interval * easeFactor * 0.8);
    else if (difficulty === 'easy') next = Math.round(interval * easeFactor * 1.3);
    else next = srs.calculateNextInterval(currentCard, quality);
    if (next <= 1) return '1 day';
    if (next < 7) return `${next} days`;
    if (next < 30) return `${Math.round(next / 7)} weeks`;
    return `${Math.round(next / 30)} months`;
  };

  // "You last saw this N days ago" — from the card's own history, not invented.
  const lastSeen = (card: SRSCard): string => {
    if (!card.srs.lastReviewDate || card.srs.totalReviews === 0) return 'FIRST TIME SEEING THIS';
    const days = Math.round((Date.now() - new Date(card.srs.lastReviewDate).getTime()) / 86_400_000);
    if (days <= 0) return 'YOU SAW THIS EARLIER TODAY';
    if (days === 1) return 'YOU LAST SAW THIS YESTERDAY';
    return `YOU LAST SAW THIS ${days} DAYS AGO`;
  };

  const remaining = Math.max(0, sessionStats.total - studySession.currentCardIndex);
  const minsLeft = Math.max(1, Math.round(remaining * 10 / 60));
  const railCard = 'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';
  const maxDue = Math.max(1, ...weekAhead.map(d => d.count));

  return (
    <div className="min-h-screen bg-[#F0EADC] dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* ── Header ── */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
          <div className="min-w-0">
            <div className="mb-1.5 text-[12.5px] font-semibold text-[#4A5566] dark:text-gray-500">
              {deck.name}
            </div>
            <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
              {sessionStats.total} {sessionStats.total === 1 ? 'card' : 'cards'} due today
            </h1>
          </div>
          <div className="flex flex-none items-center gap-3.5">
            <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">
              about {minsLeft} min left
            </span>
            <button
              onClick={onExit}
              className="flex h-12 items-center gap-2 rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
            >
              <X className="h-4 w-4" />
              Save and exit
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start gap-5 lg:flex-row">
          {/* ── The card ── */}
          <div className="order-1 w-full min-w-0 flex-1">
            <div
              className="mb-4 flex items-start gap-3 rounded-r-lg border-l-[3px] px-4 py-3 sm:items-center"
              style={{ borderColor: ACC.light, background: `${ACC.light}14` }}
            >
              <span className="kl-accent flex-none whitespace-nowrap text-[12.5px] font-semibold"
                    style={{ ['--kl-acc' as string]: ACC.light, ['--kl-acc-dk' as string]: ACC.dark }}>
                DO THIS NEXT
              </span>
              <span className="text-[13.5px] leading-snug text-[#16202F] dark:text-gray-200">
                Say the meaning out loud before you reveal — recalling it is what moves the card forward.
              </span>
            </div>

            <div key={currentCard.id} className="kl-card animate-scaleIn p-7 text-center sm:p-10">
              <div className="text-[12.5px] font-semibold" style={{ color: ACC.light }}>
                {lastSeen(currentCard)}
              </div>

              <div className="mt-5 break-words font-korean text-[52px] font-bold leading-none text-[#16202F] sm:text-[68px] dark:text-white">
                {currentCard.content.korean}
              </div>
              {currentCard.content.romanization && (
                <div className="mt-3 text-[15px] text-[#4A5566] dark:text-gray-400">
                  {currentCard.content.romanization}
                </div>
              )}

              <button
                onClick={() => say(currentCard.content.korean)}
                className="mt-5 inline-flex h-11 items-center gap-2.5 rounded-[9px] border-[1.5px] px-5 text-[14.5px] font-semibold transition-colors"
                style={{ borderColor: `${ACC.light}80`, color: ACC.light }}
              >
                <span className="flex h-3.5 items-end gap-[2.5px]" aria-hidden="true">
                  <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light }} />
                  <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.15s' }} />
                  <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.3s' }} />
                </span>
                Hear it
              </button>

              {showAnswer && (
                <div className="animate-fadeIn mt-7 border-t border-[rgba(20,32,47,0.12)] pt-7 dark:border-gray-800">
                  <div className="font-display text-[26px] font-semibold tracking-[-0.02em] text-[#16202F] sm:text-[30px] dark:text-white">
                    {currentCard.content.english}
                  </div>
                  {currentCard.content.category && (
                    <div className="mt-2 text-[12.5px] text-[#4A5566] dark:text-gray-500">
                      {currentCard.content.category}
                    </div>
                  )}
                </div>
              )}

              {!showAnswer ? (
                <div className="mt-7 border-t border-[rgba(20,32,47,0.12)] pt-6 dark:border-gray-800">
                  <p className="text-[15px] text-[#4A5566] dark:text-gray-400">
                    Reveal when you have an answer in mind.
                  </p>
                  <div className="mx-auto mt-4 flex max-w-[520px] gap-3">
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="flex h-12 flex-1 items-center justify-center rounded-[10px] text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
                      style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
                    >
                      Show me the answer
                    </button>
                    <button
                      onClick={handleSkip}
                      className="flex h-12 flex-none items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
                      title="Leave it due and come back to it"
                    >
                      Skip
                    </button>
                  </div>
                  <p className="mt-3 hidden text-[12.5px] text-[#4A5566] sm:block dark:text-gray-500">
                    Space to reveal · S to skip · Esc to leave
                  </p>
                </div>
              ) : (
                <div className="mt-7 border-t border-[rgba(20,32,47,0.12)] pt-6 dark:border-gray-800">
                  <p className="text-[14px] font-semibold text-[#16202F] dark:text-white">
                    How well did it come back?
                  </p>
                  {showIntro && (
                    <div className="kl-well mx-auto mt-3 flex max-w-[520px] items-start gap-2.5 rounded-xl p-3 text-left">
                      <p className="flex-1 text-[12.5px] leading-relaxed text-[#3E4A5A] dark:text-gray-300">
                        Answer honestly — the interval under each button is when you will see this card
                        again. Guessing "Easy" only means meeting it again too late.
                      </p>
                      <button
                        onClick={dismissIntro}
                        className="flex-none text-[12.5px] font-semibold"
                        style={{ color: ACC.light }}
                      >
                        Got it
                      </button>
                    </div>
                  )}

                  <div className="mx-auto mt-4 grid max-w-[560px] grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {(['again', 'hard', 'good', 'easy'] as ReviewResult[]).map((r, i) => {
                      const cfg = DIFFICULTY_CONFIG[r];
                      return (
                        <button
                          key={r}
                          onClick={() => handleReview(r)}
                          title={cfg.hint}
                          className="flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] px-2 py-3 transition-transform hover:-translate-y-0.5"
                          style={{ borderColor: `${cfg.color}66`, background: `${cfg.color}0F` }}
                        >
                          <span className="text-[15px] font-semibold" style={{ color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <span className="text-[12px] text-[#4A5566] dark:text-gray-400">
                            {getIntervalBadge(r)}
                          </span>
                          <span className="text-[10.5px] text-[#4A5566]/70 dark:text-gray-500">{i + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Rail ── */}
          <div className="order-2 w-full flex-none lg:w-[290px]">
            <div className={`${railCard} mb-3.5`}>
              <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Today</div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
                <div className="h-full rounded-full transition-all duration-500"
                     style={{ width: `${progress}%`, background: ACC.light }} />
              </div>
              <p className="text-[13.5px] text-[#4A5566] dark:text-gray-400">
                {sessionStats.reviewed} of {sessionStats.total} done · about {minsLeft} minutes left
              </p>
            </div>

            <div className={`${railCard} mb-3.5`}>
              <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">The week ahead</div>
              <div className="mb-2.5 flex h-[80px] items-end gap-2">
                {weekAhead.map((d, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${Math.max(4, (d.count / maxDue) * 100)}%`,
                      background: i === 0 ? ACC.light : `${ACC.light}59`,
                    }}
                    title={`${d.count} due`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[12.5px] text-[#4A5566] dark:text-gray-500">
                <span>today {weekAhead[0]?.count ?? 0}</span>
                <span>{weekAhead.reduce((a, d) => a + d.count, 0)} in 7 days</span>
              </div>
            </div>

            <div className={railCard}>
              <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">How this works</div>
              <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
                Cards you know come back later; cards you miss come back sooner. There is no way to
                fall behind — the queue only ever shows what is due.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
