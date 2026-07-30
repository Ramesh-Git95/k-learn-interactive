import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, Heart, Lightbulb, Plus, AudioLines } from 'lucide-react';
import type { VocabItem, Bookmark } from '../types';
import AddToSRS from './AddToSRS';
import PronunciationButton from './PronunciationButton';
import SoundItOutModal from './SoundItOutModal';
import { useAuth } from '../contexts/AuthContext';
import { accentFor } from '../utils/moduleAccent';

// A vocabulary card, in the clarity language.
//
// The flip is kept — it is the heart of the card and how a word gets marked as
// studied. What changed is the surface (warm hanji paper, pine accent on the
// answer face instead of a brand gradient) and the actions: every one of them is
// now a printed, labelled control rather than a coloured pill, so what the card
// can do is readable before you touch it.

const ACC = accentFor('vocabulary');

const FLIP_HINT_KEY = 'k-learn-flip-seen';
const hasSeenFlipHint = () => { try { return !!localStorage.getItem(FLIP_HINT_KEY); } catch { return false; } };
const dismissFlipHint = () => {
  try { localStorage.setItem(FLIP_HINT_KEY, '1'); } catch {}
  window.dispatchEvent(new Event('klearn-flip-seen'));
};

interface VocabCardProps {
  item: VocabItem;
  isBookmarked: boolean;
  toggleBookmark: (item: Bookmark) => void;
  onStudy?: () => boolean | void;
  isStudied?: boolean;
  disabled?: boolean;
  showPronunciationHint?: boolean;
  showFlipHint?: boolean;
}

