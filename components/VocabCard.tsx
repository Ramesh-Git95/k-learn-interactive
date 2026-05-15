import React, { useState, useEffect, useRef } from 'react';
import type { VocabItem, Bookmark } from '../types';
import AddToSRS from './AddToSRS';
import PronunciationButton from './PronunciationButton';
import { useAuth } from '../contexts/AuthContext';

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

const VocabCard: React.FC<VocabCardProps> = ({ item, isBookmarked, toggleBookmark, onStudy, isStudied = false, disabled = false, showPronunciationHint = false, showFlipHint = false }) => {
  const { isAuthenticated } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showAddToSRS, setShowAddToSRS] = useState(false);
  const [showFlipBubble, setShowFlipBubble] = useState(false);
  const flipHintTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!showFlipHint || hasSeenFlipHint()) return;
    const t1 = setTimeout(() => setShowFlipBubble(true), 1500);
    const t2 = setTimeout(() => setShowFlipBubble(false), 8500);
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
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(item.korean);
      u.lang = 'ko-KR'; u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
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

  return (
    <div className="relative">
      <style>{`
        @keyframes flipHintIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flipHintTap { from { transform: scale(1); } to { transform: scale(1.3); } }
      `}</style>

      {/* One-time flip hint bubble */}
      {showFlipBubble && (
        <div className="absolute left-0 right-0 z-30 flex flex-col items-center pointer-events-none" style={{ bottom: 'calc(100% + 8px)' }}>
          <div
            className="px-3 py-1.5 rounded-xl shadow-xl text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', animation: 'flipHintIn 0.35s ease' }}
          >
            <span style={{ display: 'inline-block', animation: 'flipHintTap 0.5s ease-in-out infinite alternate' }}>👆</span>
            <span>Tap to see the meaning!</span>
          </div>
          <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '7px solid #8B5CF6' }} />
        </div>
      )}

      {/* 3D Flip Card */}
      <div
        className={`perspective w-full h-44 sm:h-48 ${disabled ? 'pointer-events-none' : ''}`}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={`Vocabulary card: ${item.korean}. Click to flip.`}
        aria-pressed={isFlipped}
        aria-disabled={disabled}
      >
        <div className={`relative w-full h-full transform-style-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className={`absolute w-full h-full backface-hidden rounded-2xl flex flex-col justify-center items-center p-3 sm:p-4 transition-all duration-300 border ${
            disabled
              ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60 border-gray-200 dark:border-gray-700'
              : isStudied
              ? 'bg-white dark:bg-gray-900 border-green-300 dark:border-green-700 cursor-pointer hover:shadow-lg'
              : showFlipBubble
              ? 'bg-white dark:bg-gray-900 border-pink-400 dark:border-pink-500 cursor-pointer hover:shadow-lg ring-2 ring-pink-300 dark:ring-pink-600'
              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 cursor-pointer hover:shadow-lg hover:border-pink-200 dark:hover:border-pink-800'
          }`}>
            {isStudied && (
              <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-[10px] font-black">✓</span>
              </div>
            )}
            <div className="absolute top-2 right-2 flex gap-1">
              <button onClick={speak} className="p-1.5 rounded-lg text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors" aria-label={`Pronounce ${item.korean}`}>
                🔊
              </button>
              <button onClick={handleBookmark} className={`p-1.5 rounded-lg transition-colors ${isBookmarked ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`} aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}>
                {isBookmarked ? '❤️' : '🤍'}
              </button>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-center leading-tight" style={{
              background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {item.korean}
            </p>
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1 text-center">{item.romanization}</p>
            <span className="absolute bottom-2 text-[10px] text-gray-300 dark:text-gray-600">
              {isStudied ? 'Studied ✓' : 'Tap to flip'}
            </span>
          </div>

          {/* Back */}
          <div
            className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl flex flex-col justify-center items-center p-3 sm:p-4 cursor-pointer shadow-lg"
            style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
          >
            <p className="text-xl sm:text-2xl font-bold text-white text-center px-2 leading-tight">{item.english}</p>
            <div className="absolute top-2 right-2">
              <button onClick={handleBookmark} className={`p-1.5 rounded-lg transition-colors ${isBookmarked ? 'text-red-300' : 'text-white/70 hover:text-red-300'}`}>
                {isBookmarked ? '❤️' : '🤍'}
              </button>
            </div>
            <span className="absolute bottom-2 text-[10px] text-white/50">Tap to flip back</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex items-center justify-center gap-1 flex-wrap">
        {examples.length > 0 && (
          <button
            onClick={e => requireAuth(e, () => setShowExamples(true))}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(139,92,246,0.1))', color: '#EC4899' }}
          >
            💡 Examples
          </button>
        )}
        <button
          onClick={e => requireAuth(e, () => setShowAddToSRS(true))}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.1))', color: '#8B5CF6' }}
        >
          ＋ SRS
        </button>
        <PronunciationButton korean={item.korean} romanization={item.romanization} size="sm" hintKey={showPronunciationHint ? 'vocab' : undefined} />
      </div>

      {/* Examples Modal */}
      {showExamples && examples.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowExamples(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                Examples ·{' '}
                <span style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {item.korean}
                </span>
              </h3>
              <button onClick={() => setShowExamples(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 text-lg transition-colors">✕</button>
            </div>

            <div className="space-y-3">
              {examples.map((ex, i) => (
                <div key={i} className="p-4 rounded-xl bg-pink-50 dark:bg-pink-900/10 border-l-4 border-l-pink-400">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-gray-900 dark:text-white flex-1 text-base">{ex.korean}</p>
                    <button onClick={e => speakExample(ex.korean, e)} className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 transition-colors">🔊</button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{ex.english}</p>
                  {ex.romanization && <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-1">🗣️ {ex.romanization}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add to SRS Modal */}
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
