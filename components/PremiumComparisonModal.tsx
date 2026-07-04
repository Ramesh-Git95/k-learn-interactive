import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUpgrade } from '../hooks/useUpgrade';


const ROWS = [
  { feature: 'Hangul Alphabet',         free: 'Full access',          premium: 'Full access ✓',              both: true  },
  { feature: 'Vocabulary',              free: '3 categories (39 words)', premium: 'All 94 words',            both: false },
  { feature: 'Grammar Patterns',        free: '5 of 7 patterns (basic)', premium: 'All 7 + advanced',         both: false },
  { feature: 'Common Phrases',          free: '15 phrases',           premium: 'All 16 phrases',             both: false },
  { feature: 'Cultural Insights',       free: '5 of 12 tips',         premium: 'All 12 + 3 subsections',    both: false },
  { feature: 'Honorific Engine',        free: '2 of 6 categories',    premium: 'All 6 categories',           both: false },
  { feature: 'Culture Cards',           free: '6 cards (Social)',      premium: 'All 24 cards',               both: false },
  { feature: 'Typing Dojo',             free: '15-sec demo',           premium: 'Full 60-second game',       both: false },
  { feature: 'TOPIK Prep',              free: '3 questions/session',   premium: 'Unlimited questions',       both: false },
  { feature: 'Scripted Conversations',  free: '2 of 6 scenarios',      premium: 'All 6 scenarios',           both: false },
  { feature: 'AI Chat Practice',        free: '5 chats/day',           premium: '50 chats/day',              both: false },
  { feature: 'Quiz Modes',              free: 'Multiple choice only',  premium: 'All modes, no daily cap',   both: false },
  { feature: 'Spaced Repetition (SRS)', free: 'Full access',           premium: 'Full access ✓',             both: true  },
  { feature: 'Bookmarks',               free: 'Up to 15',              premium: 'Unlimited',                 both: false },
  { feature: 'Progress Sync',           free: 'Local only',            premium: 'Cloud sync ✓',              both: false },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PremiumComparisonModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { startUpgrade } = useUpgrade();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full mx-auto max-h-[92vh] flex flex-col overflow-hidden">

        {/* Gradient header */}
        <div
          className="relative px-6 py-7 text-center flex-shrink-0"
          style={{ background: 'var(--brand-gradient-hero)' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm transition-colors"
            aria-label="Close"
          >✕</button>

          <div className="text-4xl mb-2">⭐</div>
          <h2 className="text-2xl font-black text-white tracking-tight">K-Learn Premium</h2>
          <p className="text-pink-100/80 text-sm mt-1">Cancel anytime · No long-term commitment</p>

          <div className="inline-flex items-baseline gap-2 mt-4 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-2.5 border border-white/20">
            <span className="text-4xl font-black text-white">$4</span>
            <span className="text-white/80 text-sm">/month</span>
          </div>
        </div>

        {/* Comparison table */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
              <tr>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-[48%]">Feature</th>
                <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-[26%]">Free</th>
                <th className="px-3 py-3 text-center text-[11px] font-black uppercase tracking-wider w-[26%]">
                  <span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Premium
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-gray-50 dark:border-gray-800/80 ${
                    i % 2 === 0 ? 'bg-gray-50/60 dark:bg-gray-800/20' : 'bg-white dark:bg-gray-900'
                  }`}
                >
                  <td className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300 text-sm">{row.feature}</td>
                  <td className="px-3 py-3 text-center">
                    {row.both ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{row.free}</span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{row.free}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full text-white leading-tight"
                      style={{ background: row.both ? 'linear-gradient(135deg,#22C55E,#059669)' : 'var(--brand-gradient)' }}
                    >
                      {row.premium}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Social proof */}
          <div className="mx-4 my-4 p-4 rounded-2xl border border-pink-100 dark:border-pink-800/30" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.04), rgba(139,92,246,0.04))' }}>
            <div className="flex gap-0.5 mb-2 text-sm">{'⭐⭐⭐⭐⭐'}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed">
              "The SRS + culture content combo is incredible — this is the most complete Korean learning app I've used."
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">— Premium subscriber</p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0 space-y-2">
          {isAuthenticated ? (
            <>
              <button
                onClick={startUpgrade}
                className="w-full py-3.5 rounded-2xl font-black text-base btn-brand"
              >
                Subscribe — $4/month →
              </button>
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                Secure payment via Stripe · Cancel anytime
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'register' })); }}
                className="w-full py-3.5 rounded-2xl font-black text-base btn-brand"
              >
                Create Free Account to Get Started →
              </button>
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                Free forever · Upgrade to Premium inside the app
              </p>
            </>
          )}
          <button
            onClick={onClose}
            className="w-full py-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumComparisonModal;
