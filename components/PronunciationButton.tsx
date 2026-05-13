import React from 'react';
import { useSpeechRecognition, hasAttemptsRemaining, attemptsLeft } from '../hooks/useSpeechRecognition';
import { useAuth } from '../contexts/AuthContext';

interface PronunciationButtonProps {
  korean: string;
  romanization?: string;
  size?: 'sm' | 'md';
}

const MicIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
  </svg>
);

// Animated bars shown while listening
const WaveBar: React.FC<{ delay: string }> = ({ delay }) => (
  <span
    className="inline-block w-0.5 bg-current rounded-full"
    style={{
      height: '14px',
      animation: 'pronunciationWave 0.8s ease-in-out infinite alternate',
      animationDelay: delay,
    }}
  />
);

const PronunciationButton: React.FC<PronunciationButtonProps> = ({
  korean,
  romanization,
  size = 'sm',
}) => {
  const { hasPremiumAccess, isAuthenticated } = useAuth();
  const isPremium = hasPremiumAccess();
  const { state, result, isSupported, start, reset } = useSpeechRecognition();

  if (!isSupported) return null;

  const canTry = !isAuthenticated || hasAttemptsRemaining(isPremium);
  const remaining = attemptsLeft(isPremium);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (state === 'done') { reset(); return; }
    if (state === 'listening') { reset(); return; }

    if (!canTry) {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'register' }));
      return;
    }

    start(korean, romanization);
  };

  const isListening = state === 'listening';
  const isDone = state === 'done';
  const isSm = size === 'sm';

  return (
    <>
      <style>{`
        @keyframes pronunciationWave {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>

      <div className="flex flex-col items-center gap-1" onClick={e => e.stopPropagation()}>
        <button
          onClick={handleClick}
          title={
            !canTry ? `Daily limit reached (${FREE_LIMIT} attempts). Upgrade for unlimited.`
            : isListening ? 'Tap to stop'
            : isDone ? 'Tap to try again'
            : 'Practice pronunciation'
          }
          className={`flex items-center gap-1.5 rounded-xl font-semibold transition-all duration-200 ${
            isSm ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
          } ${
            isListening
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/30 scale-105'
              : isDone && result
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              : !canTry
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:scale-105'
          }`}
        >
          {isListening ? (
            <span className="flex items-center gap-0.5">
              <WaveBar delay="0ms" />
              <WaveBar delay="100ms" />
              <WaveBar delay="200ms" />
              <WaveBar delay="100ms" />
              <WaveBar delay="0ms" />
            </span>
          ) : (
            <MicIcon className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          )}
          <span>{isListening ? 'Listening…' : isDone ? 'Try again' : 'Pronounce'}</span>
        </button>

        {/* Score result */}
        {isDone && result && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm w-full justify-center">
            <span className="text-sm">{result.emoji}</span>
            <span className={`text-xs font-bold ${result.colorClass}`}>{result.label}</span>
            <span className="text-xs text-gray-400 font-medium">{result.score}%</span>
          </div>
        )}

        {/* Daily limit badge for free users */}
        {isAuthenticated && !isPremium && !isDone && remaining !== Infinity && remaining <= 5 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-600">
            {remaining} left today
          </span>
        )}
      </div>
    </>
  );
};

const FREE_LIMIT = 10;

export default PronunciationButton;
