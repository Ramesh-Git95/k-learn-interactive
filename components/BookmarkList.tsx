import React, { useMemo, useState } from 'react';
import { Check, Volume2, X } from 'lucide-react';
import { accentFor } from '../utils/moduleAccent';
import { findDeckWithWord, unsavedWords } from '../utils/srsLookup';
import { useSRSContext } from '../contexts/SRSContext';
import { useToastContext } from '../contexts/ToastContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useAuth } from '../contexts/AuthContext';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import { vocabulary } from '../data/koreanData';
import type { Bookmark, PhraseItem, Section } from '../types';

const ACC = accentFor('bookmarks');

const DECK_NAME = 'Bookmarked Words';

const railCard =
  'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

const isPhrase = (b: Bookmark): b is PhraseItem => 'context' in b;

// Vocabulary items do not all carry their category, so fall back to the list
// they came from. This is the only "where from" the app actually records —
// there is no source or timestamp stored on a bookmark.
const CATEGORY_OF = new Map<string, string>();
vocabulary.forEach(cat => cat.items.forEach(i => CATEGORY_OF.set(i.korean, cat.name)));

const originOf = (b: Bookmark): string =>
  isPhrase(b) ? b.context : (b.category ?? CATEGORY_OF.get(b.korean) ?? 'Vocabulary');

interface Props {
  bookmarks: Bookmark[];
  toggleBookmark: (item: Bookmark) => void;
  setActiveSection?: (s: Section) => void;
}

type Filter = 'all' | 'words' | 'phrases';

