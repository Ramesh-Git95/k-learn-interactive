import React from 'react';
import type { Section } from '../types';
import { useProgress } from '../contexts/ProgressContext';
import { canSkipHangul } from '../utils/topikEstimate';

// "Next up →" momentum card, shown on completion screens (SRS session, quiz)
// so finishing something chains into the next path step instead of dumping
// the user back to the dashboard to re-decide.
const PATH: { id: Section; name: string; icon: string; desc: string }[] = [
  { id: 'hangul',     name: 'Hangul',     icon: '한', desc: 'Master the Korean alphabet' },
  { id: 'vocabulary', name: 'Vocabulary', icon: '📖', desc: 'Learn essential words' },
  { id: 'phrases',    name: 'Phrases',    icon: '💬', desc: 'Everyday expressions' },
  { id: 'grammar',    name: 'Grammar',    icon: '📝', desc: 'Understand sentence structure' },
  { id: 'culture',    name: 'Culture',    icon: '🎭', desc: 'Context that makes it stick' },
  { id: 'quiz',       name: 'Quiz',       icon: '🧠', desc: 'Test what you learned' },
];

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
  const next = PATH.find(s =>
    s.id !== exclude && !(skipHangul && s.id === 'hangul') && !progress[`section_${s.id}`]
  );
  if (!next) return null; // whole path complete — nothing to chain

  const go = () => {
    if (onNavigate) onNavigate(next.id);
    else window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: next.id }));
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
        {next.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/70">Next up — keep the momentum</div>
        <div className="text-base font-black truncate">{next.name} · {next.desc}</div>
      </div>
      <span className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-white text-[#C13F22] text-xs font-black">Go →</span>
    </button>
  );
}
