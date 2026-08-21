import React, { useState, useCallback } from 'react';
import { X, Volume2 } from 'lucide-react';
import type { Bookmark } from '../types';
import { earnXP, markStudyToday } from '../utils/xpStreak';

// A run through your saved words.
//
// Adopted from the owner's design: one card, an explicit reveal, and the deck
// position where the tap-to-flip guessing used to be. Its brief is that this is
// NOT spaced repetition, and saying so plainly matters — two study surfaces that
// look alike and behave differently is how people end up trusting neither.
//
// Where the design and the build disagree, the build wins: it says nothing here
// is scored, but this awards XP and tracks what you knew, and dropping that
// would be removing something that works. What is true is that nothing is
// SCHEDULED — no intervals, no due dates — so that is what the note says.
//
// Not built: its "saved from a song · 3 weeks ago" line. A bookmark records no
// source and no timestamp, so both halves would be invented.

interface BookmarkFlashcardsProps {
  bookmarks: Bookmark[];
  onClose: () => void;
}

/** PhraseItem carries `context`; VocabItem does not. Both have `romanization`,
 *  which is what the old check tested — so it was true for everything and the
 *  context line never once rendered. */
const isPhrase = (b: Bookmark): b is Extract<Bookmark, { context: string }> =>
  'context' in b && typeof (b as { context?: unknown }).context === 'string';

const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // required before every speak() in this app
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 0.8;
  window.speechSynthesis.speak(u);
};

const SHELL = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm px-4';

