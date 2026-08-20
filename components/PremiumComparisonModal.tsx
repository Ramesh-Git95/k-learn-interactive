import React from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useUpgrade } from '../hooks/useUpgrade';
import { PLAN_ROWS, FREE_FOREVER, PREMIUM_PRICE } from '../data/planLimits';
import { FREE_GRAMMAR_COUNT, TOTAL_GRAMMAR_COUNT } from '../constants';

// The paywall. Every premium button in the app now arrives here — see
// useUpgrade — so it is the one screen standing between a curious learner and
// a payment page, and it should read like an explanation rather than a pitch.
//
// Adopted from the owner's design, whose note is the whole brief: "the gate
// states exactly what you have used and what the next tier adds — no blurred
// teasers, no countdown pressure." So: no gradient hero, no star, no urgency,
// a real "keep going on free" way out, and the numbers read from planLimits.ts
// rather than being typed in here where they drift.

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PremiumComparisonModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { progress, bookmarks } = useProgress();
  const { limits } = useFeatureAccess();
  // checkout, not startUpgrade — this IS the paywall, so its button goes to
  // payment. Calling startUpgrade here would just reopen this modal.
  const { checkout } = useUpgrade();

  if (!isOpen) return null;

  const countWith = (prefix: string) =>
    Object.keys(progress).filter(k => k.startsWith(prefix) && progress[k]).length;

  // Where a real number is known it is shown, because "6 of 15 saved" says
  // something about this person and "up to 15" does not.
  const grammarRead = countWith('grammar_pattern_');
  const bookmarkCount = bookmarks?.length ?? 0;
  const bookmarkCap = Number.isFinite(limits.bookmarksLimit) ? (limits.bookmarksLimit as number) : null;

  const usage: { label: string; used: number; cap: number }[] = [];
  if (bookmarkCap) usage.push({ label: 'Bookmarks saved', used: bookmarkCount, cap: bookmarkCap });
  if (grammarRead > 0) {
    usage.push({ label: 'Grammar patterns read', used: Math.min(grammarRead, FREE_GRAMMAR_COUNT), cap: FREE_GRAMMAR_COUNT });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="What Premium adds"
    >
      <div className="kl-card flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[22px] shadow-2xl">

        {/* ── Head ── */}
        <div className="flex-none border-b border-[rgba(20,32,47,0.12)] px-6 py-5 dark:border-gray-800 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#4A5566] dark:text-gray-500">
                Your plan · Free
              </div>
              <h2 className="mt-1.5 font-display text-[24px] font-semibold tracking-[-0.02em] text-[#16202F] sm:text-[27px] dark:text-white">
                What Premium adds
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-[#4A5566] transition-colors hover:bg-[rgba(20,32,47,0.06)] hover:text-[#16202F] dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-3 max-w-[62ch] text-[14px] leading-[1.6] text-[#3E4A5A] dark:text-gray-400">
            Everything you have already learned stays yours, including your review queue. Nothing is
            taken away if you stay on free.
          </p>
        </div>

        {/* ── Body ── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
          {usage.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#4A5566] dark:text-gray-500">
                Where you are now
              </div>
              <div className="flex flex-col gap-3">
                {usage.map(u => (
                  <div key={u.label}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13.5px]">
                      <span className="text-[#3E4A5A] dark:text-gray-300">{u.label}</span>
                      <span className="font-semibold tabular-nums text-[#16202F] dark:text-white">
                        {u.used} of {u.cap}
                      </span>
                    </div>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (u.used / u.cap) * 100)}%`,
                          background: u.used >= u.cap ? '#C13F22' : '#2E6B59',
                        }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-2 grid grid-cols-[1.2fr_1fr_1fr] gap-3 border-b border-[rgba(20,32,47,0.12)] pb-2 text-[10.5px] font-black uppercase tracking-[0.12em] text-[#4A5566] dark:border-gray-800 dark:text-gray-500">
            <span>What you use most</span>
            <span>Free · your plan</span>
            <span style={{ color: '#C13F22' }}>Premium · {PREMIUM_PRICE}/mo</span>
          </div>

          <div className="flex flex-col">
            {PLAN_ROWS.map(row => (
              <div
                key={row.label}
                className="grid grid-cols-[1.2fr_1fr_1fr] items-baseline gap-3 border-b border-[rgba(20,32,47,0.07)] py-2.5 text-[13.5px] last:border-0 dark:border-gray-800/60"
              >
                <span className="font-medium text-[#16202F] dark:text-gray-200">{row.label}</span>
                <span className="text-[#4A5566] dark:text-gray-400">{row.free}</span>
                <span className="font-semibold text-[#16202F] dark:text-white">{row.premium}</span>
              </div>
            ))}
          </div>

          {/* Naming what free keeps matters as much as the table above it. */}
          <div className="kl-well mt-6 rounded-xl px-5 py-4">
            <div className="mb-2 text-[13px] font-semibold text-[#16202F] dark:text-white">
              Free stays generous
            </div>
            <p className="text-[13px] leading-[1.6] text-[#3E4A5A] dark:text-gray-400">
              {FREE_FOREVER.join(' · ')} — never limited, on any plan.
            </p>
          </div>
        </div>

        {/* ── Foot ── */}
        <div className="flex-none border-t border-[rgba(20,32,47,0.12)] px-6 py-5 dark:border-gray-800 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={checkout}
              className="flex h-12 flex-1 items-center justify-center rounded-[11px] px-6 text-[15px] font-bold text-white transition-transform hover:scale-[1.01] sm:flex-none"
              style={{ background: '#C13F22', boxShadow: '0 8px 24px -12px #C13F22' }}
            >
              {isAuthenticated ? `Upgrade for ${PREMIUM_PRICE} a month` : `Sign up, then upgrade`}
            </button>
            <button
              onClick={onClose}
              className="flex h-12 items-center justify-center rounded-[11px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[14px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
            >
              Keep going on free
            </button>
          </div>
          <p className="mt-3 text-[12.5px] text-[#4A5566] dark:text-gray-500">
            Cancel anytime from your profile. Less than a coffee ☕
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumComparisonModal;
