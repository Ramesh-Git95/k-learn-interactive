import React, { useState, useMemo } from 'react';
import { Check, Lock } from 'lucide-react';
import { isInAnyDeck, unsavedWords } from '../utils/srsLookup';
import { accentFor } from '../utils/moduleAccent';
import { dramas } from '../data/kdramaData';
import type { Drama, DramaWord } from '../data/kdramaData';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useToastContext } from '../contexts/ToastContext';
import { useSRSContext } from '../contexts/SRSContext';
import PronunciationButton from './PronunciationButton';
import SoundItOutModal from './SoundItOutModal';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import { useUpgrade } from '../hooks/useUpgrade';

const ACC = accentFor('kdrama');

const DECK_NAME = 'K-Drama Vocabulary';

type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

const DIFF_LABEL: Record<string, string> = {
  beginner: 'easy',
  intermediate: 'medium',
  advanced: 'hard',
};

// Every context line in the data is written as "한국어 문장. (English translation.)".
// Split it so the Korean can be set as a line to read and the English can sit
// under it as support, rather than both being crushed into one italic footnote.
function splitContext(context: string): { korean: string; english: string } {
  const m = context.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if (!m) return { korean: context.trim(), english: '' };
  return { korean: m[1].trim(), english: m[2].trim() };
}

// Where the headword sits inside its sentence, so it can be marked in place.
// Verbs and adjectives are listed in dictionary form (살아남다) but appear
// conjugated (살아남아야), so fall back to the stem before giving up.
//
// Returning null simply means no highlight, which is the right answer whenever
// the ending contracts too far to recognise (이기다 → 이길): a partial mark like
// "이" would teach a word boundary that does not exist. Six of the sixty land
// there, and the word is printed beside the sentence regardless.
function findHeadword(sentence: string, korean: string): [number, number] | null {
  const candidates = [korean];
  if (korean.endsWith('하다') && korean.length > 2) candidates.push(korean.slice(0, -2));
  if (korean.endsWith('다') && korean.length > 2) candidates.push(korean.slice(0, -1));
  for (const c of candidates) {
    if (!c) continue;
    const i = sentence.indexOf(c);
    if (i < 0) continue;
    // A one-syllable noun (돈, 칼, 꿈) is only itself when it starts a word —
    // otherwise it could be any syllable inside a longer one.
    if (c.length === 1 && i > 0 && sentence[i - 1] !== ' ') continue;
    return [i, i + c.length];
  }
  return null;
}

const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 0.8;
  window.speechSynthesis.speak(u);
};

const railCard =
  'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

// ── One word, presented as a line you could actually say ─────────────────────

interface LineProps {
  word: DramaWord;
  index: number;
  isSaved: boolean;
  isFirst: boolean;
  onAdd: () => void;
  onSoundOut: () => void;
}

const WordLine: React.FC<LineProps> = ({ word, index, isSaved, isFirst, onAdd, onSoundOut }) => {
  const { korean, english } = splitContext(word.context);
  const span = findHeadword(korean, word.korean);

  return (
    <div className="flex gap-4 border-b border-[rgba(20,32,47,0.10)] py-5 last:border-0 dark:border-gray-800">
      {/* Left gutter — the word itself, the way a script names its speaker */}
      <div className="w-[86px] flex-none pt-1 sm:w-[104px]">
        <div className="font-korean text-[17px] font-bold leading-tight text-[#16202F] dark:text-white">
          {word.korean}
        </div>
        <div className="mt-1 text-[11.5px] leading-tight text-[#4A5566] dark:text-gray-500">
          {word.romanization}
        </div>
        <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: ACC.light }}>
          {DIFF_LABEL[word.difficulty]}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-[#16202F] dark:text-gray-100">{word.english}</div>

        {/* The sentence, with the headword marked where it actually falls */}
        <div className="mt-2 font-korean text-[19px] leading-[1.7] text-[#16202F] sm:text-[21px] dark:text-white">
          {span ? (
            <>
              {korean.slice(0, span[0])}
              <mark
                className="rounded bg-transparent px-0.5 font-bold"
                style={{ background: `${ACC.light}26`, color: 'inherit' }}
              >
                {korean.slice(span[0], span[1])}
              </mark>
              {korean.slice(span[1])}
            </>
          ) : (
            korean
          )}
        </div>
        {english && (
          <div className="mt-1.5 text-[13.5px] text-[#4A5566] dark:text-gray-400">{english}</div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => speak(korean)}
            className="flex h-9 shrink-0 items-center gap-2 rounded-[9px] border border-[rgba(20,32,47,0.18)] px-3 text-[12.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
          >
            <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
              <span className="w-[2.5px] bg-current" style={{ height: '60%' }} />
              <span className="w-[2.5px] bg-current" style={{ height: '100%' }} />
              <span className="w-[2.5px] bg-current" style={{ height: '75%' }} />
            </span>
            Play line
          </button>
          <button
            onClick={onSoundOut}
            className="flex h-9 shrink-0 items-center rounded-[9px] border border-[rgba(20,32,47,0.18)] px-3 text-[12.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
            title="Sound it out — syllable by syllable"
          >
            Sound it out
          </button>
          <div className="shrink-0">
            <PronunciationButton
              korean={word.korean}
              romanization={word.romanization}
              size="sm"
              hintKey={isFirst ? 'kdrama' : undefined}
            />
          </div>
          {isSaved ? (
            <span
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] px-3 text-[12.5px] font-semibold"
              style={{ background: `${ACC.light}1A`, color: ACC.light }}
              title={`Already in "${DECK_NAME}"`}
            >
              <Check className="h-3.5 w-3.5" /> In your deck
            </span>
          ) : (
            <button
              onClick={onAdd}
              className="flex h-9 shrink-0 items-center rounded-[9px] px-3.5 text-[12.5px] font-semibold text-white transition-transform hover:scale-[1.03]"
              style={{ background: ACC.light }}
            >
              Add to deck
            </button>
          )}
          <span className="text-[11.5px] text-[#4A5566] dark:text-gray-600">#{index + 1}</span>
        </div>
      </div>
    </div>
  );
};

