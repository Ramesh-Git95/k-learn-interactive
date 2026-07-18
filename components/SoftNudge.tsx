import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Section } from '../types';

// Soft guidance, never a lock: a small dismissible tip strip shown when a
// learner wanders somewhere the path suggests they're not ready for (e.g.
// Grammar with almost no Hangul). Dismissal is remembered per-tip.
interface SoftNudgeProps {
  /** Persistence key — dismissal is stored as kl-nudge-<id>. */
  id: string;
  text: React.ReactNode;
  actionLabel?: string;
  actionSection?: Section;
  className?: string;
}

export default function SoftNudge({ id, text, actionLabel, actionSection, className = '' }: SoftNudgeProps) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(`kl-nudge-${id}`) === '1'; } catch { return false; }
  });
  if (dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(`kl-nudge-${id}`, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div className={`flex items-center gap-3 flex-wrap rounded-2xl border border-[#D9A441]/40 bg-[#D9A441]/10 dark:bg-[#D9A441]/15 px-4 py-3 ${className}`}>
      <span className="text-lg flex-shrink-0" aria-hidden="true">💡</span>
      <p className="flex-1 min-w-[220px] text-sm text-gray-700 dark:text-gray-200">{text}</p>
      {actionLabel && actionSection && (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: actionSection }))}
          className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-black text-white hover:scale-[1.02] transition-transform"
          style={{ background: 'var(--brand-gradient)' }}
        >
          {actionLabel}
        </button>
      )}
      <button
        onClick={dismiss}
        className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        aria-label="Dismiss tip"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
