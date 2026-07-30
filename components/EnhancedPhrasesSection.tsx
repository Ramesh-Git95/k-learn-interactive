import React, { useMemo, useState } from 'react';
import { Heart, Check, Circle, Lock } from 'lucide-react';
import { commonPhrases } from '../data/koreanData';
import { phraseNoteFor, WORD_FREQUENCY } from '../data/phraseNotes';
import type { Bookmark, PhraseItem, Section } from '../types';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useDailyActivity } from '../hooks/useDailyActivity';
import { LockedRowBanner } from './PremiumLock';
import SoftNudge from './SoftNudge';
import SoundItOutModal from './SoundItOutModal';
import PronunciationButton from './PronunciationButton';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';
import { FREE_PHRASES_COUNT } from '../constants';
import { accentFor } from '../utils/moduleAccent';

// Phrases, one at a time, with its set beside it.
//
// This used to be a flat list of sixteen rows, every phrase equally loud and
// nothing explaining how any of them were built. It is now mockup 2d's shape:
// the set lives in a column on the left so you can see where this phrase sits
// without leaving the page, and the phrase itself owns the middle — said, heard,
// and then taken apart word by word.
//
// The word-by-word notes live in data/phraseNotes.ts. They also make a pattern
// visible that the flat list hid completely: 주세요 appears in six of these
// phrases, so learning it once unlocks all six.

const ACC = accentFor('phrases');

interface Props {
  bookmarks: Bookmark[];
  toggleBookmark: (bookmark: Bookmark) => void;
  progress: { [key: string]: boolean };
  toggleProgress: (key: string) => void;
  setActiveSection?: (section: Section) => void;
}

