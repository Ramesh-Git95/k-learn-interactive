import React, { useMemo, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { vocabulary } from '../data/koreanData';
import VocabStudyView from './VocabStudyView';
import Drawer from './Drawer';
import type { Bookmark, VocabCategory, VocabItem } from '../types';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useDailyActivity } from '../hooks/useDailyActivity';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { LockedCard, LockedRowBanner } from './PremiumLock';
import GuestSignUpGate from './GuestSignUpGate';
import { accentFor } from '../utils/moduleAccent';

// Vocabulary in two levels: choose a set, then study it.
//
// The mockup for this screen draws an SRS grading drill, which is what
// SRSStudySession already does — so the LAYOUT is adopted for studying a set
// (one word centre stage, the set's state in a 290px rail) while every function
// this section already had is kept: flip-to-study becomes reveal-to-study,
// and the three grading buttons become examples / add-to-deck / pronounce.

const ACC = accentFor('vocabulary');
const FREE_CATEGORY_COUNT = 3;
const GUEST_FLIP_THRESHOLD = 3;
const GUEST_LIMIT = 5;

interface VocabularySectionProps {
  bookmarks: Bookmark[];
  toggleBookmark: (bookmark: Bookmark) => void;
  progress: { [key: string]: boolean };
  toggleProgress: (key: string) => void;
}

