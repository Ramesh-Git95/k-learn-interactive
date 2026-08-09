import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, Lock, Volume2, X } from 'lucide-react';
import { isInAnyDeck, unsavedWords } from '../utils/srsLookup';
import { accentFor } from '../utils/moduleAccent';
import { kpopArtists } from '../data/kpopData';
import type { KPopArtist, KPopSong, KPopWord } from '../data/kpopData';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useSRSContext } from '../contexts/SRSContext';
import { useToastContext } from '../contexts/ToastContext';
import PronunciationButton from './PronunciationButton';
import SoundItOutModal from './SoundItOutModal';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import { useUpgrade } from '../hooks/useUpgrade';

const ACC = accentFor('kpop');

const DECK_NAME = 'K-Pop Vocabulary';

const railCard =
  'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

// The active line is built from its word list so each word can be tapped; every
// other line is printed as written. Re-joining the words with spaces loses the
// punctuation between them ("있어, 믿어" → "있어 믿어"), so the line would
// visibly rewrite itself the moment you clicked it. Walk the real line instead
// and hand back the gaps untouched.
type Segment = { text: string; word?: KPopWord };

function segmentLine(korean: string, words: KPopWord[]): Segment[] {
  const out: Segment[] = [];
  let pos = 0;
  words.forEach(w => {
    const i = korean.indexOf(w.korean, pos);
    if (i < 0) return; // not found where expected — leave the text alone
    if (i > pos) out.push({ text: korean.slice(pos, i) });
    out.push({ text: w.korean, word: w });
    pos = i + w.korean.length;
  });
  if (pos < korean.length) out.push({ text: korean.slice(pos) });
  return out;
}

const TYPE_LABEL: Record<string, string> = {
  noun: 'noun',
  verb: 'verb',
  adjective: 'adjective',
  adverb: 'adverb',
  particle: 'particle',
  expression: 'expression',
};

// ── Word popover ──────────────────────────────────────────────────────────────

interface PopoverProps {
  word: KPopWord;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onAddSRS: (word: KPopWord) => void;
  onSoundItOut: (word: KPopWord) => void;
  isAuthenticated: boolean;
  isPremium: boolean;
  isSaved: boolean;
}

function WordPopover({
  word, anchorRef, onClose, onAddSRS, onSoundItOut, isAuthenticated, isPremium, isSaved,
}: PopoverProps) {
  const popRef = useRef<HTMLDivElement>(null);
  const { startUpgrade } = useUpgrade();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={popRef}
      className="absolute bottom-full left-1/2 z-50 mb-2 w-60"
      style={{ transform: 'translateX(-50%)' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] p-3.5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-korean text-[20px] font-bold text-[#16202F] dark:text-white">{word.korean}</div>
            <div className="mt-0.5 text-[12px] text-[#4A5566] dark:text-gray-500">{word.romanization}</div>
          </div>
          <div className="flex flex-none items-center gap-1">
            <button
              onClick={() => onSoundItOut(word)}
              title="Sound it out — syllable by syllable"
              aria-label={`Sound out ${word.korean}`}
              className="rounded-lg p-1 text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-500 dark:hover:text-gray-300"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1 text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-600 dark:hover:text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="text-[14px] font-semibold text-[#16202F] dark:text-gray-100">{word.english}</div>
        <div className="mt-0.5 text-[12px] text-[#4A5566] dark:text-gray-500">
          {TYPE_LABEL[word.type] ?? word.type}
        </div>

        <div className="mt-3">
          {!isAuthenticated ? (
            <button
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'register' }));
              }}
              className="flex h-10 w-full items-center justify-center rounded-[9px] text-[13px] font-semibold text-white"
              style={{ background: ACC.light }}
            >
              Sign up to save it
            </button>
          ) : !isPremium ? (
            <button
              onClick={startUpgrade}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[9px] border border-[rgba(20,32,47,0.2)] text-[13px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
            >
              <Lock className="h-3.5 w-3.5" /> Saving is Premium
            </button>
          ) : isSaved ? (
            <span
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[9px] text-[13px] font-semibold"
              style={{ background: `${ACC.light}1A`, color: ACC.light }}
              title="Already in your decks"
            >
              <Check className="h-3.5 w-3.5" /> In your deck
            </span>
          ) : (
            <button
              onClick={() => onAddSRS(word)}
              className="flex h-10 w-full items-center justify-center rounded-[9px] text-[13px] font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ background: ACC.light }}
            >
              Add to deck
            </button>
          )}
        </div>

        <div className="mt-2.5 border-t border-[rgba(20,32,47,0.12)] pt-2.5 dark:border-gray-800">
          <PronunciationButton korean={word.korean} romanization={word.romanization} size="sm" />
        </div>
      </div>
    </div>
  );
}