// ── One drama's word pack ─────────────────────────────────────────────────────

const DramaPack: React.FC<{ drama: Drama; onBack: () => void }> = ({ drama, onBack }) => {
  const { decks, actions: srsActions } = useSRSContext();
  const { showToast } = useToastContext();
  const [filter, setFilter] = useState<DifficultyFilter>('all');
  const [soundOut, setSoundOut] = useState<DramaWord | null>(null);
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set());

  const visible = filter === 'all' ? drama.words : drama.words.filter(w => w.difficulty === filter);

  const isSaved = (w: DramaWord) => justSaved.has(w.korean) || isInAnyDeck(decks, w.korean);

  // Only the words that would actually be written — so the bulk button never
  // offers work it will silently skip.
  const newWords = useMemo(
    () => unsavedWords(decks, drama.words).filter(w => !justSaved.has(w.korean)),
    [decks, drama.words, justSaved],
  );
  const savedCount = drama.words.length - newWords.length;

  const addWords = (words: DramaWord[]) => {
    if (!words.length) return;
    // Always the dedicated deck — never an arbitrary existing one, which would
    // dump K-drama words somewhere unrelated.
    const existing = decks.find(d => d.name === DECK_NAME);
    const deckId = existing
      ? existing.id
      : srsActions.createDeck(DECK_NAME, 'Words from your favourite K-dramas');
    const already = new Set((existing?.cards ?? []).map(c => c.content.korean));

    let added = 0;
    words.forEach(w => {
      if (already.has(w.korean)) return;
      srsActions.addCardToDeck(deckId, {
        korean: w.korean,
        romanization: w.romanization,
        english: w.english,
        type: 'vocabulary',
        category: `K-Drama: ${drama.titleEnglish}`,
      });
      added++;
    });

    setJustSaved(prev => {
      const next = new Set(prev);
      words.forEach(w => next.add(w.korean));
      return next;
    });
    earnXP(3);
    markStudyToday();
    const skipped = words.length - added;
    showToast(
      added === 0
        ? `Already in ${DECK_NAME}`
        : `${added} added to ${DECK_NAME}${skipped ? ` · ${skipped} already there` : ''}`,
      'success',
    );
  };

  const counts: Record<DifficultyFilter, number> = {
    all: drama.words.length,
    beginner: drama.words.filter(w => w.difficulty === 'beginner').length,
    intermediate: drama.words.filter(w => w.difficulty === 'intermediate').length,
    advanced: drama.words.filter(w => w.difficulty === 'advanced').length,
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[12.5px]">
            <button
              onClick={onBack}
              className="font-medium text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200"
            >
              K-Drama
            </button>
            <span className="text-[#4A5566] dark:text-gray-600">/</span>
            <span className="font-semibold" style={{ color: ACC.light }}>{drama.titleEnglish}</span>
          </div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            {drama.titleEnglish}
          </h1>
          <p className="mt-1 font-korean text-[15px] text-[#4A5566] dark:text-gray-400">
            {drama.title} · {drama.year}
          </p>
        </div>
        <div className="flex flex-none items-center gap-3.5">
          <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">
            {drama.words.length} words · one sentence each
          </span>
          <button
            onClick={onBack}
            className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
          >
            Change drama
          </button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        {/* ── The pack ── */}
        <div className="order-1 w-full min-w-0 flex-1">
          <div
            className="mb-4 flex items-start gap-3 rounded-r-lg border-l-[3px] px-4 py-3 sm:items-center"
            style={{ borderColor: ACC.light, background: `${ACC.light}14` }}
          >
            <span
              className="kl-accent flex-none whitespace-nowrap text-[12.5px] font-semibold"
              style={{ ['--kl-acc' as string]: ACC.light, ['--kl-acc-dk' as string]: ACC.dark }}
            >
              HOW TO USE THIS
            </span>
            <span className="text-[13.5px] leading-snug text-[#16202F] dark:text-gray-200">
              Say the whole sentence, not just the word. The highlighted part is the word you are
              learning — the rest is there to hold it up.
            </span>
          </div>

          {/* Difficulty filter */}
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12.5px] text-[#4A5566] dark:text-gray-500">Show:</span>
            {(['all', 'beginner', 'intermediate', 'advanced'] as DifficultyFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`inline-flex h-9 shrink-0 items-center rounded-[9px] px-3.5 text-[12.5px] font-semibold capitalize leading-none transition-colors ${
                  filter === f
                    ? 'text-white'
                    : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
                }`}
                style={filter === f ? { background: ACC.light } : undefined}
              >
                {f} ({counts[f]})
              </button>
            ))}
          </div>

          <div className="kl-card mt-4 px-5 py-1 sm:px-7">
            {visible.map((word, i) => (
              <WordLine
                key={word.korean}
                word={word}
                index={drama.words.indexOf(word)}
                isFirst={i === 0}
                isSaved={isSaved(word)}
                onAdd={() => addWords([word])}
                onSoundOut={() => setSoundOut(word)}
              />
            ))}

            {visible.length === 0 && (
              <div className="py-14 text-center text-[13.5px] text-[#4A5566] dark:text-gray-500">
                No words at that level in this pack.
              </div>
            )}
          </div>
        </div>

        {/* ── Rail ── */}
        <div className="order-2 w-full flex-none lg:w-[290px]">
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-1 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
              Words in this pack
            </div>
            <p className="mb-3.5 text-[12px] text-[#4A5566] dark:text-gray-500">
              {savedCount} of {drama.words.length} already in a review deck.
            </p>
            <div className="mb-3.5 h-1.5 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(savedCount / drama.words.length) * 100}%`, background: ACC.light }}
              />
            </div>
            <div className="flex max-h-[300px] flex-col gap-3 overflow-y-auto">
              {drama.words.map(w => (
                <div key={w.korean} className="flex items-baseline justify-between gap-2">
                  <span className="font-korean text-[16px] font-semibold text-[#16202F] dark:text-white">
                    {w.korean}
                  </span>
                  <span className="min-w-0 truncate text-right text-[12px] text-[#4A5566] dark:text-gray-500">
                    {w.english}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => addWords(newWords)}
              disabled={newWords.length === 0}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[9px] border border-[rgba(20,32,47,0.2)] text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] disabled:opacity-60 dark:border-gray-700 dark:text-gray-200"
            >
              {newWords.length === 0 ? (
                <>
                  <Check className="h-4 w-4" style={{ color: ACC.light }} /> All {drama.words.length} saved
                </>
              ) : (
                `Add ${newWords.length} to review`
              )}
            </button>
          </div>

          <div className={`${railCard} mb-3.5`}>
            <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
              About this drama
            </div>
            <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
              {drama.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {drama.genres.map(g => (
                <span
                  key={g}
                  className="rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
                  style={{ background: `${ACC.light}1A`, color: ACC.light }}
                >
                  {g}
                </span>
              ))}
              <span className="rounded-full bg-[rgba(20,32,47,0.06)] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#4A5566] dark:bg-gray-800 dark:text-gray-400">
                {drama.year}
              </span>
            </div>
          </div>

          <div className={railCard}>
            <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
              Where these came from
            </div>
            <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
              The words are the ones this drama leans on. The sentences are written for study — short,
              polite and safe to say out loud — rather than lifted from the script, which is often
              faster and blunter than you want your first Korean to be.
            </p>
          </div>
        </div>
      </div>

      {soundOut && (
        <SoundItOutModal
          korean={soundOut.korean}
          english={soundOut.english}
          romanization={soundOut.romanization}
          onClose={() => setSoundOut(null)}
        />
      )}
    </div>
  );
};

