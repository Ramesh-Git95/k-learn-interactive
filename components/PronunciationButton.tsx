import React, { useEffect, useRef, useState } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAuth } from '../contexts/AuthContext';
import { useUpgrade } from '../hooks/useUpgrade';

interface PronunciationButtonProps {
  korean: string;
  romanization?: string;
  size?: 'sm' | 'md';
  /** Pass 'vocab' or 'kdrama' on the first button of each page to enable the hint system */
  hintKey?: 'vocab' | 'kdrama';
}

// ── Hint system constants ─────────────────────────────────────────────────────
const INITIAL_DELAY_MS  = 15_000;         // show hint 15 s after page load (after flip hint has cleared)
const RESHOW_DELAY_MS   = 3.5 * 60_000;  // re-show every 3.5 min if not used
const AUTO_HIDE_MS      = 7_000;          // auto-hide after 7 s

const usedKey   = (k: string) => `pronunciation-used-${k}`;
const hasUsed   = (k: string) => !!localStorage.getItem(usedKey(k));
const markUsed  = (k: string) => localStorage.setItem(usedKey(k), '1');

// One hint owner per hintKey at a time (module-level, reset on unmount)
const hintOwners: Record<string, boolean> = {};

// ── Sub-components ────────────────────────────────────────────────────────────
const MicIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
  </svg>
);

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

// ── Main component ────────────────────────────────────────────────────────────
const PronunciationButton: React.FC<PronunciationButtonProps> = ({
  korean,
  romanization,
  size = 'sm',
  hintKey,
}) => {
  const { hasPremiumAccess, isAuthenticated } = useAuth();
  const isPremium = hasPremiumAccess();
  const { startUpgrade } = useUpgrade();
  const { state, result, isSupported, start, reset } = useSpeechRecognition();

  const [showHint, setShowHint] = useState(false);
  const isOwner    = useRef(false);
  const timers     = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  // Schedule a single show → auto-hide cycle, then re-schedule
  const scheduleHint = (delay: number) => {
    clearTimers();
    if (!isOwner.current) return;

    const show = setTimeout(() => {
      setShowHint(true);
      // Auto-hide after AUTO_HIDE_MS, then re-schedule
      const hide = setTimeout(() => {
        setShowHint(false);
        scheduleHint(RESHOW_DELAY_MS);   // user hasn't tried yet → show again later
      }, AUTO_HIDE_MS);
      timers.current.push(hide);
    }, delay);
    timers.current.push(show);
  };

  useEffect(() => {
    if (!isSupported || !hintKey) return;
    if (hasUsed(hintKey)) return;        // user already tried it on this page
    if (hintOwners[hintKey]) return;     // another button on this page already owns the hint

    hintOwners[hintKey] = true;
    isOwner.current = true;

    scheduleHint(INITIAL_DELAY_MS);

    return () => {
      clearTimers();
      if (isOwner.current) hintOwners[hintKey] = false;
    };
  }, [isSupported, hintKey]);

  // Dismiss without marking used — will re-appear after RESHOW_DELAY_MS
  const dismissHint = () => {
    clearTimers();
    setShowHint(false);
    if (isOwner.current && hintKey) {
      scheduleHint(RESHOW_DELAY_MS);
    }
  };

  // User actually clicked Pronounce — mark as used, stop forever
  const markHintUsed = () => {
    clearTimers();
    setShowHint(false);
    if (hintKey) markUsed(hintKey);
  };

  if (!isSupported) return null;

  const isSm = size === 'sm';

  if (!isPremium) {
    const handleLockedClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isAuthenticated) {
        window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'register' }));
      } else {
        startUpgrade();
      }
    };
    return (
      <div className="flex flex-col items-center gap-1" onClick={e => e.stopPropagation()}>
        <button
          onClick={handleLockedClick}
          title={isAuthenticated ? 'Premium feature — upgrade to practice pronunciation' : 'Sign up free to unlock pronunciation practice'}
          className={`flex items-center gap-1.5 rounded-xl font-semibold transition-all duration-200 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-400 ${isSm ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
        >
          <span>🔒</span>
          <span>Pronounce</span>
        </button>
      </div>
    );
  }

  const isListening = state === 'listening';
  const isDone      = state === 'done';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state === 'done')      { reset(); return; }
    if (state === 'listening') { reset(); return; }
    markHintUsed();
    start(korean, romanization);
  };

  return (
    <>
      <style>{`
        @keyframes pronunciationWave {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
        @keyframes hintBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes hintPulseRing {
          0%   { transform: scale(1);    opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0;   }
        }
        @keyframes hintFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0);   }
        }
      `}</style>

      <div className="flex flex-col items-center gap-1 relative" onClick={e => e.stopPropagation()}>

        {/* ── Hint tooltip ── */}
        {showHint && (
          <div
            className="absolute z-50 pointer-events-auto"
            style={{
              bottom: 'calc(100% + 10px)',
              left: '50%',
              animation: 'hintFadeIn 0.3s ease forwards',
              whiteSpace: 'nowrap',
            }}
          >
            <div
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl text-white text-xs font-bold"
              style={{ background: 'var(--brand-gradient)' }}
            >
              <span style={{ display: 'inline-block', animation: 'hintBounce 1s ease-in-out infinite' }}>
                🎤
              </span>
              <span>Try pronouncing!</span>
              <button
                onClick={e => { e.stopPropagation(); dismissHint(); }}
                className="ml-1 opacity-70 hover:opacity-100 font-black leading-none"
              >
                ✕
              </button>
              {/* Arrow pointing down */}
              <span
                className="absolute left-1/2"
                style={{
                  bottom: '-7px',
                  transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '7px solid #8B5CF6',
                }}
              />
            </div>
          </div>
        )}

        {/* ── Button with optional pulse ring ── */}
        <div className="relative">
          {showHint && (
            <span
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                border: '2px solid #EC4899',
                animation: 'hintPulseRing 1.2s ease-out infinite',
              }}
            />
          )}
          <button
            onClick={handleClick}
            title={
              isListening ? 'Tap to stop'
              : isDone    ? 'Tap to try again'
              :             'Practice pronunciation'
            }
            className={`flex items-center gap-1.5 rounded-xl font-semibold transition-all duration-200 ${
              isSm ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
            } ${
              isListening
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/30 scale-105'
                : isDone && result
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                : showHint
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/40'
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
        </div>

        {/* Score result */}
        {isDone && result && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm w-full justify-center">
            <span className="text-sm">{result.emoji}</span>
            <span className={`text-xs font-bold ${result.colorClass}`}>{result.label}</span>
            <span className="text-xs text-gray-400 font-medium">{result.score}%</span>
          </div>
        )}

      </div>
    </>
  );
};

export default PronunciationButton;
