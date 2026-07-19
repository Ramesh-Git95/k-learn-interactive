import React, { useMemo, useState } from 'react';
import type { Section } from '../types';
import Icon from './Icon';
import { getUnitProgress, getPathSummary, type UnitProgress } from '../utils/learningUnits';

// The learning path, in lesson-sized units.
//
// This used to be six section-sized steps ("Learn Hangul · 1-2 hours"), which
// reads as a mountain. It now lists ~30 units of a few minutes each, so the next
// action is always small and obvious. Units come from utils/learningUnits.ts.

interface LearningPathProps {
  setActiveSection: (section: Section) => void;
  progress: { [key: string]: boolean };
  /** Sections treated as satisfied by TOPIK placement (e.g. skip Hangul). */
  assumeDone?: Section[];
}

const SECTION_META: Record<string, { label: string; icon: string }> = {
  hangul:     { label: 'The alphabet',   icon: '한' },
  vocabulary: { label: 'Words',          icon: '📚' },
  phrases:    { label: 'Phrases',        icon: '💬' },
  grammar:    { label: 'Grammar',        icon: '📝' },
  culture:    { label: 'Culture',        icon: '🎭' },
};

const LearningPath: React.FC<LearningPathProps> = ({ setActiveSection, progress, assumeDone }) => {
  const units = useMemo(() => getUnitProgress(progress, assumeDone ?? []), [progress, assumeDone]);
  const summary = useMemo(() => getPathSummary(progress, assumeDone ?? []), [progress, assumeDone]);

  // The frontier — the one unit we actively point at.
  const nextId = units.find(u => u.status === 'in-progress')?.unit.id
              ?? units.find(u => u.status === 'available')?.unit.id;

  // Group into sections, preserving path order.
  const groups = useMemo(() => {
    const out: { section: Section; items: UnitProgress[] }[] = [];
    units.forEach(u => {
      const last = out[out.length - 1];
      if (last && last.section === u.unit.section) last.items.push(u);
      else out.push({ section: u.unit.section, items: [u] });
    });
    return out;
  }, [units]);

  // Finished sections fold away by default — 30 rows is a lot to scroll past to
  // reach the one that matters. Derived rather than seeded into state on mount,
  // because progress arrives from the server AFTER the first render; a mount-time
  // snapshot would read as "nothing finished" and never fold. An explicit tap
  // always wins over the default.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const isCollapsed = (section: string, items: UnitProgress[]) =>
    overrides[section] ?? items.every(i => i.status === 'done');

  const toggle = (section: string, items: UnitProgress[]) =>
    setOverrides(o => ({ ...o, [section]: !isCollapsed(section, items) }));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
      {/* Header + overall progress */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">🗺️</span>
          Your Path
        </h2>
        <span className="text-sm font-black text-gray-500 dark:text-gray-400">
          {summary.doneUnits}/{summary.totalUnits} done
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${summary.percent}%`, background: 'var(--brand-gradient-h)' }}
        />
      </div>

      <div className="space-y-5">
        {groups.map(group => {
          const meta = SECTION_META[group.section] ?? { label: group.section, icon: '•' };
          const doneCount = group.items.filter(i => i.status === 'done').length;
          const folded = isCollapsed(group.section, group.items);
          const hasNext = group.items.some(i => i.unit.id === nextId);

          return (
            <div key={group.section}>
              {/* Section header — click to fold */}
              <button
                onClick={() => toggle(group.section, group.items)}
                className="w-full flex items-center gap-2 mb-2 group"
              >
                <span className="text-lg">{meta.icon}</span>
                <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 group-hover:text-[#E4572E] transition-colors">
                  {meta.label}
                </span>
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                  {doneCount}/{group.items.length}
                </span>
                {doneCount === group.items.length && <span className="text-green-500 text-xs">✓</span>}
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                <span className={`text-gray-400 text-xs transition-transform ${folded ? '' : 'rotate-90'}`}>▶</span>
              </button>

              {folded ? (
                hasNext && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 pl-7">
                    Your next unit is in here — tap to open
                  </p>
                )
              ) : (
                <div className="space-y-1.5">
                  {group.items.map(({ unit, status, completed, total }) => {
                    const isLocked = status === 'locked';
                    const isDone = status === 'done';
                    const isNext = unit.id === nextId;

                    return (
                      <button
                        key={unit.id}
                        disabled={isLocked}
                        onClick={() => setActiveSection(unit.section)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                          isLocked
                            ? 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 opacity-50 cursor-not-allowed'
                            : isNext
                            ? 'border-[#E4572E] bg-[#E4572E]/5 dark:bg-[#E4572E]/10 shadow-md'
                            : isDone
                            ? 'border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10 hover:border-green-400'
                            : 'border-gray-200 dark:border-gray-800 hover:border-[#F8C4AE] dark:hover:border-[#E4572E] hover:shadow-sm'
                        }`}
                      >
                        {/* Status dot */}
                        <span
                          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${
                            isDone
                              ? 'bg-green-500 text-white'
                              : isNext
                              ? 'text-white'
                              : isLocked
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}
                          style={isNext ? { background: 'var(--brand-gradient)' } : undefined}
                        >
                          {isDone ? <Icon icon="check" className="w-3.5 h-3.5" /> : isLocked ? '🔒' : `${completed}/${total}`}
                        </span>

                        <span className="flex-grow min-w-0">
                          <span className={`block text-sm font-bold truncate ${
                            isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                          }`}>
                            {unit.title}
                          </span>
                          {unit.subtitle && (
                            <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {unit.subtitle}
                            </span>
                          )}
                        </span>

                        <span className="flex-shrink-0 flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                            {unit.estMinutes} min
                          </span>
                          {isNext && (
                            <span className="text-[11px] font-black text-[#E4572E] dark:text-[#F07A55] whitespace-nowrap">
                              {completed > 0 ? 'Continue →' : 'Start →'}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {summary.percent === 100 && (
        <p className="mt-6 text-center text-sm font-bold text-green-600 dark:text-green-400">
          🎉 Every unit finished — 축하해요!
        </p>
      )}
    </div>
  );
};

export default LearningPath;
