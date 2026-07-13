import React, { useState, useEffect } from 'react';
import { useAuthModal } from '../contexts/AuthModalContext';

interface Props {
  visibleCount: number;
  totalCount: number;
  type: 'cards' | 'patterns';
  allUsed?: boolean;
}

const GuestSignUpGate: React.FC<Props> = ({ visibleCount, totalCount, type, allUsed = false }) => {
  const { openRegister, openLogin } = useAuthModal();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const isCards = type === 'cards';
  const hidden = totalCount - visibleCount;

  // Animate in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  if (dismissed) return null;

  const handleRegister = () => {
    setDismissed(true);
    openRegister();
  };

  const handleLogin = () => {
    setDismissed(true);
    openLogin();
  };

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => setDismissed(true), 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: visible ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
          backdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
          WebkitBackdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
        }}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden transition-all duration-300"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(24px)',
            background: 'linear-gradient(160deg, #0D141F 0%, #16202F 45%, #1E3A5C 100%)',
          }}
        >
          {/* Top accent bar */}
          <div
            className="h-1 w-full"
            style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)' }}
          />

          <div className="p-7 text-center">
            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center text-sm transition-colors"
              aria-label="Dismiss"
            >
              ✕
            </button>

            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              🔓
            </div>

            <h3 className="text-2xl font-black text-white mb-2">
              {allUsed
                ? "You've used all free previews!"
                : `${hidden} more ${isCards ? 'words' : 'patterns'} waiting`}
            </h3>

            <p className="text-blue-200 text-sm leading-relaxed mb-6">
              {allUsed ? (
                <>
                  You've flipped every free card. Sign up in seconds to unlock{' '}
                  <strong className="text-white">{hidden} more {isCards ? 'words' : 'patterns'}</strong>{' '}
                  and save all your progress.
                </>
              ) : (
                <>
                  You've explored the free preview.{' '}
                  <strong className="text-white">Create a free account</strong> to unlock
                  all {totalCount} {isCards ? 'vocabulary cards' : 'grammar patterns'} and
                  keep your progress saved.
                </>
              )}
            </p>

            {/* Perks */}
            <div className="flex justify-center gap-6 mb-6">
              {['Free forever', 'Save progress', 'All content'].map(perk => (
                <div key={perk} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                    ✓
                  </div>
                  <span className="text-[11px] text-blue-200 font-semibold">{perk}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRegister}
                className="w-full py-3 font-black text-sm rounded-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-lg text-gray-900"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
              >
                Sign Up Free — Takes 10 seconds 🚀
              </button>
              <button
                onClick={handleLogin}
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl transition-colors border border-white/20"
              >
                I already have an account
              </button>
              <button
                onClick={handleDismiss}
                className="text-blue-300 hover:text-white text-xs transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GuestSignUpGate;
