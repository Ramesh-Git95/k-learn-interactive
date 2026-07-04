import React, { useState, useCallback } from 'react';
import type { Bookmark } from '../types';
import { earnXP, markStudyToday } from '../utils/xpStreak';

interface BookmarkFlashcardsProps {
  bookmarks: Bookmark[];
  onClose: () => void;
}

type CardState = 'front' | 'back';

function isVocab(b: Bookmark): b is Extract<Bookmark, { romanization: string }> {
  return 'romanization' in b;
}

export default function BookmarkFlashcards({ bookmarks, onClose }: BookmarkFlashcardsProps) {
  const [idx, setIdx]           = useState(0);
  const [cardState, setCardState] = useState<CardState>('front');
  const [knownIds, setKnownIds]  = useState<Set<string>>(new Set());
  const [unknownIds, setUnknownIds] = useState<Set<string>>(new Set());
  const [done, setDone]          = useState(false);

  const cards = bookmarks;
  const card  = cards[idx];

  const flip = () => setCardState(s => s === 'front' ? 'back' : 'front');

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
      setCardState('front');
    }
  }, [card, idx, cards.length]);

  if (cards.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">No bookmarks yet</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Bookmark vocabulary words while studying to review them here.</p>
          <button onClick={onClose} className="w-full py-3 rounded-2xl font-bold text-white text-sm" style={{ background: 'var(--brand-gradient)' }}>
            Got it
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    const total   = cards.length;
    const knew    = knownIds.size;
    const pct     = Math.round((knew / total) * 100);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}</div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Session Complete!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {knew}/{total} cards known · {pct}% accuracy
          </p>

          {/* Score ring */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#F3F4F6" strokeWidth="8" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="url(#bfg)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 213.6} 213.6`} />
              <defs>
                <linearGradient id="bfg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EC4899" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-black text-gray-900 dark:text-white">{pct}%</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
              <div className="text-2xl font-black text-green-600 dark:text-green-400">{knew}</div>
              <div className="text-xs text-green-600 dark:text-green-400 font-semibold">Got it ✓</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
              <div className="text-2xl font-black text-orange-500 dark:text-orange-400">{unknownIds.size}</div>
              <div className="text-xs text-orange-500 dark:text-orange-400 font-semibold">Still learning 🔄</div>
            </div>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">+{knew * 5} XP earned this session</p>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-bold text-white text-sm" style={{ background: 'var(--brand-gradient)' }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  const korean       = card.korean;
  const english      = card.english;
  const romanization = isVocab(card) ? card.romanization : undefined;
  const context      = !isVocab(card) ? (card as any).context : undefined;
  const progress     = ((idx) / cards.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/70 text-sm font-semibold">{idx + 1} / {cards.length}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition-colors">✕</button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/20 rounded-full mb-6 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--brand-gradient-h)' }} />
        </div>

        {/* Card */}
        <div
          onClick={flip}
          className="cursor-pointer select-none bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 text-center mb-5 min-h-[220px] flex flex-col items-center justify-center transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        >
          {cardState === 'front' ? (
            <>
              <div className="text-5xl font-black text-gray-900 dark:text-white mb-3" style={{ fontFamily: 'Noto Sans KR,sans-serif' }}>
                {korean}
              </div>
              <p className="text-gray-400 text-sm">Tap to reveal</p>
            </>
          ) : (
            <>
              <div className="text-3xl font-black text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Noto Sans KR,sans-serif' }}>
                {korean}
              </div>
              {romanization && <div className="text-gray-400 text-sm mb-2 italic">/{romanization}/</div>}
              <div className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-1">{english}</div>
              {context && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{context}</div>}
            </>
          )}
        </div>

        {/* Action buttons — only show when flipped */}
        {cardState === 'back' ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => advance(false)}
              className="py-4 rounded-2xl font-bold text-sm border-2 border-orange-200 dark:border-orange-800 text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:scale-[1.02] transition-transform"
            >
              Still learning 🔄
            </button>
            <button
              onClick={() => advance(true)}
              className="py-4 rounded-2xl font-bold text-sm text-white hover:scale-[1.02] transition-transform"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
            >
              Got it ✓ +5 XP
            </button>
          </div>
        ) : (
          <p className="text-center text-white/50 text-xs">Tap the card to see the answer</p>
        )}
      </div>
    </div>
  );
}
