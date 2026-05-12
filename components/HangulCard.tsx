import React from 'react';
import type { HangulCharacter } from '../types';

interface HangulCardProps {
  char: HangulCharacter;
  onStudy?: () => void;
  isStudied?: boolean;
}

const HangulCard: React.FC<HangulCardProps> = ({ char, onStudy, isStudied = false }) => {
  const speak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(char.char);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
    if (onStudy && !isStudied) onStudy();
  };

  return (
    <div
      onClick={speak}
      title={`${char.char} - ${char.romanization}. Click to hear pronunciation.`}
      className={`group relative flex flex-col items-center justify-center rounded-2xl cursor-pointer aspect-square transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl select-none ${
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
    </div>
  );
};

export default HangulCard;
