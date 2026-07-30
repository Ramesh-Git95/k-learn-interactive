import React, { useMemo, useState } from 'react';
import type { Section } from '../types';
import Icon from './Icon';
import { getUnitProgress, getPathSummary, type UnitProgress } from '../utils/learningUnits';
import { accentFor } from '../utils/moduleAccent';

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
    <div className="kl-card p-6">
      {/* Header + overall progress */}
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-[13.5px] text-[#4A5566] dark:text-gray-400">
          {summary.totalUnits} units of a few minutes each — your next one is highlighted.
        </p>
        <span className="flex-none text-[13px] font-semibold text-[#16202F] dark:text-white">
          {summary.doneUnits}/{summary.totalUnits} done
        </span>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
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
          const groupAccent = accentFor(group.section);

          return (
            <div key={group.section}>
              {/* Section header — click to fold */}
              <button
                onClick={() => toggle(group.section, group.items)}
                className="group mb-2.5 flex w-full items-center gap-2.5"
              >
                <span
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-lg font-korean text-[13px] font-bold"
                  style={{ background: `${groupAccent.light}1F`, border: `1px solid ${groupAccent.light}45`, color: groupAccent.light }}
                >
                  {meta.icon}
                </span>
                <span className="text-[13.5px] font-semibold text-[#16202F] dark:text-white">
                  {meta.label}
                </span>
                <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">
                  {doneCount}/{group.items.length}
                </span>
                <div className="h-px flex-1 bg-[rgba(20,32,47,0.10)] dark:bg-gray-800" />
                <span className={`text-[10px] text-[#4A5566] transition-transform dark:text-gray-500 ${folded ? '' : 'rotate-90'}`}>▶</span>
              </button>

              {folded ? (
                hasNext && (
                  <p className="pl-[38px] text-[12.5px] text-[#4A5566] dark:text-gray-500">
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
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${
                          isLocked
                            ? 'cursor-not-allowed border-[rgba(20,32,47,0.08)] opacity-45 dark:border-gray-800'
                            : isNext
                            ? 'shadow-sm'
                            : 'border-[rgba(20,32,47,0.10)] hover:border-[rgba(20,32,47,0.24)] dark:border-gray-800 dark:hover:border-gray-600'
                        }`}
                        style={isNext ? {
                          borderColor: groupAccent.light,
                          background: `${groupAccent.light}0F`,
                        } : undefined}
                      >
                        {/* Status marker — count, check or lock */}
                        <span
                          className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-semibold"
                          style={
                            isDone
                              ? { background: `${groupAccent.light}24`, color: groupAccent.light }
                              : isNext
                              ? { background: groupAccent.light, color: '#fff' }
                              : { background: 'rgba(20,32,47,0.06)', color: '#4A5566' }
                          }
                        >
                          {isDone ? <Icon icon="check" className="h-3.5 w-3.5" /> : isLocked ? '·' : `${completed}/${total}`}
                        </span>

                        <span className="min-w-0 grow">
                          <span className={`block truncate text-[14px] font-semibold ${
                            isLocked ? 'text-[#4A5566] dark:text-gray-500' : 'text-[#16202F] dark:text-white'
                          }`}>
                            {unit.title}
                          </span>
                          {unit.subtitle && (
                            <span className="block truncate text-[12px] text-[#4A5566] dark:text-gray-500">
                              {unit.subtitle}
                            </span>
                          )}
                        </span>

                        <span className="flex flex-none items-center gap-3">
                          <span className="text-[12px] text-[#4A5566] dark:text-gray-500">
                            {unit.estMinutes} min
                          </span>
                          {isNext && (
                            <span
                              className="flex h-9 items-center whitespace-nowrap rounded-lg px-3.5 text-[13px] font-semibold text-white"
                              style={{ background: groupAccent.light }}
                            >
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