// ── Tappable word inside the active line ─────────────────────────────────────

function WordChip({ word, isAuthenticated, isPremium, isSaved, onAddSRS, onSoundItOut }: {
  word: KPopWord;
  isAuthenticated: boolean;
  isPremium: boolean;
  isSaved: boolean;
  onAddSRS: (word: KPopWord) => void;
  onSoundItOut: (word: KPopWord) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const { openRegister } = useAuthModal();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { openRegister(); return; }
    setOpen(p => !p);
  };

  return (
    <span className="relative inline-block">
      <button
        ref={btnRef}
        onClick={handleClick}
        className="rounded px-0.5 font-korean transition-colors"
        style={
          open
            ? { background: `${ACC.light}2E`, color: 'inherit' }
            : isSaved
            ? { boxShadow: `inset 0 -2px 0 ${ACC.light}66` }
            : undefined
        }
        title={isSaved ? 'Already in your deck' : undefined}
      >
        {word.korean}
      </button>
      {open && (
        <WordPopover
          word={word}
          anchorRef={btnRef}
          onClose={() => setOpen(false)}
          onAddSRS={w => { onAddSRS(w); setOpen(false); }}
          onSoundItOut={w => { onSoundItOut(w); setOpen(false); }}
          isAuthenticated={isAuthenticated}
          isPremium={isPremium}
          isSaved={isSaved}
        />
      )}
    </span>
  );
}

// ── Song view ─────────────────────────────────────────────────────────────────