// ── Section ───────────────────────────────────────────────────────────────────

const KDramaSection: React.FC = () => {
  const { hasPremiumAccess, isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();
  const { decks } = useSRSContext();
  const { startUpgrade } = useUpgrade();
  const isPremium = hasPremiumAccess();

  const [selected, setSelected] = useState<Drama | null>(null);

  const totalWords = dramas.reduce((a, d) => a + d.words.length, 0);

  // ── Guest ──
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl py-10 text-center">
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[32px] dark:text-white">
          K-Drama word packs
        </h1>
        <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-relaxed text-[#3E4A5A] dark:text-gray-400">
          The words {dramas.length} well-known dramas lean on, each with a sentence you can say out
          loud. {totalWords} words in all.
        </p>
        <button
          onClick={openRegister}
          className="mt-6 inline-flex h-12 items-center rounded-[10px] px-6 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
          style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
        >
          Sign up free →
        </button>
      </div>
    );
  }

  // ── Free — the packs are a premium feature ──
  if (!isPremium) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            K-Drama word packs
          </h1>
          <p className="mt-2 max-w-[60ch] text-[15px] text-[#3E4A5A] dark:text-gray-400">
            The words {dramas.length} well-known dramas lean on — {totalWords} of them — each with a
            sentence you can say out loud and send straight to a review deck.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dramas.map((d, i) => (
            <button
              key={d.id}
              onClick={startUpgrade}
              className="kl-premium kl-cascade flex flex-col items-start rounded-[18px] p-5 text-left"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-[19px]"
                style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D` }}
              >
                {d.emoji}
              </span>
              <span className="text-[15px] font-semibold text-[#16202F] dark:text-white">
                {d.titleEnglish}
              </span>
              <span className="mt-0.5 font-korean text-[13px] text-[#4A5566] dark:text-gray-400">
                {d.title} · {d.year}
              </span>
              <span className="mt-3 flex items-center gap-1.5 text-[12.5px] text-[#4A5566] dark:text-gray-500">
                <Lock className="h-3.5 w-3.5" /> {d.words.length} words
              </span>
              <span className="mt-3 text-[13px] font-semibold text-[#C13F22] dark:text-[#F07A55]">
                Unlock · $4/mo →
              </span>
            </button>
          ))}
        </div>

        <div className="kl-card mt-5 flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="min-w-[240px] flex-1 text-[14px] leading-relaxed text-[#3E4A5A] dark:text-gray-400">
            Premium opens all {dramas.length} packs, and every word can go into spaced repetition so
            it comes back to you at the right time. $4/month, cancel anytime — less than a coffee ☕
          </p>
          <button
            onClick={startUpgrade}
            className="flex h-11 flex-none items-center rounded-[10px] px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
          >
            Get Premium →
          </button>
        </div>
      </div>
    );
  }

  // ── Premium — the pack itself ──
  if (selected) {
    return <DramaPack drama={selected} onBack={() => setSelected(null)} />;
  }

  const savedTotal = dramas.reduce(
    (a, d) => a + d.words.filter(w => isInAnyDeck(decks, w.korean)).length,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-6 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            K-Drama
          </h1>
          <p className="mt-2 max-w-[60ch] text-[15px] text-[#3E4A5A] dark:text-gray-400">
            One pack per drama: the words it leans on, each inside a sentence you can say. Pick the
            show you have actually watched — you already know what the words are doing.
          </p>
        </div>
        <div className="flex-none">
          <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
            {savedTotal} of {totalWords} saved
          </div>
          <div className="h-1.5 w-[200px] overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(savedTotal / totalWords) * 100}%`, background: ACC.light }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dramas.map((d, i) => {
          const saved = d.words.filter(w => isInAnyDeck(decks, w.korean)).length;
          return (
            <button
              key={d.id}
              onClick={() => setSelected(d)}
              className="kl-card kl-cascade flex flex-col p-5 text-left transition-transform duration-200 hover:-translate-y-1"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-[20px]"
                  style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D` }}
                >
                  {d.emoji}
                </span>
                {saved > 0 && (
                  <span className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: ACC.light }}>
                    <Check className="h-3.5 w-3.5" /> {saved} saved
                  </span>
                )}
              </div>

              <div className="mt-4 text-[16px] font-semibold text-[#16202F] dark:text-white">
                {d.titleEnglish}
              </div>
              <div className="mt-0.5 font-korean text-[13.5px] text-[#4A5566] dark:text-gray-400">
                {d.title} · {d.year}
              </div>

              <p className="mt-2.5 flex-1 text-[13px] leading-[1.5] text-[#4A5566] dark:text-gray-500">
                {d.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.genres.map(g => (
                  <span
                    key={g}
                    className="rounded-full bg-[rgba(20,32,47,0.06)] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#4A5566] dark:bg-gray-800 dark:text-gray-400"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <span className="mt-3.5 text-[13px] font-semibold" style={{ color: ACC.light }}>
                {d.words.length} words →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default KDramaSection;