export default function BookmarkFlashcards({ bookmarks, onClose }: BookmarkFlashcardsProps) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [unknownIds, setUnknownIds] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);

  const cards = bookmarks;
  const card = cards[idx];

  const advance = useCallback((knew: boolean) => {
    const id = card.korean;
    if (knew) {
      setKnownIds(s => new Set(s).add(id));
      earnXP(5);
      markStudyToday();
    } else {
      setUnknownIds(s => new Set(s).add(id));
    }

    const next = idx + 1;
    if (next >= cards.length) {
      setDone(true);
    } else {
      setIdx(next);
      setRevealed(false);
    }
  }, [card, idx, cards.length]);

  // Going back is for the card you answered too quickly. It does not unpick the
  // grade already given — the run is not scored against you, so re-seeing a card
  // costs nothing.
  const goBack = () => {
    if (idx === 0) return;
    setIdx(idx - 1);
    setRevealed(false);
  };

  if (cards.length === 0) {
    return (
      <div className={SHELL}>
        <div className="kl-card w-full max-w-sm rounded-[20px] px-7 py-8 text-center shadow-2xl">
          <h2 className="font-display text-[21px] font-semibold text-[#16202F] dark:text-white">
            Nothing saved yet
          </h2>
          <p className="mt-2 text-[13.5px] leading-[1.6] text-[#4A5566] dark:text-gray-400">
            The heart on any word or phrase saves it, and everything you save turns up here as a card.
          </p>
          <button
            onClick={onClose}
            className="mt-5 flex h-11 w-full items-center justify-center rounded-[10px] text-[14px] font-bold text-white"
            style={{ background: '#C13F22' }}
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    const total = cards.length;
    const knew = knownIds.size;

    return (
      <div className={SHELL}>
        <div className="kl-card w-full max-w-sm rounded-[20px] px-7 py-7 shadow-2xl">
          <h2 className="font-display text-[22px] font-semibold text-[#16202F] dark:text-white">
            That is the deck
          </h2>
          <p className="mt-1.5 text-[13.5px] text-[#4A5566] dark:text-gray-400">
            {knew} of {total} came back to you.
          </p>

          <div className="mt-5 flex gap-3">
            <div className="flex-1 rounded-xl px-4 py-3" style={{ background: 'rgba(46,107,89,0.10)' }}>
              <div className="font-display text-[26px] font-semibold" style={{ color: '#2E6B59' }}>{knew}</div>
              <div className="text-[12px] font-medium" style={{ color: '#2E6B59' }}>knew it</div>
            </div>
            <div className="flex-1 rounded-xl px-4 py-3" style={{ background: 'rgba(168,118,31,0.12)' }}>
              <div className="font-display text-[26px] font-semibold" style={{ color: '#A8761F' }}>{unknownIds.size}</div>
              <div className="text-[12px] font-medium" style={{ color: '#A8761F' }}>still learning</div>
            </div>
          </div>

          <p className="mt-4 text-[12.5px] leading-[1.55] text-[#4A5566] dark:text-gray-400">
            {knew > 0 ? `+${knew * 5} XP. ` : ''}
            Nothing here is scheduled, so the ones you missed will not come back on their own — put
            them in spaced repetition if you want them to.
          </p>

          <button
            onClick={onClose}
            className="mt-5 flex h-11 w-full items-center justify-center rounded-[10px] text-[14px] font-bold text-white"
            style={{ background: '#C13F22' }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const romanization = card.romanization;
  const context = isPhrase(card) ? card.context : undefined;

  return (
    <div className={SHELL}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-white">
              Flashcards · card {idx + 1} of {cards.length}
            </div>
            <div className="text-[12px] text-white/55">Saved words only · nothing is scheduled</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close flashcards"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Deck position. Plain spans, not buttons — a run of small buttons would
            be forced to 44px each below 640px by the global touch rule, and a
            long deck would wrap into a block. Capped, because an unlimited
            bookmark list can be hundreds long. */}
        {cards.length <= 20 ? (
          <div className="mb-4 flex flex-wrap items-center gap-1.5" aria-hidden>
            {cards.map((c, i) => (
              <span
                key={c.korean + i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === idx ? 20 : 7,
                  background: i === idx ? '#fff' : i < idx ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.2)',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${(idx / cards.length) * 100}%` }}
            />
          </div>
        )}

        {/* Card */}
        <div className="kl-card flex min-h-[236px] flex-col items-center justify-center rounded-[20px] px-6 py-8 text-center shadow-2xl">
          <div
            className="text-[44px] font-black leading-none text-[#16202F] dark:text-white"
            style={{ fontFamily: 'Pretendard Variable, sans-serif' }}
          >
            {card.korean}
          </div>
          <div className="mt-2 text-[14px] text-[#4A5566] dark:text-gray-400">{romanization}</div>

          <button
            onClick={() => speak(card.korean)}
            className="mt-3 flex h-9 items-center gap-2 rounded-[9px] border border-[rgba(20,32,47,0.2)] px-3.5 text-[12.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-white/25 dark:text-gray-100"
          >
            <Volume2 className="h-3.5 w-3.5" /> Hear it
          </button>

          {revealed ? (
            <div className="mt-5 w-full border-t border-[rgba(20,32,47,0.12)] pt-4 dark:border-gray-800">
              <div className="text-[19px] font-bold text-[#16202F] dark:text-white">{card.english}</div>
              {context && (
                <div className="mt-1 text-[12.5px] text-[#4A5566] dark:text-gray-400">{context}</div>
              )}
            </div>
          ) : (
            <>
              <p className="mt-5 text-[12.5px] text-[#4A5566] dark:text-gray-400">
                Say the meaning out loud, then reveal.
              </p>
              <button
                onClick={() => setRevealed(true)}
                className="mt-3 flex h-11 items-center rounded-[10px] px-5 text-[14px] font-bold text-white transition-transform hover:scale-[1.02]"
                style={{ background: '#C13F22' }}
              >
                Show the meaning
              </button>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="mt-4">
          {revealed ? (
            <div className="flex gap-3">
              <button
                onClick={() => advance(false)}
                className="h-12 flex-1 rounded-[11px] border-[1.5px] text-[13.5px] font-bold transition-transform hover:scale-[1.01]"
                style={{ borderColor: 'rgba(168,118,31,0.55)', color: '#E2B45C', background: 'rgba(168,118,31,0.12)' }}
              >
                Still learning
              </button>
              <button
                onClick={() => advance(true)}
                className="h-12 flex-1 rounded-[11px] text-[13.5px] font-bold text-white transition-transform hover:scale-[1.01]"
                style={{ background: '#2E6B59' }}
              >
                I knew it · +5 XP
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={goBack}
                disabled={idx === 0}
                className="flex h-10 items-center px-2 text-[13px] font-semibold text-white/70 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-white/70"
              >
                ← Previous
              </button>
              <span className="text-[12px] text-white/45">
                {knownIds.size} known · {unknownIds.size} to revisit
              </span>
            </div>
          )}
        </div>

        {/* The distinction that keeps the two study surfaces apart. */}
        <p className="mt-4 text-center text-[11.5px] leading-[1.55] text-white/45">
          This is not spaced repetition — a free run through what you saved, in the order you saved
          it. Nothing here is scheduled.
        </p>
      </div>
    </div>
  );
}
