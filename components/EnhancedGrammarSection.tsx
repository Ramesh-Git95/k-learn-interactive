import React from 'react';
import { grammarPatterns } from '../data/koreanData';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PremiumLockBanner } from './PremiumLock';
import { useAuth } from '../contexts/AuthContext';
import GuestSignUpGate from './GuestSignUpGate';
import type { GrammarPattern } from '../types';

interface EnhancedGrammarSectionProps {
  progress: { [key: string]: boolean };
  toggleProgress: (key: string) => void;
}

const GUEST_PATTERN_LIMIT = 3;
const GUEST_MARK_THRESHOLD = 2;

interface PatternCardProps {
  pattern: GrammarPattern;
  index: number;
  done: boolean;
  onToggle: (i: number) => void;
  accentColor?: string;
  isAdvanced?: boolean;
}

const PatternCard: React.FC<PatternCardProps> = ({ pattern, index, done, onToggle, accentColor = '#EC4899', isAdvanced = false }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden ${
    done
      ? 'border-green-300 dark:border-green-700 ring-1 ring-green-300 dark:ring-green-700'
      : 'border-gray-100 dark:border-gray-800 hover:shadow-md'
  }`}>
    {/* Color accent bar */}
    <div className="h-1 w-full" style={{ background: done ? 'linear-gradient(90deg, #22C55E, #059669)' : `linear-gradient(90deg, ${accentColor}, #8B5CF6)` }} />

    <div className="p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="text-lg sm:text-xl font-black" style={{
              background: done ? 'linear-gradient(135deg,#22C55E,#059669)' : `linear-gradient(135deg, ${accentColor}, #8B5CF6)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {pattern.pattern}
            </h3>
            {isAdvanced && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
                ADVANCED
              </span>
            )}
            {done && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">✓ Done</span>}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{pattern.explanation}</p>
        </div>
        <button
          onClick={() => onToggle(index)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
            done
              ? 'bg-green-500 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {done ? '✓ Completed' : '📌 Mark Read'}
        </button>
      </div>

      {/* Examples */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Examples</p>
        <div className="space-y-2">
          {pattern.examples.map((ex, j) => (
            <div
              key={j}
              className="pl-3 border-l-2 py-1"
              style={{ borderColor: done ? '#22C55E' : accentColor }}
            >
              <p className="text-sm font-bold text-gray-900 dark:text-white">{ex.korean}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{ex.english}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const EnhancedGrammarSection: React.FC<EnhancedGrammarSectionProps> = ({ progress, toggleProgress }) => {
  const { canAccess } = useFeatureAccess();
  const { isAuthenticated } = useAuth();
  const [guestMarkCount, setGuestMarkCount] = React.useState(0);

  const isCompleted = (i: number) => !!progress[`grammar_pattern_${i}`];
  const toggle = (i: number) => {
    if (!isAuthenticated && !isCompleted(i)) setGuestMarkCount(c => c + 1);
    toggleProgress(`grammar_pattern_${i}`);
  };
  const completedCount = grammarPatterns.filter((_, i) => isCompleted(i)).length;
  const overallPct = Math.round((completedCount / grammarPatterns.length) * 100);

  const basicCount = Math.ceil(grammarPatterns.length * 0.6);
  const basicPatterns = grammarPatterns.slice(0, basicCount);
  const advancedPatterns = grammarPatterns.slice(basicCount);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-8 p-6 sm:p-8"
        style={{ background: 'var(--brand-gradient-hero-rev)' }}
      >
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {['은/는','이/가','을/를','에서','으로','하다'].map((w, i) => (
            <span key={i} className="absolute font-black text-white/10" style={{ fontSize: `${1.2 + (i % 3)}rem`, top: `${(i * 29) % 90}%`, left: `${(i * 43) % 85}%` }}>{w}</span>
          ))}
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">📝</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Grammar Patterns</h1>
                <p className="text-cyan-100 text-sm">기초 문법 · {grammarPatterns.length} patterns</p>
              </div>
            </div>
            <p className="text-white/80 text-sm max-w-lg">
              Learn the building blocks of Korean sentences. Mark patterns as you master them to track your progress.
            </p>
          </div>
          <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[120px]">
            <div className="text-3xl font-black text-white">{completedCount}/{grammarPatterns.length}</div>
            <div className="text-xs text-white/70 mb-2">patterns done</div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Basic Patterns */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white" style={{ background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)' }}>
            {basicPatterns.filter((_, i) => isCompleted(i)).length}/{basicPatterns.length}
          </div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">Basic Grammar <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">(Free)</span></h2>
        </div>
        <div className="space-y-4">
          {(isAuthenticated ? basicPatterns : basicPatterns.slice(0, GUEST_PATTERN_LIMIT)).map((pattern, i) => (
            <PatternCard key={pattern.pattern} pattern={pattern} index={i} done={isCompleted(i)} onToggle={toggle} accentColor="#EC4899" />
          ))}
        </div>
        {!isAuthenticated && guestMarkCount >= GUEST_MARK_THRESHOLD && basicPatterns.length > GUEST_PATTERN_LIMIT && (
          <GuestSignUpGate
            visibleCount={GUEST_PATTERN_LIMIT}
            totalCount={basicPatterns.length}
            type="patterns"
          />
        )}
      </div>

      {/* Advanced Patterns */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            ⭐
          </div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            Advanced Grammar
            {!canAccess('advancedGrammar') && (
              <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full text-white align-middle" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                PREMIUM
              </span>
            )}
          </h2>
        </div>

        {canAccess('advancedGrammar') ? (
          <div className="space-y-4">
            {advancedPatterns.map((pattern, i) => {
              const idx = basicCount + i;
              return (
                <PatternCard
                  key={pattern.pattern}
                  pattern={pattern}
                  index={idx}
                  done={isCompleted(idx)}
                  onToggle={toggle}
                  accentColor="#F59E0B"
                  isAdvanced
                />
              );
            })}
          </div>
        ) : (
          <PremiumLockBanner
            title="Advanced Grammar — Premium"
            description={`Unlock ${advancedPatterns.length} advanced patterns: conditionals, complex sentence structures, and formal speech levels.`}
          />
        )}
      </div>
    </div>
  );
};

export default EnhancedGrammarSection;
