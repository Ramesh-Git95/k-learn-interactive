import React, { useMemo, useEffect, useRef } from 'react';
import { vocabulary } from '../data/koreanData';
import VocabCard from './VocabCard';
import type { Bookmark, VocabCategory, VocabItem } from '../types';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useDailyActivity } from '../hooks/useDailyActivity';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { LockedCard, LockedRowBanner } from './PremiumLock';
import GuestSignUpGate from './GuestSignUpGate';

interface VocabularySectionProps {
  bookmarks: Bookmark[];
  toggleBookmark: (bookmark: Bookmark) => void;
  progress: { [key: string]: boolean };
  toggleProgress: (key: string) => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Greetings': '👋', 'Numbers': '🔢', 'Family': '👨‍👩‍👧', 'Food': '🍜', 'Colors': '🎨',
  'Time': '⏰', 'Travel': '✈️', 'Shopping': '🛍️', 'Weather': '🌤️', 'Body': '💪',
  'Business Korean': '💼', 'Advanced Vocabulary': '📚', 'Formal Language': '🎩', 'Professional Terms': '🏢',
};

const GUEST_FLIP_THRESHOLD = 3;

const VocabularySection: React.FC<VocabularySectionProps> = ({ bookmarks, toggleBookmark, progress, toggleProgress }) => {
  const { hasReachedLimit, getLimit, subscriptionTier } = useFeatureAccess();
  const { dailyActivity, trackActivity } = useDailyActivity();
  const { isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();
  const [guestFlipCount, setGuestFlipCount] = React.useState(0);
  const [gateKey, setGateKey] = React.useState(0);
  const allStudiedRetriggered = useRef(false);

  const isBookmarked = (item: VocabItem) => bookmarks.some(b => 'korean' in b && b.korean === item.korean);

  const markItemAsStudied = (item: VocabItem) => {
    const key = `vocab_item_${item.korean}`;
    if (!progress[key]) toggleProgress(key);
  };

  useEffect(() => {
    vocabulary.forEach(category => {
      const key = `vocab_${category.name}`;
      const studiedCount = category.items.filter(i => progress[`vocab_item_${i.korean}`]).length;
      if (studiedCount === category.items.length && category.items.length > 0 && !progress[key]) {
        toggleProgress(key);
      }
    });
  }, [progress, toggleProgress]);

  const FREE_CATEGORY_COUNT = 3;

  const displayVocabulary = useMemo((): VocabCategory[] => {
    if (subscriptionTier === 'free') return vocabulary.slice(0, FREE_CATEGORY_COUNT);
    return vocabulary;
  }, [subscriptionTier]);

  // Re-trigger gate once when guest has studied all free visible cards
  const GUEST_LIMIT_TOP = 5;
  const firstFreeItems = !isAuthenticated && displayVocabulary[0]
    ? displayVocabulary[0].items.slice(0, GUEST_LIMIT_TOP)
    : [];
  const allFreeStudied = firstFreeItems.length > 0 &&
    firstFreeItems.every(item => !!progress[`vocab_item_${item.korean}`]);

  useEffect(() => {
    if (allFreeStudied && !allStudiedRetriggered.current) {
      allStudiedRetriggered.current = true;
      setGateKey(k => k + 1);
    }
  }, [allFreeStudied]);

  const getCategoryProgress = (cat: VocabCategory) => {
    const studied = cat.items.filter(i => progress[`vocab_item_${i.korean}`]).length;
    return { studied, total: cat.items.length, percentage: cat.items.length > 0 ? (studied / cat.items.length) * 100 : 0 };
  };

  const currentVocabCount = dailyActivity.vocabularyStudied;
  const vocabLimit = getLimit('vocabularyStudyPerDay') as number;

  const markItemWithLimit = (item: VocabItem) => {
    if (subscriptionTier === 'free' && hasReachedLimit('vocabularyStudyPerDay', currentVocabCount)) return false;
    if (!isAuthenticated) setGuestFlipCount(c => c + 1);
    trackActivity('vocabulary', 1);
    markItemAsStudied(item);
    return true;
  };

  const totalStudied = vocabulary.reduce((acc, cat) => acc + cat.items.filter(i => progress[`vocab_item_${i.korean}`]).length, 0);
  const totalWords = vocabulary.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-8 p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 60%, #F59E0B 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {['안녕','사랑','감사','행복','韓','가나다'].map((w, i) => (
            <span key={i} className="absolute font-black text-white/10" style={{ fontSize: `${1.5 + (i % 3)}rem`, top: `${(i * 31) % 90}%`, left: `${(i * 41) % 88}%` }}>{w}</span>
          ))}
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">📖</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Essential Vocabulary</h1>
                <p className="text-purple-100 text-sm">필수 어휘 · {totalWords}+ words</p>
              </div>
            </div>
            <p className="text-white/80 text-sm max-w-lg">
              Flip cards to reveal translations. Your progress is tracked automatically — study at your own pace!
            </p>
          </div>
          <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[110px]">
            <div className="text-3xl font-black text-white">{totalStudied}</div>
            <div className="text-xs text-white/70">of {totalWords} studied</div>
            <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.round((totalStudied / totalWords) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Guest banner */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 rounded-2xl border border-pink-200 dark:border-pink-800/40 bg-pink-50 dark:bg-pink-900/10 flex items-start gap-3">
          <span className="text-2xl">👋</span>
          <div className="flex-1">
            <h3 className="font-bold text-pink-800 dark:text-pink-200 mb-0.5">Welcome, Korean learner!</h3>
            <p className="text-sm text-pink-600 dark:text-pink-300 mb-2">You're exploring as a guest. Flip any card and start learning — sign up to save progress!</p>
            <button onClick={openRegister} className="text-sm font-bold text-white px-4 py-1.5 rounded-xl transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}>
              Sign up free 🚀
            </button>
          </div>
        </div>
      )}

      {/* Daily limit bar for free users */}
      {subscriptionTier === 'free' && isAuthenticated && (
        <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Daily Study Limit</span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{currentVocabCount}/{vocabLimit} words</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((currentVocabCount / vocabLimit) * 100, 100)}%`,
                  background: currentVocabCount >= vocabLimit
                    ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                    : 'linear-gradient(90deg, #EC4899, #8B5CF6)',
                }}
              />
            </div>
          </div>
          {currentVocabCount >= vocabLimit && (
            <span className="text-xs font-bold text-red-500 flex-shrink-0">Limit reached</span>
          )}
        </div>
      )}

      {/* Category sections */}
      {displayVocabulary.length > 0 ? (
        <div>
          {displayVocabulary.map((category) => {
            const catProgress = getCategoryProgress(category);
            const isCompleted = progress[`vocab_${category.name}`];
            const limitReached = subscriptionTier === 'free' && hasReachedLimit('vocabularyStudyPerDay', currentVocabCount);
            const emoji = CATEGORY_EMOJIS[category.name] || '📝';

            return (
              <div key={category.name} className="mb-12">
                {/* Category header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">{category.name}</h2>
                        {isCompleted && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            ✓ Complete
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${catProgress.percentage}%`,
                              background: isCompleted
                                ? 'linear-gradient(90deg, #22C55E, #059669)'
                                : 'linear-gradient(90deg, #EC4899, #8B5CF6)',
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {catProgress.studied}/{catProgress.total}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleProgress(`vocab_${category.name}`)}
                    className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-200 ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : catProgress.percentage === 100
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white border border-green-200 dark:border-green-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {isCompleted ? '✓ Completed' : 'Mark Complete'}
                  </button>
                </div>

                {/* Cards grid */}
                {(() => {
                  const GUEST_LIMIT = 5;
                  const isFirstCategory = displayVocabulary.indexOf(category) === 0;
                  const isGuestFirstCategory = !isAuthenticated && isFirstCategory;
                  const visibleItems = isGuestFirstCategory ? category.items.slice(0, GUEST_LIMIT) : category.items;
                  const showGate = isGuestFirstCategory && (guestFlipCount >= GUEST_FLIP_THRESHOLD || allFreeStudied) && category.items.length > GUEST_LIMIT;

                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {visibleItems.map((item) => (
                          <VocabCard
                            key={item.korean}
                            item={item}
                            isBookmarked={isBookmarked(item)}
                            toggleBookmark={toggleBookmark}
                            onStudy={() => markItemWithLimit(item)}
                            isStudied={!!progress[`vocab_item_${item.korean}`]}
                            disabled={limitReached}
                          />
                        ))}
                      </div>
                      {showGate && (
                        <GuestSignUpGate
                          key={gateKey}
                          visibleCount={GUEST_LIMIT}
                          totalCount={category.items.length}
                          type="cards"
                          allUsed={allFreeStudied}
                        />
                      )}
                    </>
                  );
                })()}
              </div>
            );
          })}

          {/* Locked categories — shown to free users below the 3 free ones */}
          {subscriptionTier === 'free' && vocabulary.length > FREE_CATEGORY_COUNT && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {vocabulary.slice(FREE_CATEGORY_COUNT).map(cat => (
                  <LockedCard
                    key={cat.name}
                    emoji={CATEGORY_EMOJIS[cat.name] || '📝'}
                    label={cat.name}
                    sublabel={`${cat.items.length} words`}
                  />
                ))}
              </div>
              <LockedRowBanner
                count={vocabulary.slice(FREE_CATEGORY_COUNT).reduce((a, c) => a + c.items.length, 0)}
                label="more words"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg text-gray-500 dark:text-gray-400">No vocabulary categories available.</p>
        </div>
      )}
    </div>
  );
};

export default VocabularySection;
