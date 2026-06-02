import React from 'react';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';

interface PremiumLockProps {
  title?: string;
  description?: string;
  className?: string;
}

/** Full-section upgrade prompt — use inside a section when the whole thing is gated */
export const PremiumLockBanner: React.FC<PremiumLockProps> = ({
  title = 'Premium Feature',
  description = 'Upgrade to unlock this content.',
  className = '',
}) => {
  const { openUpgradeModal } = useUpgradeModal();
  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 px-6 ${className}`}>
      <div className="text-5xl mb-3">⭐</div>
      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-xs">{description}</p>
      <button
        onClick={openUpgradeModal}
        className="px-7 py-2.5 text-white text-sm font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
        style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
      >
        See What's in Premium →
      </button>
    </div>
  );
};

interface LockedCardProps {
  label: string;
  sublabel?: string;
  emoji?: string;
  onClick?: () => void;
}

/** A locked placeholder card — shows title but content is behind a lock */
export const LockedCard: React.FC<LockedCardProps> = ({ label, sublabel, emoji = '🔒', onClick }) => {
  const { openUpgradeModal } = useUpgradeModal();
  return (
    <div
      className="relative flex flex-col items-center justify-center text-center p-5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-violet-300 dark:hover:border-violet-600 transition-colors group"
      onClick={onClick ?? openUpgradeModal}
    >
      <div className="text-2xl mb-2 opacity-50 group-hover:opacity-75 transition-opacity">{emoji}</div>
      <p className="text-sm font-black text-gray-400 dark:text-gray-500 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">{label}</p>
      {sublabel && <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">{sublabel}</p>}
      <span className="mt-2.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-100 to-violet-100 dark:from-pink-900/30 dark:to-violet-900/30 text-violet-600 dark:text-violet-400">
        ⭐ Premium
      </span>
    </div>
  );
};

interface LockedRowBannerProps {
  count: number;
  label?: string;
  /** Used when count === 1; defaults to stripping a trailing 's' from label */
  singularLabel?: string;
}

/** Inline "N more items locked" strip — used at the bottom of partially-shown lists */
export const LockedRowBanner: React.FC<LockedRowBannerProps> = ({ count, label = 'items', singularLabel }) => {
  const { openUpgradeModal } = useUpgradeModal();
  const noun = count === 1 ? (singularLabel ?? label.replace(/s$/, '')) : label;
  return (
    <div
      className="flex items-center justify-between rounded-2xl border border-dashed border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/10 px-5 py-4 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-colors"
      onClick={openUpgradeModal}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">🔒</span>
        <div>
          <p className="text-sm font-black text-gray-900 dark:text-white">
            {count} more {noun} with Premium
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Click to see what's included</p>
        </div>
      </div>
      <button
        className="flex-shrink-0 px-4 py-2 text-white text-xs font-black rounded-xl hover:scale-[1.02] transition-transform"
        style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
      >
        See Premium →
      </button>
    </div>
  );
};

interface LockedTabBadgeProps {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

/** A tab button that shows a lock badge — for tab-based section gating */
export const LockedTab: React.FC<LockedTabBadgeProps> = ({ children, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 opacity-60 hover:opacity-80 ${
      isActive
        ? 'text-white'
        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
    }`}
    style={isActive ? { background: 'linear-gradient(135deg, #9CA3AF, #6B7280)' } : {}}
  >
    {children}
    <span className="text-[9px] font-black bg-gradient-to-r from-pink-500 to-violet-500 text-transparent bg-clip-text">⭐</span>
  </button>
);

interface UpgradeNudgeProps {
  message: string;
  className?: string;
}

/** Small inline nudge — use next to partially visible content */
export const UpgradeNudge: React.FC<UpgradeNudgeProps> = ({ message, className = '' }) => {
  const { openUpgradeModal } = useUpgradeModal();
  return (
    <div className={`flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      <span>⭐</span>
      <span>{message}</span>
      <button
        onClick={openUpgradeModal}
        className="font-black text-violet-500 hover:underline"
      >
        See Premium →
      </button>
    </div>
  );
};