const BookmarkList: React.FC<Props> = ({ bookmarks, toggleBookmark, setActiveSection }) => {
  const { decks, actions: srsActions } = useSRSContext();
  const { showToast } = useToastContext();
  const { isAuthenticated } = useAuth();
  const { limits, isPremium } = useFeatureAccess();
  const [filter, setFilter] = useState<Filter>('all');
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set());

  const words = useMemo(() => bookmarks.filter(b => !isPhrase(b)), [bookmarks]);
  const phrases = useMemo(() => bookmarks.filter(isPhrase), [bookmarks]);

  const newOnes = useMemo(
    () => unsavedWords(decks, bookmarks).filter(b => !justSaved.has(b.korean)),
    [decks, bookmarks, justSaved],
  );

  const origins = useMemo(() => {
    const tally = new Map<string, number>();
    bookmarks.forEach(b => {
      const k = originOf(b);
      tally.set(k, (tally.get(k) ?? 0) + 1);
    });
    return [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [bookmarks]);

  const speak = (korean: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // avoid queueing overlapping audio on rapid clicks
    const u = new SpeechSynthesisUtterance(korean);
    u.lang = 'ko-KR';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  };

  const addToReview = (items: Bookmark[]) => {
    if (!items.length) return;
    const existing = decks.find(d => d.name === DECK_NAME);
    const deckId = existing ? existing.id : srsActions.createDeck(DECK_NAME, 'Words and phrases you bookmarked');
    const already = new Set((existing?.cards ?? []).map(c => c.content.korean));

    let added = 0;
    items.forEach(b => {
      if (already.has(b.korean)) return;
      srsActions.addCardToDeck(deckId, {
        korean: b.korean,
        romanization: b.romanization,
        english: b.english,
        type: 'vocabulary',
        category: `Bookmark: ${originOf(b)}`,
      });
      added++;
    });

    setJustSaved(prev => {
      const next = new Set(prev);
      items.forEach(b => next.add(b.korean));
      return next;
    });
    earnXP(3);
    markStudyToday();
    const skipped = items.length - added;
    showToast(
      added === 0
        ? `Already in ${DECK_NAME}`
        : `${added} added to ${DECK_NAME}${skipped ? ` · ${skipped} already there` : ''}`,
      'success',
    );
  };

  const copyAsList = async () => {
    const text = bookmarks.map(b => `${b.korean} — ${b.romanization} — ${b.english}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${bookmarks.length} copied to your clipboard`, 'success');
    } catch {
      showToast('Your browser would not let the page copy that.', 'error');
    }
  };

  // ── Empty ──
  if (bookmarks.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
          <div className="mb-2 flex items-center gap-2 text-[12.5px]">
            <span className="font-medium text-[#4A5566] dark:text-gray-400">Practice</span>
            <span className="text-[#4A5566] dark:text-gray-600">/</span>
            <span className="font-semibold" style={{ color: ACC.light }}>Bookmarks</span>
          </div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            Nothing saved yet
          </h1>
        </div>
        <div className="kl-card p-6">
          <p className="max-w-[60ch] text-[14.5px] leading-[1.6] text-[#3E4A5A] dark:text-gray-400">
            The heart on any word or phrase saves it here. It is the quick pile — things you want to
            come back to before deciding whether they are worth reviewing properly.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveSection?.('vocabulary')}
              className="flex h-11 items-center rounded-[10px] px-5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
            >
              Open vocabulary →
            </button>
            <button
              onClick={() => setActiveSection?.('phrases')}
              className="flex h-11 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[14px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
            >
              Open phrases
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Row: React.FC<{ item: Bookmark }> = ({ item }) => {
    const savedIn = findDeckWithWord(decks, item.korean);
    const saved = !!savedIn || justSaved.has(item.korean);
    return (
      <div className="flex items-center gap-3 border-b border-[rgba(20,32,47,0.08)] px-5 py-3.5 last:border-0 dark:border-gray-800">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <span className="font-korean text-[17px] font-semibold text-[#16202F] dark:text-white">
              {item.korean}
            </span>
            <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">{item.romanization}</span>
          </div>
          <div className="mt-0.5 text-[13.5px] text-[#3E4A5A] dark:text-gray-400">
            {item.english}
            <span className="text-[#8A93A0] dark:text-gray-600"> · {originOf(item)}</span>
          </div>
        </div>

        <div className="flex flex-none items-center gap-2">
          {saved ? (
            <button
              onClick={() => setActiveSection?.('srs')}
              className="flex h-9 items-center gap-1.5 rounded-[9px] px-3 text-[12.5px] font-semibold"
              style={{ background: `${ACC.light}1A`, color: ACC.light }}
              title={savedIn ? `In "${savedIn.name}"` : 'In your review deck'}
            >
              <Check className="h-3.5 w-3.5" /> Practise
            </button>
          ) : (
            <button
              onClick={() => addToReview([item])}
              disabled={!isAuthenticated}
              className="flex h-9 items-center rounded-[9px] border border-[rgba(20,32,47,0.2)] px-3 text-[12.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] disabled:opacity-50 dark:border-gray-700 dark:text-gray-200"
            >
              Add to review
            </button>
          )}
          <button
            onClick={() => speak(item.korean)}
            aria-label={`Pronounce ${item.korean}`}
            className="flex h-9 w-9 items-center justify-center rounded-[9px] text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-500 dark:hover:text-gray-300"
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => toggleBookmark(item)}
            aria-label={`Remove ${item.korean} from bookmarks`}
            title="Remove from bookmarks"
            className="flex h-9 w-9 items-center justify-center rounded-[9px] text-[#4A5566] transition-colors hover:text-[#C13F22] dark:text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const showWords = filter === 'all' || filter === 'words';
  const showPhrases = filter === 'all' || filter === 'phrases';

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[12.5px]">
            <span className="font-medium text-[#4A5566] dark:text-gray-400">Practice</span>
            <span className="text-[#4A5566] dark:text-gray-600">/</span>
            <span className="font-semibold" style={{ color: ACC.light }}>Bookmarks</span>
          </div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            {bookmarks.length} saved item{bookmarks.length === 1 ? '' : 's'}
          </h1>
          {!isPremium && Number.isFinite(limits.bookmarksLimit) && (
            <p className="mt-1 text-[13px] text-[#4A5566] dark:text-gray-500">
              {bookmarks.length} of {limits.bookmarksLimit} on the free plan.
            </p>
          )}
        </div>

        <div className="flex flex-none flex-wrap items-center gap-2">
          {([
            ['all', `All ${bookmarks.length}`],
            ['words', `Words ${words.length}`],
            ['phrases', `Phrases ${phrases.length}`],
          ] as [Filter, string][]).map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex h-9 shrink-0 items-center rounded-[9px] px-3.5 text-[12.5px] font-semibold leading-none transition-colors ${
                filter === f
                  ? 'text-white'
                  : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
              }`}
              style={filter === f ? { background: ACC.light } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="order-1 w-full min-w-0 flex-1">
          {showWords && words.length > 0 && (
            <div className="kl-card mb-4 overflow-hidden">
              <div className="border-b border-[rgba(20,32,47,0.12)] px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#4A5566] dark:border-gray-800 dark:text-gray-500">
                Words · {words.length}
              </div>
              {words.map(w => <Row key={w.korean} item={w} />)}
            </div>
          )}

          {showPhrases && phrases.length > 0 && (
            <div className="kl-card overflow-hidden">
              <div className="border-b border-[rgba(20,32,47,0.12)] px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#4A5566] dark:border-gray-800 dark:text-gray-500">
                Phrases · {phrases.length}
              </div>
              {phrases.map(p => <Row key={p.korean} item={p} />)}
            </div>
          )}

          {((filter === 'words' && words.length === 0) || (filter === 'phrases' && phrases.length === 0)) && (
            <div className="kl-card p-8 text-center text-[13.5px] text-[#4A5566] dark:text-gray-500">
              Nothing saved in this group yet.
            </div>
          )}
        </div>

        {/* ── Rail ── */}
        <div className="order-2 w-full flex-none lg:w-[290px]">
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-1 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
              Do something with these
            </div>
            <p className="mb-3.5 text-[12px] leading-[1.5] text-[#4A5566] dark:text-gray-500">
              A bookmark on its own does not come back to you. Spaced repetition does.
            </p>
            <button
              onClick={() => addToReview(newOnes)}
              disabled={newOnes.length === 0 || !isAuthenticated}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[9px] text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: ACC.light }}
            >
              {newOnes.length === 0
                ? <><Check className="h-4 w-4" /> All {bookmarks.length} in review</>
                : `Send ${newOnes.length} to review`}
            </button>
            <button
              onClick={copyAsList}
              className="mt-2.5 flex h-11 w-full items-center justify-center rounded-[9px] border border-[rgba(20,32,47,0.2)] text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
            >
              Copy as a list
            </button>
          </div>

          {origins.length > 0 && (
            <div className={`${railCard} mb-3.5`}>
              <div className="mb-1 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
                What they are about
              </div>
              <p className="mb-3 text-[12px] text-[#4A5566] dark:text-gray-500">
                By the topic each one belongs to.
              </p>
              <div className="flex flex-col gap-2.5 text-[13.5px] text-[#4A5566] dark:text-gray-400">
                {origins.map(([name, n]) => (
                  <div key={name} className="flex justify-between gap-2">
                    <span className="truncate">{name}</span>
                    <strong className="font-semibold text-[#16202F] dark:text-white">{n}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={railCard}>
            <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
              Bookmarks and review
            </div>
            <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
              Saving is for things you noticed. Reviewing is for things you intend to keep. Move the
              ones you actually want across, and let the rest sit here without guilt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookmarkList;