function SongView({ song, artist, isPremium, isAuthenticated, onBack }: {
  song: KPopSong;
  artist: KPopArtist;
  isPremium: boolean;
  isAuthenticated: boolean;
  onBack: () => void;
}) {
  const { decks, actions: srsActions } = useSRSContext();
  const { showToast } = useToastContext();
  const { startUpgrade } = useUpgrade();

  const [active, setActive] = useState(0);
  const [showEnglish, setShowEnglish] = useState(true);
  const [halfSpeed, setHalfSpeed] = useState(false);
  const [soundOut, setSoundOut] = useState<KPopWord | null>(null);
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set());

  // Every distinct word in the song, in the order it is sung.
  const allWords = useMemo(() => {
    const seen = new Set<string>();
    const out: KPopWord[] = [];
    song.lines.forEach(l => l.words.forEach(w => {
      if (!seen.has(w.korean)) { seen.add(w.korean); out.push(w); }
    }));
    return out;
  }, [song]);

  const isSaved = (w: KPopWord) => justSaved.has(w.korean) || isInAnyDeck(decks, w.korean);

  const savedHere = useMemo(
    () => allWords.filter(w => justSaved.has(w.korean) || isInAnyDeck(decks, w.korean)),
    [allWords, decks, justSaved],
  );
  const newWords = useMemo(
    () => unsavedWords(decks, allWords).filter(w => !justSaved.has(w.korean)),
    [decks, allWords, justSaved],
  );

  const addWords = (words: KPopWord[]) => {
    if (!words.length) return;
    const existing = decks.find(d => d.name === DECK_NAME);
    const deckId = existing ? existing.id : srsActions.createDeck(DECK_NAME, 'Words from song lyrics');
    const already = new Set((existing?.cards ?? []).map(c => c.content.korean));

    let added = 0;
    words.forEach(w => {
      if (already.has(w.korean)) return;
      srsActions.addCardToDeck(deckId, {
        korean: w.korean,
        romanization: w.romanization,
        english: w.english,
        type: 'vocabulary',
        category: `K-Pop: ${artist.name}`,
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

  const speakLine = (i: number) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(song.lines[i].korean);
    u.lang = 'ko-KR';
    u.rate = halfSpeed ? 0.5 : 0.85;
    window.speechSynthesis.speak(u);
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
              {artist.name}
            </button>
            <span className="text-[#4A5566] dark:text-gray-600">/</span>
            <span className="font-semibold" style={{ color: ACC.light }}>{song.title}</span>
          </div>
          <h1 className="font-korean text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            {song.titleKorean}
            <span className="text-[#4A5566] dark:text-gray-500"> · {song.title}</span>
          </h1>
          <p className="mt-1 text-[15px] text-[#4A5566] dark:text-gray-400">{song.theme}</p>
        </div>
        <div className="flex flex-none items-center gap-3.5">
          <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">
            line {active + 1} of {song.lines.length}
          </span>
          <button
            onClick={onBack}
            className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
          >
            Change song
          </button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        {/* ── The lyric column ── */}
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
              Read along once. Tap any word to save it — you do not need to understand the whole line
              to get value from it.
            </span>
          </div>

          <div className="kl-card p-5 sm:p-7">
            <div className="flex flex-col gap-1">
              {song.lines.map((line, i) => {
                const isActive = i === active;
                if (!isActive) {
                  return (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className="rounded-lg px-3 py-2 text-left font-korean text-[17px] leading-[1.6] text-[#4A5566] transition-colors hover:bg-[rgba(20,32,47,0.04)] hover:text-[#16202F] sm:text-[19px] dark:text-gray-500 dark:hover:bg-gray-800/60 dark:hover:text-gray-300"
                    >
                      {line.korean}
                    </button>
                  );
                }
                return (
                  <div
                    key={i}
                    className="rounded-r-lg border-l-[3px] px-3.5 py-3"
                    style={{ borderColor: ACC.light, background: `${ACC.light}14` }}
                  >
                    <div className="font-korean text-[21px] font-semibold leading-[1.65] text-[#16202F] sm:text-[24px] dark:text-white">
                      {segmentLine(line.korean, line.words).map((seg, si) =>
                        seg.word ? (
                          <WordChip
                            key={si}
                            word={seg.word}
                            isAuthenticated={isAuthenticated}
                            isPremium={isPremium}
                            isSaved={isSaved(seg.word)}
                            onAddSRS={word => addWords([word])}
                            onSoundItOut={setSoundOut}
                          />
                        ) : (
                          <span key={si}>{seg.text}</span>
                        ),
                      )}
                    </div>
                    <div className="mt-2 text-[13px] text-[#4A5566] dark:text-gray-500">
                      {line.romanization}
                    </div>
                    {showEnglish && (
                      <div className="mt-1 text-[14px] text-[#3E4A5A] dark:text-gray-400">
                        {line.english}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Controls, under the column as in the design ── */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-[rgba(20,32,47,0.12)] pt-5 dark:border-gray-800">
              <button
                onClick={() => speakLine(active)}
                className="flex h-11 shrink-0 items-center gap-2.5 rounded-[10px] px-4.5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
              >
                <span className="flex h-3.5 items-end gap-[2.5px]" aria-hidden="true">
                  <span className="kl-bar w-[3px] bg-white" style={{ height: '100%' }} />
                  <span className="kl-bar w-[3px] bg-white" style={{ height: '100%', animationDelay: '0.15s' }} />
                  <span className="kl-bar w-[3px] bg-white" style={{ height: '100%', animationDelay: '0.3s' }} />
                </span>
                Repeat this line
              </button>
              <button
                onClick={() => setHalfSpeed(v => !v)}
                className={`flex h-11 shrink-0 items-center rounded-[10px] border-[1.5px] px-4 text-[13.5px] font-semibold transition-colors ${
                  halfSpeed
                    ? 'text-white'
                    : 'border-[rgba(20,32,47,0.22)] text-[#16202F] hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200'
                }`}
                style={halfSpeed ? { background: ACC.light, borderColor: ACC.light } : undefined}
              >
                Half speed
              </button>
              <button
                onClick={() => setShowEnglish(v => !v)}
                className="flex h-11 shrink-0 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
              >
                {showEnglish ? 'Hide translation' : 'Show translation'}
              </button>
              <button
                onClick={() => setActive(i => Math.min(i + 1, song.lines.length - 1))}
                disabled={active >= song.lines.length - 1}
                className="flex h-11 shrink-0 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
              >
                Next line →
              </button>
              <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">
                {isAuthenticated ? 'Tap any word to save it.' : 'Sign in to save words.'}
              </span>
            </div>
          </div>

          {!isPremium && !song.isFree && (
            <div className="kl-card mt-4 flex flex-wrap items-center justify-between gap-4 p-5">
              <p className="min-w-[240px] flex-1 text-[14px] text-[#3E4A5A] dark:text-gray-400">
                This song is part of Premium. $4/month, cancel anytime.
              </p>
              <button
                onClick={startUpgrade}
                className="flex h-11 flex-none items-center rounded-[10px] px-5 text-sm font-semibold text-white"
                style={{ background: ACC.light }}
              >
                Get Premium →
              </button>
            </div>
          )}
        </div>

        {/* ── Rail ── */}
        <div className="order-2 w-full flex-none lg:w-[290px]">
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-1 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
              Saved from this song
            </div>
            <p className="mb-3.5 text-[12px] text-[#4A5566] dark:text-gray-500">
              {savedHere.length} of {allWords.length} words are in a review deck.
            </p>

            {savedHere.length > 0 ? (
              <div className="flex max-h-[240px] flex-col gap-3 overflow-y-auto">
                {savedHere.map(w => (
                  <div key={w.korean}>
                    <div className="font-korean text-[17px] font-semibold text-[#16202F] dark:text-white">
                      {w.korean}
                    </div>
                    <div className="mt-0.5 text-[12px] text-[#4A5566] dark:text-gray-500">
                      {w.romanization} · {w.english}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] leading-[1.5] text-[#4A5566] dark:text-gray-500">
                Nothing yet. Tap a word in the highlighted line and it will appear here.
              </p>
            )}

            {isPremium && (
              <button
                onClick={() => addWords(newWords)}
                disabled={newWords.length === 0}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[9px] border border-[rgba(20,32,47,0.2)] text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] disabled:opacity-60 dark:border-gray-700 dark:text-gray-200"
              >
                {newWords.length === 0 ? (
                  <><Check className="h-4 w-4" style={{ color: ACC.light }} /> All {allWords.length} saved</>
                ) : (
                  `Add all ${newWords.length} to review`
                )}
              </button>
            )}
          </div>

          <div className={`${railCard} mb-3.5`}>
            <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
              Why this song
            </div>
            <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
              {song.theme}. {song.lines.length} short lines and {allWords.length} words — few enough
              that you can hold the whole thing in your head by the end.
            </p>
          </div>

          <div className={railCard}>
            <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
              About these lyrics
            </div>
            <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
              Written for learners in the style of {artist.name} — plain, singable Korean rather than
              the real released lyrics, which run fast and lean on slang. The words are the ones that
              genuinely recur in {artist.genre.toLowerCase()}.
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
}

// ── An artist's songs ─────────────────────────────────────────────────────────

function ArtistSongs({ artist, isPremium, onSelectSong, onBack }: {
  artist: KPopArtist;
  isPremium: boolean;
  onSelectSong: (song: KPopSong) => void;
  onBack: () => void;
}) {
  const { startUpgrade } = useUpgrade();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[12.5px]">
            <button
              onClick={onBack}
              className="font-medium text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200"
            >
              K-Pop
            </button>
            <span className="text-[#4A5566] dark:text-gray-600">/</span>
            <span className="font-semibold" style={{ color: ACC.light }}>{artist.name}</span>
          </div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            {artist.name}
          </h1>
          <p className="mt-1 text-[15px] text-[#4A5566] dark:text-gray-400">{artist.genre}</p>
        </div>
        <button
          onClick={onBack}
          className="flex h-12 flex-none items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
        >
          All artists
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {artist.songs.map((song, i) => {
          const locked = !isPremium && !song.isFree;
          const words = song.lines.reduce((a, l) => a + l.words.length, 0);

          return (
            <button
              key={song.id}
              onClick={() => (locked ? startUpgrade() : onSelectSong(song))}
              className={`kl-cascade flex items-center gap-4 rounded-[14px] border p-4 text-left transition-colors ${
                locked
                  ? 'border-[rgba(20,32,47,0.14)] bg-[rgba(20,32,47,0.03)] dark:border-gray-800 dark:bg-gray-900/50'
                  : 'border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] hover:border-[rgba(20,32,47,0.3)] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600'
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                className="flex h-11 w-11 flex-none items-center justify-center rounded-xl font-korean text-[17px] font-bold"
                style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D`, color: ACC.light }}
              >
                {locked ? <Lock className="h-4 w-4" /> : song.titleKorean.charAt(0)}
              </span>

              <div className="min-w-0 flex-1">
                <div className="font-korean text-[16px] font-semibold text-[#16202F] dark:text-white">
                  {song.titleKorean}
                  <span className="font-sans text-[13.5px] font-normal text-[#4A5566] dark:text-gray-400">
                    {' '}· {song.title}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[13px] text-[#4A5566] dark:text-gray-500">{song.theme}</div>
                <div className="mt-1 text-[12px] text-[#4A5566] dark:text-gray-600">
                  {song.lines.length} lines · {words} words
                </div>
              </div>

              <span className="flex-none text-[13px] font-semibold" style={{ color: locked ? '#C13F22' : ACC.light }}>
                {locked ? 'Unlock →' : 'Open →'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

const KPopSection: React.FC = () => {
  const { hasPremiumAccess, isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();
  const { startUpgrade } = useUpgrade();
  const isPremium = hasPremiumAccess();

  const [artist, setArtist] = useState<KPopArtist | null>(null);
  const [song, setSong] = useState<KPopSong | null>(null);

  const totalSongs = kpopArtists.reduce((a, ar) => a + ar.songs.length, 0);
  const freeSongs = kpopArtists.reduce((a, ar) => a + ar.songs.filter(s => s.isFree).length, 0);

  if (artist && song) {
    return (
      <SongView
        song={song}
        artist={artist}
        isPremium={isPremium}
        isAuthenticated={isAuthenticated}
        onBack={() => setSong(null)}
      />
    );
  }

  if (artist) {
    return (
      <ArtistSongs
        artist={artist}
        isPremium={isPremium}
        onSelectSong={setSong}
        onBack={() => setArtist(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-6 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            K-Pop
          </h1>
          <p className="mt-2 max-w-[62ch] text-[15px] text-[#3E4A5A] dark:text-gray-400">
            Song-length Korean, one line at a time. Tap any word in the line you are on and it goes
            into your review deck.
          </p>
        </div>
        <div className="flex-none text-[13.5px] text-[#4A5566] dark:text-gray-500">
          {freeSongs} free · {totalSongs - freeSongs} with Premium
        </div>
      </div>

      {/* The lyrics are ours, not the artists' — say so once, plainly, up front. */}
      <div className="kl-well mb-5 rounded-xl px-4 py-3">
        <p className="text-[13px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
          <strong className="font-semibold text-[#16202F] dark:text-gray-200">These are practice lyrics.</strong>{' '}
          Each set is written for learners in the style of the group named — slower and plainer than
          the real songs. Nothing here is the released lyric.
        </p>
      </div>

      {!isAuthenticated && (
        <div className="kl-card mb-5 flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="min-w-[240px] flex-1 text-[14px] text-[#3E4A5A] dark:text-gray-400">
            Sign up free to see what each word means and send it to a review deck.
          </p>
          <button
            onClick={openRegister}
            className="flex h-11 flex-none items-center rounded-[10px] px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
          >
            Sign up free →
          </button>
        </div>
      )}

      {isAuthenticated && !isPremium && (
        <div className="kl-card mb-5 flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="min-w-[240px] flex-1 text-[14px] text-[#3E4A5A] dark:text-gray-400">
            On the free plan you can read {freeSongs} songs and look up every word. Premium opens the
            other {totalSongs - freeSongs} and lets you save words for review. $4/month, cancel anytime.
          </p>
          <button
            onClick={startUpgrade}
            className="flex h-11 flex-none items-center rounded-[10px] px-5 text-sm font-semibold text-white"
            style={{ background: ACC.light }}
          >
            Get Premium →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpopArtists.map((a, i) => {
          const free = a.songs.filter(s => s.isFree).length;
          const words = a.songs.reduce((x, s) => x + s.lines.reduce((y, l) => y + l.words.length, 0), 0);

          return (
            <button
              key={a.id}
              onClick={() => setArtist(a)}
              className="kl-card kl-cascade flex flex-col p-5 text-left transition-transform duration-200 hover:-translate-y-1"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[20px]"
                style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D` }}
              >
                {a.emoji}
              </span>
              <div className="mt-4 text-[16px] font-semibold text-[#16202F] dark:text-white">{a.name}</div>
              <div className="mt-0.5 flex-1 text-[13.5px] text-[#4A5566] dark:text-gray-400">{a.genre}</div>
              <div className="mt-3 text-[12.5px] text-[#4A5566] dark:text-gray-500">
                {a.songs.length} song{a.songs.length === 1 ? '' : 's'} · {free} free · {words} words
              </div>
              <span className="mt-3.5 text-[13px] font-semibold" style={{ color: ACC.light }}>
                Open →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default KPopSection;
