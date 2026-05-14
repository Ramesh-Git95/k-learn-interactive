import React, { useState, useRef, useEffect } from 'react';
import { kpopArtists } from '../data/kpopData';
import type { KPopArtist, KPopSong, KPopWord } from '../data/kpopData';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useSRSContext } from '../contexts/SRSContext';
import { useToastContext } from '../contexts/ToastContext';
import PronunciationButton from './PronunciationButton';
import { earnXP, markStudyToday } from '../utils/xpStreak';

const GUMROAD_URL = 'https://learnk.gumroad.com/l/klearn-lifetime';

// ── Word popover ──────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  noun:       'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  verb:       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  adjective:  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  adverb:     'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  particle:   'bg-gray-100   text-gray-600   dark:bg-gray-800      dark:text-gray-400',
  expression: 'bg-pink-100   text-pink-700   dark:bg-pink-900/30   dark:text-pink-400',
};

interface PopoverProps {
  word: KPopWord;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onAddSRS: (word: KPopWord) => void;
  isAuthenticated: boolean;
  isPremium: boolean;
}

function WordPopover({ word, anchorRef, onClose, onAddSRS, isAuthenticated, isPremium }: PopoverProps) {
  const popRef = useRef<HTMLDivElement>(null);

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

  const speak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word.korean);
      u.lang = 'ko-KR'; u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div
      ref={popRef}
      className="absolute z-50 bottom-full left-1/2 mb-2 w-56"
      style={{ transform: 'translateX(-50%)' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-3">
        {/* Arrow */}
        <div className="absolute left-1/2 bottom-[-7px]" style={{ transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '7px solid #e5e7eb' }} />
        <div className="absolute left-1/2 bottom-[-6px]" style={{ transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid white' }} />

        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{word.korean}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 italic">{word.romanization}</div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={speak} className="p-1 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-base">🔊</button>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors text-sm font-black">✕</button>
          </div>
        </div>

        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{word.english}</div>

        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLOR[word.type] ?? TYPE_COLOR.expression}`}>
            {word.type}
          </span>
          {isPremium ? (
            <button
              onClick={() => onAddSRS(word)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg text-white transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' }}
            >
              + SRS
            </button>
          ) : isAuthenticated ? (
            <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer"
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 transition-colors">
              🔒 Premium
            </a>
          ) : (
            <button onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'register' })); }}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 transition-colors">
              Sign up
            </button>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <PronunciationButton korean={word.korean} romanization={word.romanization} size="sm" />
        </div>
      </div>
    </div>
  );
}

// ── Tappable word chip ────────────────────────────────────────────────────────

function WordChip({ word, isAuthenticated, isPremium, onAddSRS }: {
  word: KPopWord;
  isAuthenticated: boolean;
  isPremium: boolean;
  onAddSRS: (word: KPopWord) => void;
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
        className={`px-1.5 py-0.5 rounded-lg text-base sm:text-lg font-bold transition-all ${
          open
            ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 scale-110'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white hover:scale-105'
        }`}
      >
        {word.korean}
      </button>
      {open && (
        <WordPopover
          word={word}
          anchorRef={btnRef}
          onClose={() => setOpen(false)}
          onAddSRS={w => { onAddSRS(w); setOpen(false); }}
          isAuthenticated={isAuthenticated}
          isPremium={isPremium}
        />
      )}
    </span>
  );
}

// ── Lyrics line ───────────────────────────────────────────────────────────────

function LyricsLine({ line, isAuthenticated, isPremium, onAddSRS, showHint }: {
  line: { korean: string; romanization: string; english: string; words: KPopWord[] };
  isAuthenticated: boolean;
  isPremium: boolean;
  onAddSRS: (word: KPopWord) => void;
  showHint: boolean;
}) {
  return (
    <div className="py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 group">
      <div className="flex flex-wrap gap-0.5 mb-1">
        {line.words.map((word, i) => (
          <WordChip
            key={word.korean + i}
            word={word}
            isAuthenticated={isAuthenticated}
            isPremium={isPremium}
            onAddSRS={onAddSRS}
          />
        ))}
        {showHint && (
          <span className="ml-2 text-[10px] font-semibold text-pink-400 dark:text-pink-500 self-center animate-pulse">
            ← tap a word
          </span>
        )}
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 italic mt-0.5">{line.romanization}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{line.english}</div>
    </div>
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
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());

  const handleAddSRS = (word: KPopWord) => {
    const deckName = 'K-Pop Vocabulary';
    const existing = decks.find(d => d.name === deckName);
    const deckId = existing ? existing.id : srsActions.createDeck(deckName, 'Words from K-Pop lyrics');
    srsActions.addCardToDeck(deckId, {
      korean: word.korean,
      romanization: word.romanization,
      english: word.english,
      type: 'vocabulary',
      category: `K-Pop: ${artist.name}`,
    });
    setAddedWords(prev => new Set(prev).add(word.korean));
    showToast(`Added "${word.korean}" to K-Pop Vocabulary!`, 'success');
    earnXP(3);
    markStudyToday();
  };

  return (
    <div>
      {/* Back + song header */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold mb-5 transition-opacity hover:opacity-70" style={{ color: artist.accentColor }}>
        ← {artist.name} songs
      </button>

      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: artist.gradient }}>
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{artist.emoji}</span>
            <span className="text-xs font-bold text-white/70 uppercase tracking-widest">{artist.name}</span>
            {song.isFree
              ? <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">FREE</span>
              : <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">PREMIUM</span>
            }
          </div>
          <h2 className="text-2xl font-black text-white">{song.titleKorean}</h2>
          <p className="text-white/60 text-sm">{song.title} · {song.theme}</p>
          <p className="text-white/50 text-xs mt-2">Tap any word to see its meaning and romanization</p>
        </div>
      </div>

      {/* Lyrics */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
        {song.lines.map((line, i) => (
          <LyricsLine
            key={i}
            line={line}
            isAuthenticated={isAuthenticated}
            isPremium={isPremium}
            onAddSRS={handleAddSRS}
            showHint={i === 0}
          />
        ))}
      </div>

      {/* Added words summary */}
      {addedWords.size > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">✓</span>
          <span className="text-sm text-emerald-700 dark:text-emerald-300">
            {addedWords.size} word{addedWords.size !== 1 ? 's' : ''} added to your K-Pop Vocabulary deck
          </span>
        </div>
      )}

      {/* Upsell for free users in premium song — shouldn't normally reach here */}
      {!isPremium && !song.isFree && (
        <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-center">
          <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-2">Unlock all songs with Premium</p>
          <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer"
            className="inline-block px-5 py-2 rounded-xl text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' }}>
            Upgrade → ₩39 lifetime
          </a>
        </div>
      )}
    </div>
  );
}

// ── Song list for an artist ───────────────────────────────────────────────────

function ArtistSongs({ artist, isPremium, isAuthenticated, onSelectSong, onBack }: {
  artist: KPopArtist;
  isPremium: boolean;
  isAuthenticated: boolean;
  onSelectSong: (song: KPopSong) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold mb-5 transition-opacity hover:opacity-70" style={{ color: artist.accentColor }}>
        ← All artists
      </button>

      {/* Artist header */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: artist.gradient }}>
        <div className="p-5 sm:p-6 flex items-center gap-4">
          <span className="text-5xl">{artist.emoji}</span>
          <div>
            <h2 className="text-2xl font-black text-white">{artist.name}</h2>
            <p className="text-white/60 text-sm">{artist.genre}</p>
            <p className="text-white/50 text-xs mt-1">{artist.songs.length} songs · {artist.songs.filter(s => s.isFree).length} free</p>
          </div>
        </div>
      </div>

      {/* Song list */}
      <div className="space-y-3">
        {artist.songs.map(song => {
          const locked = !isPremium && !song.isFree;
          return (
            <button
              key={song.id}
              onClick={() => !locked && onSelectSong(song)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                locked
                  ? 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 cursor-not-allowed'
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-pink-200 dark:hover:border-pink-800 hover:shadow-md'
              }`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: artist.gradient }}>
                {locked ? '🔒' : '🎵'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-black text-base ${locked ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}`}>
                    {song.titleKorean}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    song.isFree
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {song.isFree ? 'FREE' : 'PREMIUM'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{song.title} · {song.theme}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{song.lines.length} lines · {song.lines.reduce((a, l) => a + l.words.length, 0)} words</p>
              </div>
              {!locked && <span className="text-gray-300 dark:text-gray-600 text-lg flex-shrink-0">›</span>}
              {locked && (
                <a
                  href={GUMROAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' }}
                >
                  Unlock
                </a>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

const KPopSection: React.FC = () => {
  const { hasPremiumAccess, isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();
  const isPremium = hasPremiumAccess();

  const [selectedArtist, setSelectedArtist] = useState<KPopArtist | null>(null);
  const [selectedSong, setSelectedSong] = useState<KPopSong | null>(null);

  const totalSongs   = kpopArtists.reduce((a, ar) => a + ar.songs.length, 0);
  const freeSongs    = kpopArtists.reduce((a, ar) => a + ar.songs.filter(s => s.isFree).length, 0);
  const totalWords   = kpopArtists.reduce((a, ar) => a + ar.songs.reduce((b, s) => b + s.lines.reduce((c, l) => c + l.words.length, 0), 0), 0);

  // If viewing a specific song
  if (selectedArtist && selectedSong) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <SongView
          song={selectedSong}
          artist={selectedArtist}
          isPremium={isPremium}
          isAuthenticated={isAuthenticated}
          onBack={() => setSelectedSong(null)}
        />
      </div>
    );
  }

  // If viewing an artist's songs
  if (selectedArtist) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <ArtistSongs
          artist={selectedArtist}
          isPremium={isPremium}
          isAuthenticated={isAuthenticated}
          onSelectSong={song => setSelectedSong(song)}
          onBack={() => setSelectedArtist(null)}
        />
      </div>
    );
  }

  // Artist grid (landing)
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-8 p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #BE185D 60%, #059669 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {['BTS','BLACKPINK','NewJeans','aespa','K-POP','한국어'].map((w, i) => (
            <span key={i} className="absolute font-black text-white/10" style={{ fontSize: `${1.2 + (i % 3) * 0.5}rem`, top: `${(i * 29) % 85}%`, left: `${(i * 43) % 85}%` }}>{w}</span>
          ))}
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">🎵</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">K-Pop Lyrics Mode</h1>
                <p className="text-purple-100 text-sm">Learn Korean through music · {totalWords}+ words</p>
              </div>
            </div>
            <p className="text-white/80 text-sm max-w-lg">
              Tap any word in the lyrics to see its meaning, romanization, and add it to your SRS deck.
            </p>
          </div>
          <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[120px]">
            <div className="text-3xl font-black text-white">{freeSongs}</div>
            <div className="text-xs text-white/70">free songs</div>
            <div className="text-xs text-white/50 mt-1">{totalSongs - freeSongs} more with Premium</div>
          </div>
        </div>
      </div>

      {/* Guest banner */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/40 bg-purple-50 dark:bg-purple-900/10 flex items-start gap-3">
          <span className="text-2xl">🎵</span>
          <div className="flex-1">
            <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-0.5">Tap words to learn!</h3>
            <p className="text-sm text-purple-600 dark:text-purple-300 mb-2">
              Sign in to see word meanings, romanization, and add words to your SRS deck.
            </p>
            <button
              onClick={openRegister}
              className="text-sm font-bold text-white px-4 py-1.5 rounded-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #6D28D9, #BE185D)' }}
            >
              Sign up free 🚀
            </button>
          </div>
        </div>
      )}

      {/* Free vs premium info banner for free users */}
      {isAuthenticated && !isPremium && (
        <div className="mb-6 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div className="flex-1">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <span className="font-bold">Free plan:</span> 1 song per artist, tap words to see meanings. Upgrade to unlock all songs and add words to SRS.
            </p>
          </div>
          <a
            href={GUMROAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl text-white whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' }}
          >
            Upgrade
          </a>
        </div>
      )}

      {/* Artist grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {kpopArtists.map(artist => {
          const freeSongCount    = artist.songs.filter(s => s.isFree).length;
          const premiumSongCount = artist.songs.filter(s => !s.isFree).length;
          const artistWords      = artist.songs.reduce((a, s) => a + s.lines.reduce((b, l) => b + l.words.length, 0), 0);

          return (
            <button
              key={artist.id}
              onClick={() => setSelectedArtist(artist)}
              className="rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 text-left group"
            >
              {/* Coloured header */}
              <div className="p-5 relative overflow-hidden" style={{ background: artist.gradient }}>
                <div className="absolute right-4 top-3 text-6xl opacity-20 group-hover:opacity-30 transition-opacity select-none">{artist.emoji}</div>
                <div className="relative z-10">
                  <div className="text-3xl mb-1">{artist.emoji}</div>
                  <h3 className="text-xl font-black text-white">{artist.name}</h3>
                  <p className="text-white/60 text-xs mt-0.5">{artist.genre}</p>
                </div>
              </div>
              {/* Stats footer */}
              <div className="bg-white dark:bg-gray-900 border border-t-0 border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
                <div className="flex gap-3 text-xs">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{freeSongCount} free</span>
                  {premiumSongCount > 0 && <span className="text-amber-600 dark:text-amber-400">{premiumSongCount} premium</span>}
                  <span className="text-gray-400 dark:text-gray-500">{artistWords} words</span>
                </div>
                <span className="text-gray-300 dark:text-gray-600 text-lg group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors">›</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default KPopSection;
