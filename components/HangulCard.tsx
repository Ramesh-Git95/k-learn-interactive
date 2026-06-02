import React, { useState, useEffect } from 'react';
import type { HangulCharacter } from '../types';

const HANGUL_HINT_KEY = 'k-learn-hangul-seen';
const hasSeenHangulHint = () => { try { return !!localStorage.getItem(HANGUL_HINT_KEY); } catch { return false; } };
const dismissHangulHint = () => {
  try { localStorage.setItem(HANGUL_HINT_KEY, '1'); } catch {}
  window.dispatchEvent(new Event('klearn-hangul-seen'));
};

interface HangulCardProps {
  char: HangulCharacter;
  onStudy?: () => void;
  isStudied?: boolean;
  showHint?: boolean;
}

const HangulCard: React.FC<HangulCardProps> = ({ char, onStudy, isStudied = false, showHint = false }) => {
  const [showHintBubble, setShowHintBubble] = useState(false);

  useEffect(() => {
    if (!showHint || hasSeenHangulHint()) return;
    const t1 = setTimeout(() => setShowHintBubble(true), 5000);
    const t2 = setTimeout(() => setShowHintBubble(false), 13000);
    const onDismiss = () => setShowHintBubble(false);
    window.addEventListener('klearn-hangul-seen', onDismiss);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener('klearn-hangul-seen', onDismiss);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const speak = () => {
    if (!hasSeenHangulHint()) dismissHangulHint();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(char.char);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
    if (onStudy && !isStudied) onStudy();
  };

  const typeLabel = char.type === 'consonant' ? 'consonant' : 'vowel';
  const ariaLabel = `${char.char}, ${typeLabel}, romanized as ${char.romanization}.${isStudied ? ' Studied.' : ''} Press to hear pronunciation.`;

  return (
    <div className="relative">
    {showHintBubble && (
      <div className="absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none" style={{ bottom: 'calc(100% + 6px)' }}>
        <div
          className="px-2.5 py-1 rounded-lg shadow-xl text-white text-[11px] font-bold flex items-center gap-1 whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', animation: 'flipHintIn 0.35s ease' }}
        >
          <span>🔊</span>
          <span>Tap to hear!</span>
        </div>
        <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '6px solid #8B5CF6' }} />
      </div>
    )}
    <button
      type="button"
      onClick={speak}
      title={`${char.char} - ${char.romanization}. Click to hear pronunciation.`}
      aria-label={ariaLabel}
      aria-pressed={isStudied}
      className={`group relative flex flex-col items-center justify-center w-full rounded-2xl cursor-pointer aspect-square transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 ${
        isStudied
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 shadow-md'
          : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-pink-200 dark:hover:border-pink-800'
      }`}
    >
      {/* Studied checkmark */}
      {isStudied && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-white text-[10px] font-black">✓</span>
        </div>
      )}

      {/* Korean character */}
      <span
        className="text-4xl md:text-5xl font-black leading-none"
        style={{
          background: isStudied
            ? 'linear-gradient(135deg, #22C55E, #059669)'
            : 'linear-gradient(135deg, #EC4899, #8B5CF6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {char.char}
      </span>

      {/* Romanization — always visible when studied, hover otherwise */}
      <span
        className={`mt-1.5 text-sm font-semibold transition-opacity duration-200 ${
          isStudied
            ? 'text-green-600 dark:text-green-400 opacity-100'
            : 'text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100'
        }`}
      >
        {char.romanization}
      </span>

      {/* Hint */}
      {!isStudied && (
        <span className="absolute bottom-1.5 text-[10px] text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          🔊 tap
        </span>
      )}
    </button>
    </div>
  );
};

export default HangulCard;