const VocabCard: React.FC<VocabCardProps> = ({
  item, isBookmarked, toggleBookmark, onStudy, isStudied = false,
  disabled = false, showPronunciationHint = false, showFlipHint = false,
}) => {
  const { isAuthenticated } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showAddToSRS, setShowAddToSRS] = useState(false);
  const [showSoundItOut, setShowSoundItOut] = useState(false);
  const [showFlipBubble, setShowFlipBubble] = useState(false);
  const flipHintTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!showFlipHint || hasSeenFlipHint()) return;
    const t1 = setTimeout(() => setShowFlipBubble(true), 5000);
    const t2 = setTimeout(() => setShowFlipBubble(false), 13000);
    flipHintTimers.current = [t1, t2];
    const onDismiss = () => setShowFlipBubble(false);
    window.addEventListener('klearn-flip-seen', onDismiss);
    return () => {
      flipHintTimers.current.forEach(clearTimeout);
      window.removeEventListener('klearn-flip-seen', onDismiss);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const requireAuth = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
      return;
    }
    action();
  };

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Open the "Sound it out" teaching view (syllable blocks + karaoke) rather
    // than blasting the whole word at a distorted slow rate.
    setShowSoundItOut(true);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const speakExample = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR'; u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(item);
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const handleFlip = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault(); e.stopPropagation();
    dismissFlipHint();
    if (!isFlipped && onStudy && !isStudied) {
      const result = onStudy();
      if (result === false) return;
    }
    setIsFlipped(p => !p);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFlip({ preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent);
    }
  };

  const examples = item.examples ?? [];

  // Small printed action, shared by the row under the card.
  const action = (
    key: string, onClick: (e: React.MouseEvent) => void,
    icon: React.ReactNode, label: string, title: string, locked = false,
  ) => (
    <button
      key={key}
      onClick={onClick}
      title={title}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[rgba(20,32,47,0.14)] px-2.5 text-[12px] font-medium leading-none text-[#4A5566] transition-colors hover:border-[rgba(20,32,47,0.3)] hover:text-[#16202F] dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
    >
      {icon}
      {locked ? `${label} · sign in` : label}
    </button>
  );

  return (
    <div className="relative">
      {/* One-time flip hint bubble */}
      {showFlipBubble && (
        <div className="absolute left-1/2 z-30 flex flex-col items-center pointer-events-none" style={{ bottom: 'calc(100% + 8px)', transform: 'translateX(-50%)', maxWidth: 'min(220px, 90vw)' }}>
          <div
            className="flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
            style={{ background: ACC.light, animation: 'flipHintIn 0.35s ease' }}
          >
            <span style={{ display: 'inline-block', animation: 'flipHintTap 0.5s ease-in-out infinite alternate' }}>👇</span>
            Tap to see the meaning
          </div>
          <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `7px solid ${ACC.light}` }} />
        </div>
      )}

      {/* 3D flip card */}
      <div
        className={`perspective h-44 w-full sm:h-48 ${disabled ? 'pointer-events-none' : ''}`}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={`Vocabulary card: ${item.korean}. Click to flip.`}
        aria-pressed={isFlipped}
        aria-disabled={disabled}
      >
        <div className={`transform-style-3d relative h-full w-full transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front — the Korean */}
          <div
            className={`backface-hidden absolute flex h-full w-full flex-col items-center justify-center rounded-2xl border p-4 transition-shadow duration-300 ${
              disabled
                ? 'cursor-not-allowed border-[rgba(20,32,47,0.10)] bg-[rgba(20,32,47,0.03)] opacity-60 dark:border-gray-800 dark:bg-gray-900'
                : 'cursor-pointer bg-[#FFFCF4] hover:shadow-[0_12px_34px_rgba(20,32,47,0.09)] dark:bg-gray-900'
            }`}
            style={!disabled ? {
              borderColor: isStudied ? `${ACC.light}66` : 'rgba(20,32,47,0.14)',
              boxShadow: showFlipBubble ? `0 0 0 2px ${ACC.light}55` : undefined,
            } : undefined}
          >
            {isStudied && (
              <span
                className="absolute left-3 top-3 text-[11.5px] font-semibold"
                style={{ color: ACC.light }}
              >
                ✓ studied
              </span>
            )}

            <div className="absolute right-2.5 top-2.5 flex gap-0.5">
              <button
                onClick={speak}
                className="rounded-lg p-1.5 text-[#4A5566] transition-colors hover:text-[#2E6B59] dark:text-gray-500 dark:hover:text-[#5FB89B]"
                title="Sound it out — syllable by syllable"
                aria-label={`Sound out ${item.korean} syllable by syllable`}
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleBookmark}
                className="rounded-lg p-1.5 transition-colors"
                style={{ color: isBookmarked ? '#C13F22' : undefined }}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                title={isBookmarked ? 'Saved — tap to remove' : 'Save this word'}
              >
                <Heart className={`h-4 w-4 ${isBookmarked ? '' : 'text-[#4A5566] dark:text-gray-500'}`} fill={isBookmarked ? '#C13F22' : 'none'} />
              </button>
            </div>

            <p className="break-words px-2 text-center font-korean text-[30px] font-bold leading-tight text-[#16202F] sm:text-[34px] dark:text-white">
              {item.korean}
            </p>
            <p className="mt-2 text-center text-[13px] text-[#4A5566] dark:text-gray-500">{item.romanization}</p>
            <span className="absolute bottom-3 text-[11.5px] text-[#4A5566] dark:text-gray-600">
              {isStudied ? 'tap to flip' : 'tap to see the meaning'}
            </span>
          </div>

          {/* Back — the meaning */}
          <div
            className="backface-hidden rotate-y-180 absolute flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-2xl p-4"
            style={{ background: ACC.light }}
          >
            <p className="break-words px-2 text-center text-[20px] font-semibold leading-tight text-white sm:text-[22px]">
              {item.english}
            </p>
            <button
              onClick={handleBookmark}
              className="absolute right-2.5 top-2.5 rounded-lg p-1.5 text-white/75 transition-colors hover:text-white"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <Heart className="h-4 w-4" fill={isBookmarked ? '#fff' : 'none'} />
            </button>
            <span className="absolute bottom-3 text-[11.5px] text-white/70">tap to flip back</span>
          </div>
        </div>
      </div>

      {/* Actions — printed, not hidden behind hover */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {examples.length > 0 && action(
          'ex',
          e => requireAuth(e, () => setShowExamples(true)),
          <Lightbulb className="h-3.5 w-3.5" />,
          'Examples',
          isAuthenticated ? 'See example sentences' : 'Sign in to see examples',
          !isAuthenticated,
        )}
        {action(
          'srs',
          e => requireAuth(e, () => setShowAddToSRS(true)),
          <Plus className="h-3.5 w-3.5" />,
          'Add to deck',
          isAuthenticated ? 'Add this word to a spaced repetition deck' : 'Sign in to add to a deck',
          !isAuthenticated,
        )}
        <PronunciationButton
          korean={item.korean}
          romanization={item.romanization}
          size="sm"
          hintKey={showPronunciationHint ? 'vocab' : undefined}
        />
      </div>

      {/* Examples modal */}
      {showExamples && examples.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowExamples(false)}>
          <div className="kl-card max-h-[80vh] w-full max-w-lg overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-display text-[17px] font-semibold text-[#16202F] dark:text-white">
                <span className="font-korean">{item.korean}</span> in a sentence
              </h3>
              <button
                onClick={() => setShowExamples(false)}
                aria-label="Close examples"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[#4A5566] transition-colors hover:bg-[rgba(20,32,47,0.06)] dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {examples.map((ex, i) => (
                <div key={i} className="kl-well rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex-1 font-korean text-[17px] font-semibold text-[#16202F] dark:text-white">{ex.korean}</p>
                    <button
                      onClick={e => speakExample(ex.korean, e)}
                      aria-label="Pronounce example"
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[#4A5566] transition-colors hover:text-[#2E6B59] dark:hover:text-[#5FB89B]"
                    >
                      <AudioLines className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[13.5px] text-[#3E4A5A] dark:text-gray-300">{ex.english}</p>
                  {ex.romanization && (
                    <p className="mt-1 text-[12.5px] text-[#4A5566] dark:text-gray-500">{ex.romanization}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sound-it-out (syllable player) modal */}
      {showSoundItOut && (
        <SoundItOutModal
          korean={item.korean}
          english={item.english}
          romanization={item.romanization}
          onClose={() => setShowSoundItOut(false)}
        />
      )}

      {/* Add to SRS modal */}
      {showAddToSRS && (
        <AddToSRS
          content={{ korean: item.korean, english: item.english, romanization: item.romanization, type: 'vocabulary', category: item.category }}
          onClose={() => setShowAddToSRS(false)}
          onSuccess={() => setShowAddToSRS(false)}
        />
      )}
    </div>
  );
};

export default VocabCard;
