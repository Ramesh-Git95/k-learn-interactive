import React, { useState } from 'react';
import type { Section } from '../types';
import { useXPStreak } from '../hooks/useXPStreak';
import { useSRSContext } from '../contexts/SRSContext';

interface FloatingProgressProps {
  activeSection: Section;
}

const LEVEL_NAMES = [
  '', 'Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate',
  'Upper-Int.', 'Advanced', 'Proficient', 'Expert', 'Master', 'Legend',
];

const FloatingProgress: React.FC<FloatingProgressProps> = ({ activeSection }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { level, xpInLevel, xpForLevel, totalXP, currentStreak, longestStreak, studiedToday, streakAtRisk, weekHeatmap } = useXPStreak();
  const { stats: srsStats } = useSRSContext();

  const ringPct = xpForLevel > 0 ? Math.min(xpInLevel / xpForLevel, 1) : 0;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - circumference * ringPct;

  const levelName = LEVEL_NAMES[level] ?? 'Legend';
  const xpToNext = xpForLevel - xpInLevel;

  if (activeSection === 'dashboard') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute bottom-20 right-0 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-5 w-72 animate-in slide-in-from-bottom-2 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Your Progress</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Level + XP bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-[#E4572E] dark:text-[#F07A55] uppercase tracking-wide">
                Level {level} · {levelName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{totalXP.toLocaleString()} XP total</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
              <div
                className="bg-[#E4572E] h-2 rounded-full transition-all duration-500"
                style={{ width: `${ringPct * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>{xpInLevel.toLocaleString()} / {xpForLevel.toLocaleString()} XP</span>
              <span>{xpToNext.toLocaleString()} to level {level + 1}</span>
            </div>
          </div>

          {/* Streak row */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{streakAtRisk ? '🔴' : studiedToday ? '🔥' : '💤'}</span>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">{currentStreak} day streak</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Best: {longestStreak} days</div>
              </div>
            </div>
            {srsStats.totalDue > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg px-2.5 py-1.5">
                <span className="text-sm">🗂️</span>
                <div>
                  <div className="text-sm font-bold text-amber-700 dark:text-amber-400">{srsStats.totalDue}</div>
                  <div className="text-xs text-amber-600 dark:text-amber-500">due</div>
                </div>
              </div>
            )}
          </div>

          {/* Week heatmap */}
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Last 7 days</div>
            <div className="flex gap-1.5">
              {weekHeatmap.map((day) => (
                <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full aspect-square rounded-sm ${
                    day.studied
                      ? 'bg-[#E4572E]'
                      : day.isToday
                        ? 'bg-gray-200 dark:bg-gray-700 ring-1 ring-[#F07A55]'
                        : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                  <span className="text-[9px] text-gray-400 dark:text-gray-500">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today studied dot */}
          {studiedToday && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Studied today — keep it up!
            </div>
          )}
          {streakAtRisk && !studiedToday && currentStreak > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-orange-500 dark:text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
              Study today to keep your streak!
            </div>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative bg-[#E4572E] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 w-14 h-14 ${
          isExpanded ? 'scale-110' : 'hover:scale-105'
        }`}
        aria-label="Learning progress"
      >
        {/* Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
          <circle
            cx="30" cy="30" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>

        {/* Level number */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full leading-none">
          <span className="text-[9px] font-semibold opacity-80">LVL</span>
          <span className="text-base font-black">{level}</span>
        </div>

        {/* SRS badge */}
        {srsStats.totalDue > 0 && !isExpanded && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-400 text-gray-900 text-[10px] font-black rounded-full flex items-center justify-center shadow">
            {srsStats.totalDue > 99 ? '99+' : srsStats.totalDue}
          </span>
        )}

        {/* Streak fire badge */}
        {currentStreak > 0 && !isExpanded && srsStats.totalDue === 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow">
            {currentStreak > 99 ? '🔥' : `🔥`}
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingProgress;
