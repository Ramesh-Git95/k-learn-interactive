import React from 'react';
import { accentFor } from '../utils/moduleAccent';
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
  // Coloured by where it is sending you, so the card already looks like the
  // place it leads to.
  const ACC = accentFor(unit.section);

  const go = () => {
    if (onNavigate) onNavigate(unit.section);
    else window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: unit.section }));
  };

  return (
    <button
      onClick={go}
      className={`kl-card group flex w-full items-center gap-4 p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 ${className}`}
    >
      <div
        className="flex h-11 w-11 flex-none items-center justify-center rounded-xl font-korean text-xl font-bold"
        style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D`, color: ACC.light }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-semibold" style={{ color: ACC.light }}>
          NEXT UP · {unit.estMinutes} MIN
        </div>
        <div className="truncate text-[16px] font-semibold text-[#16202F] dark:text-white">{unit.title}</div>
        <div className="truncate text-[12.5px] text-[#4A5566] dark:text-gray-400">
          {completed > 0 ? `${completed}/${total} done — pick up where you left off` : unit.subtitle}
        </div>
      </div>
      <span
        className="flex h-10 flex-none items-center gap-1.5 rounded-[9px] px-4 text-[13.5px] font-semibold text-white transition-transform duration-200 group-hover:translate-x-0.5"
        style={{ background: ACC.light }}
      >
        Go →
      </span>
    </button>
  );
}
