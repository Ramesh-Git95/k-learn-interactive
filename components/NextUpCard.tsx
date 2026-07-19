import React from 'react';
import type { Section } from '../types';
import { useProgress } from '../contexts/ProgressContext';
import { canSkipHangul } from '../utils/topikEstimate';
import { getUnitProgress } from '../utils/learningUnits';

// "Next up →" momentum card, shown on completion screens (SRS session, quiz)
// so finishing something chains into the next thing instead of dumping the user
// back to the dashboard to re-decide.
//
// It names a lesson-sized UNIT rather than a whole section: "Aspirated sounds ·
// 4 min" is something you'll actually tap; "Hangul · Master the Korean
// alphabet" is a commitment you postpone.
const SECTION_ICON: Record<string, string> = {
  hangul: '한', vocabulary: '📖', phrases: '💬', grammar: '📝', culture: '🎭',
};

interface NextUpCardProps {
  /** Don't suggest the thing the user just finished. */
  exclude?: Section;
  /** Custom navigation (e.g. the SRS overlay must clear study state first).
   *  Defaults to the app-wide navigate-to-section event bus. */
  onNavigate?: (section: Section) => void;
  className?: string;
}

export default function NextUpCard({ exclude, onNavigate, className = '' }: NextUpCardProps) {
  const { progress } = useProgress();

  // TOPIK placement: tested level 2+ learners already read Hangul — skip it.
  const skipHangul = canSkipHangul();
  const assumeDone: Section[] = skipHangul ? ['hangul'] : [];

  // Skip past the section the user just finished, so completing a quiz doesn't
  // chain straight back into it.
  const candidates = getUnitProgress(progress, assumeDone)
    .filter(u => u.status !== 'done' && u.status !== 'locked' && u.unit.section !== exclude);
  const next = candidates.find(u => u.status === 'in-progress') ?? candidates[0];
  if (!next) return null; // whole path complete — nothing to chain

  const { unit, completed, total } = next;
  const icon = SECTION_ICON[unit.section] ?? '📘';

  const go = () => {
    if (onNavigate) onNavigate(unit.section);
    else window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: unit.section }));
  };

  return (
    <button
      onClick={go}
      className={`w-full flex items-center gap-4 rounded-2xl p-4 text-left text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${className}`}
      style={{ background: 'var(--brand-gradient)' }}
    >
      <div
        className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0"
        style={{ fontFamily: 'Pretendard Variable, sans-serif', fontWeight: 900 }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/70">
          Next up · {unit.estMinutes} min
        </div>
        <div className="text-base font-black truncate">{unit.title}</div>
        <div className="text-[11px] text-white/70 truncate">
          {completed > 0 ? `${completed}/${total} done — pick up where you left off` : unit.subtitle}
        </div>
      </div>
      <span className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-white text-[#C13F22] text-xs font-black">Go →</span>
    </button>
  );
}