const EnhancedPhrasesSection: React.FC<Props> = ({
  bookmarks, toggleBookmark, progress, toggleProgress, setActiveSection,
}) => {
  const { hasReachedLimit, getLimit, subscriptionTier } = useFeatureAccess();
  const { dailyActivity, trackActivity } = useDailyActivity();
  const { openUpgradeModal } = useUpgradeModal();
  const [soundOut, setSoundOut] = useState<PhraseItem | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  // Which topics are open. Derived default (only the current topic) rather than
  // seeded state, so it follows the phrase you are on instead of a stale mount
  // snapshot. An explicit tap always wins.
  const [groupOverrides, setGroupOverrides] = useState<Record<string, boolean>>({});

  const isBookmarked = (item: PhraseItem) => bookmarks.some(b => 'korean' in b && b.korean === item.korean);
  const isPhraseStudied = (i: number) => !!progress[`phrase_${i}`];
  const origIndex = (p: PhraseItem) => commonPhrases.findIndex(x => x.korean === p.korean);

  const visible = useMemo(
    () => (subscriptionTier === 'free' ? commonPhrases.slice(0, FREE_PHRASES_COUNT) : commonPhrases),
    [subscriptionTier],
  );

  const phrasesLimit = getLimit('phrasesStudyPerDay') as number;
  const currentCount = dailyActivity.phrasesStudied;
  const limitReached = subscriptionTier === 'free' && hasReachedLimit('phrasesStudyPerDay', currentCount);

  const handlePhraseStudied = (i: number) => {
    const already = isPhraseStudied(i);
    if (subscriptionTier === 'free' && !already) {
      if (hasReachedLimit('phrasesStudyPerDay', dailyActivity.phrasesStudied)) return false;
      trackActivity('phrases', 1);
    }
    toggleProgress(`phrase_${i}`);
    return true;
  };

  // Open on the first phrase not yet studied — the page starts where the work is.
  const frontier = visible.find(p => !isPhraseStudied(origIndex(p))) ?? visible[0];
  const phrase = visible.find(p => p.korean === picked) ?? frontier;

  const studiedCount = visible.filter(p => isPhraseStudied(origIndex(p))).length;

  // The set this phrase belongs to — our `context` field is exactly that.
  const set = visible.filter(p => p.context === phrase?.context);
  const setPosition = set.findIndex(p => p.korean === phrase?.korean) + 1;

  const note = phrase ? phraseNoteFor(phrase.korean) : null;
  const studied = phrase ? isPhraseStudied(origIndex(phrase)) : false;
  const blocked = limitReached && !studied;

  // Groups for the left column, in data order.
  const groups = useMemo(() => {
    const out: { context: string; items: PhraseItem[] }[] = [];
    visible.forEach(p => {
      const g = out.find(x => x.context === p.context);
      if (g) g.items.push(p);
      else out.push({ context: p.context, items: [p] });
    });
    return out;
  }, [visible]);

  // A topic is open if it holds the phrase you are reading, unless you say otherwise.
  const isGroupOpen = (context: string) => groupOverrides[context] ?? (context === phrase?.context);

  const hangulStudied = Object.keys(progress).filter(k => k.startsWith('hangul_char_') && progress[k]).length;

  if (!phrase) {
    return (
      <div className="mx-auto max-w-6xl py-16 text-center">
        <p className="text-[15px] text-[#4A5566] dark:text-gray-400">No phrases available.</p>
      </div>
    );
  }

  const nextPhrase = (() => {
    const i = visible.findIndex(p => p.korean === phrase.korean);
    return i >= 0 && i < visible.length - 1 ? visible[i + 1] : null;
  })();

  return (
    <div className="mx-auto max-w-6xl">
      {soundOut && (
        <SoundItOutModal
          korean={soundOut.korean}
          english={soundOut.english}
          romanization={soundOut.romanization}
          onClose={() => setSoundOut(null)}
        />
      )}

      {hangulStudied < 10 && (
        <SoftNudge
          id="hangul-first-phrases"
          className="mb-5"
          text={<>Most learners do <strong>Hangul basics first</strong> (~30 min) — the romanization here helps, but reading the real Korean is the goal.</>}
          actionLabel="Start Hangul →"
          actionSection="hangul"
        />
      )}

      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
          {phrase.context}
          <span className="text-[#4A5566] dark:text-gray-500"> · phrase {setPosition} of {set.length}</span>
        </h1>
        {/* The tutor hand-off lives once, at the foot of the phrase — the point
            where you have actually read it and might want to try saying it. */}
        <div className="flex flex-none items-center gap-3.5">
          <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">
            {studiedCount} of {visible.length} studied
          </span>
        </div>
      </div>

      {/* ── Daily limit ── */}
      {subscriptionTier === 'free' && (
        <div className="mb-5 flex items-center gap-4">
          <span className="flex-none text-[12.5px] font-medium text-[#4A5566] dark:text-gray-400">Today</span>
          <div className="h-1.5 max-w-xs flex-1 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${Math.min((currentCount / phrasesLimit) * 100, 100)}%`, background: limitReached ? '#C13F22' : ACC.light }} />
          </div>
          <span className="flex-none whitespace-nowrap text-[12.5px] text-[#4A5566] dark:text-gray-500">
            {currentCount}/{phrasesLimit} phrases
            {limitReached && <span className="ml-2 font-semibold text-[#C13F22] dark:text-[#F07A55]">limit reached</span>}
          </span>
        </div>
      )}

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        {/* ── The set, in a column. Second on mobile: the phrase you came to
               read should not sit below a list you have to scroll past. ── */}
        <div className="order-2 w-full flex-none lg:order-1 lg:w-[250px]">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-[#4A5566] dark:text-gray-400">ALL PHRASES</span>
            <button
              onClick={() => {
                const anyOpen = groups.some(g => isGroupOpen(g.context));
                const next: Record<string, boolean> = {};
                groups.forEach(g => { next[g.context] = !anyOpen; });
                setGroupOverrides(next);
              }}
              className="text-[12px] font-semibold text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-500 dark:hover:text-gray-300"
            >
              {groups.some(g => isGroupOpen(g.context)) ? 'Collapse all' : 'Expand all'}
            </button>
          </div>

          <div className="flex flex-col gap-1 lg:max-h-[560px] lg:overflow-y-auto">
            {groups.map(group => {
              const open = isGroupOpen(group.context);
              const hasCurrent = group.context === phrase.context;
              const doneInGroup = group.items.filter(p => isPhraseStudied(origIndex(p))).length;
              return (
                <div key={group.context}>
                  {/* Topic header — the thing you scan for */}
                  <button
                    onClick={() => setGroupOverrides(o => ({ ...o, [group.context]: !open }))}
                    className={`flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left transition-colors ${
                      hasCurrent ? '' : 'hover:bg-[rgba(20,32,47,0.04)] dark:hover:bg-white/5'
                    }`}
                    style={hasCurrent ? { background: `${ACC.light}14` } : undefined}
                    aria-expanded={open}
                  >
                    {hasCurrent && (
                      <span className="kl-pulse h-1.5 w-1.5 flex-none rounded-full" style={{ background: ACC.light }} />
                    )}
                    <span
                      className="min-w-0 flex-1 truncate text-[13px] font-semibold"
                      style={{ color: hasCurrent ? ACC.light : undefined }}
                    >
                      <span className={hasCurrent ? '' : 'text-[#16202F] dark:text-gray-200'}>{group.context}</span>
                    </span>
                    <span className="flex-none text-[12px] text-[#4A5566] dark:text-gray-500">
                      {doneInGroup}/{group.items.length}
                    </span>
                    <span
                      className={`flex-none text-[10px] text-[#4A5566] transition-transform duration-200 dark:text-gray-500 ${
                        open ? 'rotate-90' : ''
                      }`}
                      aria-hidden="true"
                    >
                      ▶
                    </span>
                  </button>

                  {open && (
                    <div className="kl-drawer-panel mt-0.5 flex flex-col gap-0.5">
                      {group.items.map(p => {
                        const active = p.korean === phrase.korean;
                        const isDone = isPhraseStudied(origIndex(p));
                        return (
                          <button
                            key={p.korean}
                            onClick={() => setPicked(p.korean)}
                            className={`block w-full rounded-[10px] px-3 py-2.5 text-left transition-colors ${
                              active ? '' : 'hover:bg-[rgba(20,32,47,0.04)] dark:hover:bg-white/5'
                            }`}
                            style={active
                              ? { background: `${ACC.light}1A`, borderLeft: `3px solid ${ACC.light}`, paddingLeft: 9 }
                              : undefined}
                          >
                            <div className={`truncate font-korean text-[15px] ${
                              active ? 'font-bold text-[#16202F] dark:text-white'
                              : isDone ? 'font-medium text-[#16202F]/60 dark:text-gray-500'
                              : 'font-medium text-[#16202F] dark:text-gray-200'
                            }`}>
                              {p.korean}
                            </div>
                            <div className="mt-0.5 truncate text-[12.5px] text-[#4A5566] dark:text-gray-500">
                              {p.english}{isDone && ' · learned'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Locked phrases */}
          {subscriptionTier === 'free' && commonPhrases.length > visible.length && (
            <div className="mt-4 space-y-2.5">
              {commonPhrases.slice(visible.length, visible.length + 3).map(p => (
                <button
                  key={p.korean}
                  onClick={openUpgradeModal}
                  className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-dashed border-[rgba(20,32,47,0.2)] px-3 py-2.5 text-left transition-colors hover:border-[rgba(20,32,47,0.35)] dark:border-gray-700"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-korean text-[14px] font-medium text-[#4A5566] dark:text-gray-500">{p.korean}</span>
                    <span className="block truncate text-[12px] text-[#4A5566]/70 dark:text-gray-600">{p.english}</span>
                  </span>
                  <Lock className="h-3.5 w-3.5 flex-none text-[#4A5566] dark:text-gray-500" />
                </button>
              ))}
              <LockedRowBanner
                count={commonPhrases.length - visible.length}
                label="phrases"
                singularLabel="phrase"
              />
            </div>
          )}
        </div>

        {/* ── The phrase — first on mobile, right-hand column on desktop ── */}
        <div className="order-1 w-full min-w-0 flex-1 lg:order-2">
          <div
            className="mb-4 flex items-start gap-3 rounded-r-lg border-l-[3px] px-4 py-3 sm:items-center"
            style={{ borderColor: ACC.light, background: `${ACC.light}14` }}
          >
            <span className="kl-accent flex-none whitespace-nowrap text-[12.5px] font-semibold"
                  style={{ ['--kl-acc' as string]: ACC.light, ['--kl-acc-dk' as string]: ACC.dark }}>
              DO THIS NEXT
            </span>
            <span className="text-[13.5px] leading-snug text-[#16202F] dark:text-gray-200">
              Listen once, say it out loud, then check the breakdown below.
            </span>
          </div>

          {/* The phrase itself */}
          <div
            className="relative rounded-[18px] border border-[rgba(20,32,47,0.14)] p-6 shadow-[0_12px_34px_rgba(20,32,47,0.09)] sm:p-8 dark:border-gray-800"
            style={{ background: `linear-gradient(150deg, ${ACC.light}0F, ${ACC.light}1F)` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-[13px] font-semibold" style={{ color: ACC.light }}>
                {note?.when ?? phrase.context.toUpperCase()}
              </div>
              <div className="flex flex-none items-center gap-1">
                <button
                  onClick={() => toggleBookmark(phrase)}
                  className="rounded-lg p-1.5 transition-colors"
                  title={isBookmarked(phrase) ? 'Saved — tap to remove' : 'Save this phrase'}
                  aria-label={isBookmarked(phrase) ? 'Remove bookmark' : 'Add bookmark'}
                >
                  <Heart
                    className={`h-[18px] w-[18px] ${isBookmarked(phrase) ? '' : 'text-[#4A5566] dark:text-gray-500'}`}
                    style={isBookmarked(phrase) ? { color: '#C13F22' } : undefined}
                    fill={isBookmarked(phrase) ? '#C13F22' : 'none'}
                  />
                </button>
                <button
                  onClick={() => { if (!blocked) handlePhraseStudied(origIndex(phrase)); }}
                  disabled={blocked}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold transition-colors disabled:opacity-40"
                  style={{ color: studied ? ACC.light : '#4A5566' }}
                  title={blocked ? 'Daily limit reached' : studied ? 'Mark as not studied' : 'Mark as studied'}
                >
                  {studied ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  {studied ? 'studied' : 'mark studied'}
                </button>
              </div>
            </div>

            <div className="mt-3.5 break-words font-korean text-[32px] font-bold leading-[1.25] text-[#16202F] sm:text-[42px] dark:text-white">
              {phrase.korean}
            </div>
            <div className="mt-3 text-[16px] text-[#4A5566] dark:text-gray-400">{phrase.romanization}</div>
            <div className="mt-3.5 font-display text-[20px] font-semibold tracking-[-0.02em] text-[#16202F] sm:text-[24px] dark:text-white">
              {phrase.english}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSoundOut(phrase)}
                className="flex h-12 items-center gap-2.5 rounded-[10px] px-[22px] text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
                title="Sound it out — syllable by syllable"
              >
                <span className="flex h-3.5 items-end gap-[2.5px]" aria-hidden="true">
                  <span className="kl-bar w-[3px] bg-white" style={{ height: '100%' }} />
                  <span className="kl-bar w-[3px] bg-white" style={{ height: '100%', animationDelay: '0.15s' }} />
                  <span className="kl-bar w-[3px] bg-white" style={{ height: '100%', animationDelay: '0.3s' }} />
                </span>
                Hear it
              </button>
              <PronunciationButton korean={phrase.korean} romanization={phrase.romanization} size="sm" />
              <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">
                Played syllable by syllable.
              </span>
            </div>
          </div>

          {/* Word by word */}
          {note && (
            <>
              <div className="mb-2.5 mt-6 text-[14px] font-semibold text-[#16202F] dark:text-white">Word by word</div>
              <div className="overflow-hidden rounded-xl border border-[rgba(20,32,47,0.12)] bg-[#FFFCF4] dark:border-gray-800 dark:bg-gray-900">
                <div className="hidden bg-[rgba(20,32,47,0.045)] px-4 py-2.5 text-[12.5px] font-semibold text-[#4A5566] sm:grid sm:grid-cols-[150px_130px_1fr] dark:bg-white/5 dark:text-gray-400">
                  <span>KOREAN</span><span>SOUNDS LIKE</span><span>MEANS</span>
                </div>
                {note.words.map((w, i) => {
                  const seen = WORD_FREQUENCY[w.korean] ?? 0;
                  return (
                    <div
                      key={i}
                      className="grid items-center gap-1 border-t border-[rgba(20,32,47,0.10)] px-4 py-3 sm:grid-cols-[150px_130px_1fr] sm:gap-0 dark:border-gray-800"
                    >
                      <span className="font-korean text-[19px] font-bold text-[#16202F] dark:text-white">{w.korean}</span>
                      <span className="text-[13.5px] text-[#4A5566] dark:text-gray-400">{w.sounds}</span>
                      <span className="text-[14.5px] text-[#3E4A5A] dark:text-gray-300">
                        {w.means}
                        {seen > 1 && (
                          <span
                            className="ml-2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
                            style={{ background: `${ACC.light}1F`, color: ACC.light }}
                            title={`This piece appears in ${seen} of the phrases here`}
                          >
                            in {seen} phrases
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Move on */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {setActiveSection && (
              <button
                onClick={() => setActiveSection('conversation')}
                className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
              >
                Try it with the tutor
              </button>
            )}
            {nextPhrase && (
              <button
                onClick={() => setPicked(nextPhrase.korean)}
                className="ml-auto flex h-12 items-center gap-2.5 rounded-[10px] px-5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}52` }}
              >
                <span className="hidden sm:inline">Next phrase:</span>
                <span className="font-korean">{nextPhrase.korean}</span>
                →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPhrasesSection;
