import React, { useState, useEffect } from 'react';
import type { Section } from '../types';
import Icon from './Icon';

const VISITS_KEY = 'k-learn-section-visits';

function loadVisits(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(VISITS_KEY) || '{}'); }
  catch { return {}; }
}

function recordVisit(section: Section): Record<string, number> {
  const v = loadVisits();
  v[section] = (v[section] || 0) + 1;
  localStorage.setItem(VISITS_KEY, JSON.stringify(v));
  return v;
}

interface MiniLearningPathProps {
  currentSection: Section;
  setActiveSection: (section: Section) => void;
  progress: { [key: string]: boolean };
  getSectionTotalItems: (section: Section) => number;
  getSectionCompletedItems: (section: Section) => number;
}

interface Step {
  id: Section;
  title: string;
  icon: string;
  shortTitle: string;
  group: string;
}

const STEPS: Step[] = [
  // Foundation — has item-level completion tracking
  { id: 'hangul',       title: 'Hangul',      icon: '한',  shortTitle: 'H', group: 'Foundation' },
  { id: 'vocabulary',   title: 'Vocabulary',  icon: '📚', shortTitle: 'V', group: 'Foundation' },
  { id: 'grammar',      title: 'Grammar',     icon: '📝', shortTitle: 'G', group: 'Foundation' },
  { id: 'phrases',      title: 'Phrases',     icon: '💬', shortTitle: 'P', group: 'Foundation' },
  // Practice
  { id: 'culture',      title: 'Culture',     icon: '🎭', shortTitle: 'C', group: 'Practice'   },
  { id: 'quiz',         title: 'Quiz',        icon: '🧠', shortTitle: 'Q', group: 'Practice'   },
  { id: 'topik',        title: 'TOPIK Prep',  icon: '📋', shortTitle: 'T', group: 'Practice'   },
  { id: 'topik-test',   title: 'Level Test',  icon: '🎓', shortTitle: 'L', group: 'Practice'   },
  // Immersive
  { id: 'kdrama',       title: 'K-Drama',     icon: '🎬', shortTitle: 'D', group: 'Immersive'  },
  { id: 'kpop',         title: 'K-Pop',       icon: '🎵', shortTitle: 'K', group: 'Immersive'  },
  { id: 'reading',      title: 'Reading',     icon: '📖', shortTitle: 'R', group: 'Immersive'  },
  // Tools
  { id: 'srs',          title: 'Spaced Rep.',  icon: '🔄', shortTitle: 'S', group: 'Tools'      },
  { id: 'conversation', title: 'AI Chat',     icon: '🤖', shortTitle: 'A', group: 'Tools'      },
  { id: 'typing',       title: 'Typing',      icon: '⌨️', shortTitle: 'T', group: 'Tools'      },
  { id: 'honorifics',   title: 'Honorifics',  icon: '🙇', shortTitle: 'O', group: 'Tools'      },
];

// All sections use visit-based completion. VISITS_NEEDED visits = "done".
const CORE: Section[] = ['hangul', 'vocabulary', 'grammar', 'phrases', 'culture', 'quiz'];
const VISITS_NEEDED = 3;

const GROUPS = ['Foundation', 'Practice', 'Immersive', 'Tools'];

const MiniLearningPath: React.FC<MiniLearningPathProps> = ({
  currentSection,
  setActiveSection,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visits, setVisits] = useState<Record<string, number>>(loadVisits);

  // Record a visit each time the active section changes.
  useEffect(() => {
    setVisits(recordVisit(currentSection));
  }, [currentSection]);

  const isDone = (id: Section) => (visits[id] || 0) >= VISITS_NEEDED;

  const getStatus = (id: Section): 'current' | 'completed' | 'available' => {
    if (id === currentSection) return 'current';
    if (isDone(id)) return 'completed';
    return 'available';
  };

  // % shown under the icon in the expanded view (core sections only).
  const getSectionPct = (id: Section): number | null => {
    if (!CORE.includes(id)) return null;
    return Math.min(100, Math.round(((visits[id] || 0) / VISITS_NEEDED) * 100));
  };

  // Count current section as done too (so 6/6 is reachable while on a section).
  const completedCore = CORE.filter(id => isDone(id)).length;
  const corePct = (completedCore / CORE.length) * 100;
  const coreSteps = STEPS.filter(s => CORE.includes(s.id));

  // ── Compact bar ───────────────────────────────────────────────────────────
  if (!isExpanded) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-2 sm:p-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
            <span className="text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap hidden sm:inline">
              Core
            </span>
            <div className="flex items-center space-x-0.5 sm:space-x-1 overflow-x-auto">
              {coreSteps.map(step => {
                const status = getStatus(step.id);
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveSection(step.id)}
                    title={step.title}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs font-bold transition-all duration-200 flex-shrink-0 touch-target flex items-center justify-center ${
                      status === 'completed'
                        ? 'bg-green-500 text-white'
                        : status === 'current'
                        ? 'bg-pink-500 text-white ring-2 ring-pink-200 dark:ring-pink-500/50'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-pink-50/50 dark:hover:bg-pink-500/30'
                    }`}
                  >
                    {status === 'completed' ? '✓' : step.shortTitle}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {completedCore}/{CORE.length}
            </span>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-pink-500 dark:text-pink-400 hover:bg-pink-50/20 dark:hover:bg-pink-500/20 rounded p-1 transition-colors touch-target"
              title="See full learning path"
            >
              <Icon icon="menu" className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-2">
          <div
            className={`h-1 rounded-full transition-all duration-500 ${
              corePct >= 100 ? 'bg-green-500' : 'bg-pink-500'
            }`}
            style={{ width: `${corePct}%` }}
          />
        </div>
      </div>
    );
  }

  // ── Expanded view ─────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🗺️</span>Learning Path
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors p-2 touch-target"
        >
          <Icon icon="close" className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {GROUPS.map(group => {
          const groupSteps = STEPS.filter(s => s.group === group);
          return (
            <div key={group}>
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {group}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {groupSteps.map(step => {
                  const status = getStatus(step.id);
                  const pct    = getSectionPct(step.id);

                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveSection(step.id)}
                      className={`relative p-2 sm:p-3 rounded-lg text-center transition-all duration-200 hover:scale-105 touch-target ${
                        status === 'current'
                          ? 'bg-pink-500 text-white shadow-md scale-105'
                          : status === 'completed'
                          ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white hover:bg-pink-50/30 dark:hover:bg-pink-500/10 border border-transparent hover:border-pink-200 dark:hover:border-pink-800'
                      }`}
                    >
                      <div className="text-lg sm:text-xl mb-1">{step.icon}</div>
                      <div className={`text-[10px] sm:text-xs font-medium truncate leading-tight ${
                        status === 'current'   ? 'text-white' :
                        status === 'completed' ? 'text-green-800 dark:text-green-200' :
                                                 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {step.title}
                      </div>
                      {pct !== null && status !== 'current' && (
                        <div className={`text-[9px] mt-0.5 font-semibold ${
                          status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {pct}%
                        </div>
                      )}

                      {/* Completed badge */}
                      {status === 'completed' && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Icon icon="check" className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                      {/* Active pulse */}
                      {status === 'current' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Core progress summary */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Core curriculum</span>
          <span className="text-xs font-semibold text-pink-500 dark:text-pink-400">{completedCore}/{CORE.length} done</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${corePct >= 100 ? 'bg-green-500' : 'bg-pink-500'}`}
            style={{ width: `${corePct}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
          60% completion per section counts as done
        </p>
      </div>
    </div>
  );
};

export default MiniLearningPath;
