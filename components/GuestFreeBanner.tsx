import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Section } from '../types';

// One-time hint shown to first-visit guests so they discover the sections that
// are open without an account (vocabulary, grammar, culture) before they hit a
// signup wall on Dashboard. Persisted so it never shows again after dismiss or
// after they click into a free section.
const STORAGE_KEY = 'kl-guest-hint-seen';

const FREE_SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'vocabulary', label: 'Vocabulary', icon: '📚' },
  { id: 'grammar',    label: 'Grammar',    icon: '📝' },
  { id: 'culture',    label: 'Culture',    icon: '🎭' },
];

interface GuestFreeBannerProps {
  onNavigate: (section: Section) => void;
}

const GuestFreeBanner: React.FC<GuestFreeBannerProps> = ({ onNavigate }) => {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return true;
    }
  });

  const markSeen = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore storage errors (private mode etc.) */
    }
    setVisible(false);
  };

  const handleGo = (section: Section) => {
    markSeen();
    onNavigate(section);
  };

  if (!visible) return null;

  return (
    <div className="animate-fadeIn border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-[#FBEAE3] via-[#E9F1EC] to-[#E7EEF5] dark:from-[#E4572E]/10 dark:via-[#3F8571]/10 dark:to-[#2F5D8A]/10">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        {/* Content centered; dismiss anchored to the strip's edge so it never
            drifts a screen-width away from the text on wide monitors. */}
        <div className="flex items-center justify-center gap-x-3 gap-y-2 flex-wrap pr-10">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            ✨ New here? Explore these <span className="font-black text-[#E4572E] dark:text-[#F07A55]">free</span> — no signup needed:
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            {FREE_SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => handleGo(s.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold text-white shadow-sm hover:-translate-y-px transition-transform duration-200"
                style={{ background: 'var(--brand-gradient)' }}
              >
                <span aria-hidden="true">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={markSeen}
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors duration-200"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default GuestFreeBanner;
