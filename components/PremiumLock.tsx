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
        style={{ background: 'var(--brand-gradient)' }}
      >
        See What's in Premium →
      </button>
    </div>
  );
};

interface PeekOverlayProps {
  title?: string;
  description?: string;
}

/** Frosted CTA overlay for blur+peek gating — absolutely fills its relative parent. */
export const PeekOverlay: React.FC<PeekOverlayProps> = ({
  title = 'Premium Content',
  description = 'Upgrade to unlock everything you can see here.',
}) => {
  const { openUpgradeModal } = useUpgradeModal();
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-end text-center p-6 bg-gradient-to-b from-transparent via-white/55 to-white/95 dark:via-gray-950/55 dark:to-gray-950/95">
      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white mb-3 shadow" style={{ background: 'var(--brand-gradient)' }}>
        ⭐ Premium preview
      </span>
      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 max-w-sm">{description}</p>
      <button
        onClick={openUpgradeModal}
        className="px-7 py-2.5 text-white text-sm font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg"
        style={{ background: 'var(--brand-gradient)' }}
      >
        Unlock with Premium — $4/mo →
      </button>
    </div>
  );
};

interface PremiumPeekProps extends PeekOverlayProps {
  children: React.ReactNode;
  /** Height of the peek window in px (content beyond it is cropped). */
  maxHeight?: number;
  className?: string;
}

/** Blur + peek gate: renders the REAL premium content blurred and inert inside
 *  a capped window, with a frosted upgrade CTA on top. Seeing genuine content
 *  behind the frost converts better than a hard lock wall. */
export const PremiumPeek: React.FC<PremiumPeekProps> = ({
  title,
  description,
  children,
  maxHeight = 440,
  className = '',
}) => (
  <div className={`relative overflow-hidden rounded-2xl ${className}`} style={{ maxHeight }}>
    <div className="pointer-events-none select-none blur-[5px]" aria-hidden="true" inert>
      {children}
    </div>
    <PeekOverlay title={title} description={description} />
  </div>
);

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
      className="relative flex flex-col items-center justify-center text-center p-5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-[#93C2AE] dark:hover:border-[#2E6B59] transition-colors group"
      onClick={onClick ?? openUpgradeModal}
    >
      <div className="text-2xl mb-2 opacity-50 group-hover:opacity-75 transition-opacity">{emoji}</div>
      <p className="text-sm font-black text-gray-400 dark:text-gray-500 group-hover:text-[#3F8571] dark:group-hover:text-[#6BA88F] transition-colors">{label}</p>
      {sublabel && <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">{sublabel}</p>}
      <span className="mt-2.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FBDCCB] to-[#DDEBE4] dark:from-[#5F2010]/30 dark:to-[#153327]/30 text-[#2E6B59] dark:text-[#6BA88F]">
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
      className="flex items-center justify-between rounded-2xl border border-dashed border-[#BFDACD] dark:border-[#1D4436] bg-[#EEF5F1] dark:bg-[#153327]/10 px-5 py-4 cursor-pointer hover:bg-[#DDEBE4] dark:hover:bg-[#153327]/20 transition-colors"
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
        style={{ background: 'var(--brand-gradient)' }}
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
    <span className="text-[9px] font-black bg-gradient-to-r from-[#E4572E] to-[#3F8571] text-transparent bg-clip-text">⭐</span>
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
        className="font-black text-[#3F8571] hover:underline"
      >
        See Premium →
      </button>
    </div>
  );
};