const VocabularySection: React.FC<VocabularySectionProps> = ({ bookmarks, toggleBookmark, progress, toggleProgress }) => {
  const { hasReachedLimit, getLimit, subscriptionTier } = useFeatureAccess();
  const { dailyActivity, trackActivity } = useDailyActivity();
  const { isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();
  const [guestFlipCount, setGuestFlipCount] = useState(0);
  const [gateKey, setGateKey] = useState(0);
  const [openSet, setOpenSet] = useState<string | null>(null);
  const allStudiedRetriggered = useRef(false);

  const isBookmarked = (item: VocabItem) => bookmarks.some(b => 'korean' in b && b.korean === item.korean);
  const isStudied = (item: VocabItem) => !!progress[`vocab_item_${item.korean}`];

  const displayVocabulary = useMemo((): VocabCategory[] => {
    if (subscriptionTier === 'free') return vocabulary.slice(0, FREE_CATEGORY_COUNT);
    return vocabulary;
  }, [subscriptionTier]);

  // A set counts as complete once every word in it is studied.
  useEffect(() => {
    displayVocabulary.forEach(cat => {
      const key = `vocab_${cat.name}`;
      const studiedCount = cat.items.filter(i => progress[`vocab_item_${i.korean}`]).length;
      if (studiedCount === cat.items.length && cat.items.length > 0 && !progress[key]) {
        toggleProgress(key);
      }
    });
  }, [progress, toggleProgress, displayVocabulary]);

  const catProgress = (cat: VocabCategory) => {
    const studied = cat.items.filter(isStudied).length;
    return { studied, total: cat.items.length, percentage: cat.items.length ? (studied / cat.items.length) * 100 : 0 };
  };

  const category = displayVocabulary.find(c => c.name === openSet) ?? null;

  // Guests get a slice of the first set, then the sign-up gate.
  const isGuestFirstSet = !isAuthenticated && !!category && displayVocabulary.indexOf(category) === 0;
  const visibleItems = category
    ? (isGuestFirstSet ? category.items.slice(0, GUEST_LIMIT) : category.items)
    : [];
  const allFreeStudied = isGuestFirstSet && visibleItems.length > 0 && visibleItems.every(isStudied);

  useEffect(() => {
    if (allFreeStudied && !allStudiedRetriggered.current) {
      allStudiedRetriggered.current = true;
      setGateKey(k => k + 1);
    }
  }, [allFreeStudied]);

  const currentVocabCount = dailyActivity.vocabularyStudied;
  const vocabLimit = getLimit('vocabularyStudyPerDay') as number;
  const limitReached = subscriptionTier === 'free' && hasReachedLimit('vocabularyStudyPerDay', currentVocabCount);

  const markItemWithLimit = (item: VocabItem) => {
    if (limitReached) return false;
    if (!isAuthenticated) setGuestFlipCount(c => c + 1);
    else trackActivity('vocabulary', 1);
    const key = `vocab_item_${item.korean}`;
    if (!progress[key]) toggleProgress(key);
    return true;
  };

  const totalStudied = vocabulary.reduce((a, c) => a + c.items.filter(isStudied).length, 0);
  const totalWords = vocabulary.reduce((a, c) => a + c.items.length, 0);

  // ── Level 2: studying a set ───────────────────────────────────────────────
  if (category) {
    const showGate = isGuestFirstSet
      && (guestFlipCount >= GUEST_FLIP_THRESHOLD || allFreeStudied)
      && category.items.length > GUEST_LIMIT;

    return (
      <>
        <VocabStudyView
          category={category}
          items={visibleItems}
          isStudied={isStudied}
          isBookmarked={isBookmarked}
          toggleBookmark={toggleBookmark}
          onStudy={markItemWithLimit}
          limitReached={limitReached}
          isAuthenticated={isAuthenticated}
          onExit={() => setOpenSet(null)}
        />
        {showGate && (
          <div className="mx-auto mt-6 max-w-6xl">
            <GuestSignUpGate
              key={gateKey}
              visibleCount={GUEST_LIMIT}
              totalCount={category.items.length}
              type="cards"
              allUsed={allFreeStudied}
            />
          </div>
        )}
      </>
    );
  }

  // ── Level 1: choosing a set ───────────────────────────────────────────────
  const nextSet = displayVocabulary.find(c => catProgress(c).studied < c.items.length);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[34px] dark:text-white">
            Vocabulary
          </h1>
          <p className="mt-2 text-[15px] text-[#3E4A5A] dark:text-gray-400">
            Pick a set of words to study. Each one takes a few minutes.
          </p>
        </div>
        <div className="flex-none">
          <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
            {totalStudied} of {totalWords} words studied
          </div>
          <div className="h-1.5 w-[200px] overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${(totalStudied / totalWords) * 100}%`, background: ACC.light }} />
          </div>
        </div>
      </div>

      {/* DO THIS NEXT */}
      <div
        className="mb-5 flex items-start gap-3 rounded-r-lg border-l-[3px] px-4 py-3 sm:items-center"
        style={{ borderColor: ACC.light, background: `${ACC.light}14` }}
      >
        <span className="kl-accent flex-none whitespace-nowrap text-[12.5px] font-semibold"
              style={{ ['--kl-acc' as string]: ACC.light, ['--kl-acc-dk' as string]: ACC.dark }}>
          {limitReached ? 'LIMIT REACHED' : 'DO THIS NEXT'}
        </span>
        <span className="text-[13.5px] leading-snug text-[#16202F] dark:text-gray-200">
          {limitReached
            ? "You've hit today's free word limit. It resets tomorrow — or go Premium for 50 a day."
            : nextSet
            ? `Continue with ${nextSet.name} — ${nextSet.items.length - catProgress(nextSet).studied} of its ${nextSet.items.length} words left.`
            : 'Every set is finished. Add words to a deck so they keep coming back.'}
        </span>
      </div>

      {/* Guest welcome */}
      {!isAuthenticated && (
        <div className="kl-card mb-5 flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-[240px] flex-1">
            <h3 className="text-[15px] font-semibold text-[#16202F] dark:text-white">You're browsing as a guest</h3>
            <p className="mt-1 text-[13.5px] text-[#3E4A5A] dark:text-gray-400">
              Open any set and start learning. Sign up free to save your progress across devices.
            </p>
          </div>
          <button
            onClick={openRegister}
            className="flex h-11 flex-none items-center rounded-[10px] px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
          >
            Sign up free →
          </button>
        </div>
      )}

      {/* Daily limit */}
      {subscriptionTier === 'free' && isAuthenticated && (
        <div className="mb-5 flex items-center gap-4">
          <span className="flex-none text-[12.5px] font-medium text-[#4A5566] dark:text-gray-400">Today</span>
          <div className="h-1.5 max-w-xs flex-1 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${Math.min((currentVocabCount / vocabLimit) * 100, 100)}%`, background: limitReached ? '#C13F22' : ACC.light }} />
          </div>
          <span className="flex-none whitespace-nowrap text-[12.5px] text-[#4A5566] dark:text-gray-500">
            {currentVocabCount}/{vocabLimit} words
          </span>
        </div>
      )}

      {/* The sets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayVocabulary.map((cat, i) => {
          const p = catProgress(cat);
          const done = p.studied === p.total && p.total > 0;
          const started = p.studied > 0 && !done;
          // A real character from the set itself — no invented iconography.
          const glyph = cat.items[0]?.korean.charAt(0) ?? '한';

          return (
            <button
              key={cat.name}
              onClick={() => setOpenSet(cat.name)}
              className="kl-card kl-cascade group flex flex-col p-5 text-left transition-transform duration-200 hover:-translate-y-1"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl font-korean text-[26px] font-bold transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D`, color: ACC.light }}
                >
                  {glyph}
                </div>
                {done ? (
                  <span className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: ACC.light }}>
                    <Check className="h-3.5 w-3.5" /> complete
                  </span>
                ) : started ? (
                  <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#4A5566] dark:text-gray-400">
                    <span className="kl-pulse inline-block h-1.5 w-1.5 rounded-full" style={{ background: ACC.light }} />
                    in progress
                  </span>
                ) : null}
              </div>

              <div className="mt-4 text-[17px] font-semibold text-[#16202F] dark:text-white">{cat.name}</div>
              <div className="mt-1 text-[13px] text-[#4A5566] dark:text-gray-400">
                {cat.items.length} {cat.items.length === 1 ? 'word' : 'words'}
                {p.studied > 0 && ` · ${p.studied} studied`}
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
                <div className="h-full rounded-full transition-all duration-500"
                     style={{ width: `${p.percentage}%`, background: ACC.light }} />
              </div>

              <span
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
                style={{ color: ACC.light }}
              >
                {done ? 'Review this set' : started ? 'Continue' : 'Start'}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Locked sets */}
      {subscriptionTier === 'free' && vocabulary.length > FREE_CATEGORY_COUNT && (
        <div className="mt-6">
          <Drawer
            label="More word sets with Premium"
            meta={`${vocabulary.length - FREE_CATEGORY_COUNT} sets · ${vocabulary.slice(FREE_CATEGORY_COUNT).reduce((a, c) => a + c.items.length, 0)} words`}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {vocabulary.slice(FREE_CATEGORY_COUNT).map(cat => (
                  <LockedCard key={cat.name} label={cat.name} sublabel={`${cat.items.length} words`} />
                ))}
              </div>
              <LockedRowBanner
                count={vocabulary.slice(FREE_CATEGORY_COUNT).reduce((a, c) => a + c.items.length, 0)}
                label="words"
              />
            </div>
          </Drawer>
        </div>
      )}
    </div>
  );
};

export default VocabularySection;
