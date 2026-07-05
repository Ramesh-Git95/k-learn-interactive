import React, { useMemo } from 'react';
import { commonPhrases } from '../data/koreanData';
import type { Bookmark, PhraseItem } from '../types';
import Tooltip from './Tooltip';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useDailyActivity } from '../hooks/useDailyActivity';
import { LockedRowBanner } from './PremiumLock';
import PronunciationButton from './PronunciationButton';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';
import { FREE_PHRASES_COUNT } from '../constants';

interface EnhancedPhrasesSectionProps {
  bookmarks: Bookmark[];
  toggleBookmark: (bookmark: Bookmark) => void;
  progress: { [key: string]: boolean };
  toggleProgress: (key: string) => void;
}

const CONTEXT_COLORS: Record<string, string> = {
  'Shopping':       '#10B981',
  'Restaurant':     '#F97316',
  'Directions':     '#6366F1',
  'Introductions':  '#EC4899',
  'General':        '#8B5CF6',
  'Communication':  '#06B6D4',
  'Feelings':       '#F59E0B',
  'Health':         '#3B82F6',
  'Emergency':      '#EF4444',
};

const EnhancedPhrasesSection: React.FC<EnhancedPhrasesSectionProps> = ({ bookmarks, toggleBookmark, progress, toggleProgress }) => {
  const { hasReachedLimit, getLimit, subscriptionTier } = useFeatureAccess();
  const { dailyActivity, trackActivity } = useDailyActivity();
  const { openUpgradeModal } = useUpgradeModal();

  const isBookmarked = (item: PhraseItem) => bookmarks.some(b => 'korean' in b && b.korean === item.korean);
  const isPhraseStudied = (i: number) => !!progress[`phrase_${i}`];

  const handlePhraseStudied = (i: number) => {
    const alreadyStudied = isPhraseStudied(i);
    if (subscriptionTier === 'free' && !alreadyStudied) {
      if (hasReachedLimit('phrasesStudyPerDay', dailyActivity.phrasesStudied)) return false;
      trackActivity('phrases', 1);
    }
    toggleProgress(`phrase_${i}`);
    return true;
  };

  const speak = (korean: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(korean);
      u.lang = 'ko-KR'; u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  const filteredPhrases = useMemo(() =>
    subscriptionTier === 'free' ? commonPhrases.slice(0, FREE_PHRASES_COUNT) : commonPhrases,
    [subscriptionTier]);

  const studiedCount = filteredPhrases.filter((_, i) => {
    const orig = commonPhrases.findIndex(p => p.korean === filteredPhrases[i].korean);
    return isPhraseStudied(orig);
  }).length;
  const overallPct = filteredPhrases.length > 0 ? Math.round((studiedCount / filteredPhrases.length) * 100) : 0;
  const phrasesLimit = getLimit('phrasesStudyPerDay') as number;
  const currentCount = dailyActivity.phrasesStudied;
  const limitReached = subscriptionTier === 'free' && hasReachedLimit('phrasesStudyPerDay', currentCount);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-8 p-6 sm:p-8"
        style={{ background: 'var(--brand-gradient-hero)' }}
      >
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {['안녕','감사합니다','실례합니다','괜찮아요'].map((w, i) => (
            <span key={i} className="absolute font-black text-white/10" style={{ fontSize: `${1.2 + (i % 2) * 0.6}rem`, top: `${(i * 37) % 85}%`, left: `${(i * 43) % 80}%` }}>{w}</span>
          ))}
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">💬</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Common Phrases</h1>
                <p className="text-pink-100 text-sm">일상 표현 · {filteredPhrases.length} phrases</p>
              </div>
            </div>
            <p className="text-white/80 text-sm max-w-lg">
              Master essential Korean phrases for everyday conversation. Tap 🔊 to hear pronunciation, ❤️ to bookmark, ✓ to mark as studied.
            </p>
          </div>
          <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[110px]">
            <div className="text-3xl font-black text-white">{studiedCount}/{filteredPhrases.length}</div>
            <div className="text-xs text-white/70 mb-2">studied</div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Daily limit bar */}
      {subscriptionTier === 'free' && (
        <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Daily Phrase Limit</span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{currentCount}/{phrasesLimit}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((currentCount / phrasesLimit) * 100, 100)}%`,
                  background: limitReached ? 'linear-gradient(90deg,#EF4444,#DC2626)' : 'var(--brand-gradient-h)',
                }}
              />
            </div>
          </div>
          {limitReached && <span className="text-xs font-bold text-red-500 flex-shrink-0">Limit reached</span>}
        </div>
      )}

      {/* Phrases list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {filteredPhrases.length > 0 ? (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {filteredPhrases.map((phrase) => {
              const origIdx = commonPhrases.findIndex(p => p.korean === phrase.korean);
              const studied = isPhraseStudied(origIdx);
              const isBlocked = limitReached && !studied;
              const ctxColor = CONTEXT_COLORS[phrase.context] || '#8B5CF6';

              return (
                <li
                  key={phrase.korean}
                  className={`p-4 sm:p-5 transition-all duration-200 ${studied ? 'bg-green-50/60 dark:bg-green-900/10' : 'hover:bg-gray-50/60 dark:hover:bg-gray-800/40'}`}
                >
                  {/* Left accent */}
                  <div className="flex gap-3">
                    <div className="w-1 rounded-full flex-shrink-0" style={{ background: studied ? '#22C55E' : ctxColor, minHeight: '100%' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-lg font-black text-gray-900 dark:text-white">{phrase.korean}</span>
                            {studied && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">✓ Studied</span>}
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 italic mb-1">{phrase.romanization}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{phrase.english}</p>
                          <span
                            className="inline-block mt-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
                            style={{ background: ctxColor }}
                          >
                            {phrase.context}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Tooltip content="Listen to Korean pronunciation" position="top" maxWidth="max-w-xs">
                            <button onClick={() => speak(phrase.korean)} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors text-base">
                              🔊
                            </button>
                          </Tooltip>
                          <PronunciationButton korean={phrase.korean} romanization={phrase.romanization} size="sm" />
                          <Tooltip content={isBookmarked(phrase) ? 'Remove bookmark' : 'Bookmark this phrase'} position="top" maxWidth="max-w-xs">
                            <button onClick={() => toggleBookmark(phrase)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors text-base ${isBookmarked(phrase) ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
                              {isBookmarked(phrase) ? '❤️' : '🤍'}
                            </button>
                          </Tooltip>
                          <Tooltip
                            content={isBlocked ? 'Daily limit reached — upgrade for unlimited!' : studied ? 'Mark as unlearned' : 'Mark as studied'}
                            position="top"
                            maxWidth="max-w-xs"
                          >
                            <button
                              onClick={() => { if (!isBlocked) handlePhraseStudied(origIdx); }}
                              disabled={isBlocked}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors text-base ${
                                isBlocked ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' :
                                studied ? 'text-green-500 bg-green-50 dark:bg-green-900/20' :
                                'text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                              }`}
                            >
                              {studied ? '✅' : '⭕'}
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500">No phrases available.</div>
        )}
      </div>

      {/* Locked premium phrases */}
      {subscriptionTier === 'free' && commonPhrases.length > filteredPhrases.length && (() => {
        const peek = commonPhrases.slice(filteredPhrases.length, filteredPhrases.length + 3);
        const gridCols = peek.length === 1 ? 'grid-cols-1' : peek.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3';
        return (
          <div className="mt-6 space-y-3">
            {/* Up to 3 peek phrases to trigger curiosity */}
            <div className={`grid ${gridCols} gap-3`}>
              {peek.map(phrase => (
                <div
                  key={phrase.korean}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                  onClick={openUpgradeModal}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 truncate">{phrase.korean}</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600 truncate">{phrase.english}</p>
                  </div>
                  <span className="text-sm ml-2 flex-shrink-0">🔒</span>
                </div>
              ))}
            </div>
            <LockedRowBanner
              count={commonPhrases.length - filteredPhrases.length}
              label="phrases"
              singularLabel="phrase"
            />
          </div>
        );
      })()}
    </div>
  );
};

export default EnhancedPhrasesSection;
