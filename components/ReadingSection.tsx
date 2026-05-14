import React, { useState, useCallback } from 'react';
import { readingPassages } from '../data/readingData';
import type { ReadingPassage, ReadingWord, WordType } from '../data/readingData';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useSRSContext } from '../contexts/SRSContext';
import { useToastContext } from '../contexts/ToastContext';
import { earnXP, markStudyToday } from '../utils/xpStreak';

const GUMROAD_URL = 'https://learnk.gumroad.com/l/klearn-lifetime';

const TYPE_LABEL: Record<WordType, string> = {
  noun:        'Noun',
  verb:        'Verb',
  adjective:   'Adj',
  adverb:      'Adv',
  particle:    'Particle',
  expression:  'Expr',
  pronoun:     'Pronoun',
  conjunction: 'Conj',
};

const TYPE_COLOR: Record<WordType, string> = {
  noun:        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  verb:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  adjective:   'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  adverb:      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  particle:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  expression:  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  pronoun:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  conjunction: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

const DIFF_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  beginner:     { label: 'Beginner',     color: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
  intermediate: { label: 'Intermediate', color: '#8B5CF6', bg: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' },
  advanced:     { label: 'Advanced',     color: '#EF4444', bg: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
};

const CAT_ICON: Record<string, string> = {
  daily:   '🏠',
  culture: '🎭',
  travel:  '✈️',
  food:    '🍜',
};

// Strip leading/trailing punctuation so "먹어요." → "먹어요" for map lookup
function cleanToken(t: string): string {
  return t.replace(/^["""''()\[\]]+|["""''()\[\].,!?:;…·—]+$/g, '').trim();
}

// ── Word chip inside the reader ───────────────────────────────────────────────

interface WordChipProps {
  token: string;
  isSelected: boolean;
  hasDefinition: boolean;
  onClick: () => void;
}

const WordChip: React.FC<WordChipProps> = ({ token, isSelected, hasDefinition, onClick }) => {
  const punct = token !== cleanToken(token);
  return (
    <span
      onClick={onClick}
      className={`inline cursor-pointer rounded transition-all duration-150 px-0.5
        ${hasDefinition
          ? isSelected
            ? 'bg-violet-200 dark:bg-violet-800 text-violet-900 dark:text-white underline decoration-dotted underline-offset-2'
            : 'hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300'
          : 'text-gray-500 dark:text-gray-500 cursor-default'
        }
        ${isSelected ? 'font-semibold' : ''}
      `}
    >
      {token}
    </span>
  );
};

// ── Word definition panel (bottom of reader) ─────────────────────────────────

interface DefPanelProps {
  word: ReadingWord | null;
  token: string;
  isPremium: boolean;
  onSRS: () => void;
  onClose: () => void;
}

const DefPanel: React.FC<DefPanelProps> = ({ word, token, isPremium, onSRS, onClose }) => {
  if (!word) return null;
  return (
    <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xl font-black text-gray-900 dark:text-white">{word.korean}</span>
            {word.type && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${TYPE_COLOR[word.type]}`}>
                {TYPE_LABEL[word.type]}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1">{word.romanization}</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{word.english}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPremium ? (
            <button
              onClick={onSRS}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-black text-white rounded-xl hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
            >
              + SRS
            </button>
          ) : (
            <a
              href={GUMROAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-black text-violet-500 border border-violet-200 dark:border-violet-700 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              title="Premium: save to SRS"
            >
              🔒 SRS
            </a>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Passage reader ────────────────────────────────────────────────────────────

interface ReaderProps {
  passage: ReadingPassage;
  isPremium: boolean;
  isAuthenticated: boolean;
  onBack: () => void;
  onMarkRead: (id: string) => void;
  isRead: boolean;
}

const PassageReader: React.FC<ReaderProps> = ({ passage, isPremium, isAuthenticated, onBack, onMarkRead, isRead }) => {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [tappedCount, setTappedCount] = useState(0);
  const { decks, actions: srsActions } = useSRSContext();
  const { showToast } = useToastContext();

  const selectedKey = selectedToken ? cleanToken(selectedToken) : null;
  const selectedWord = selectedKey ? (passage.wordMap[selectedKey] ?? null) : null;

  const handleTokenClick = useCallback((token: string) => {
    const key = cleanToken(token);
    if (!key || !passage.wordMap[key]) return;
    setSelectedToken(prev => prev === token ? null : token);
    setTappedCount(n => n + 1);
    earnXP(1);
    markStudyToday();
  }, [passage.wordMap]);

  const handleAddSRS = () => {
    if (!selectedWord) return;
    const deckName = 'Reading Vocabulary';
    const existing = decks.find(d => d.name === deckName);
    const deckId = existing ? existing.id : srsActions.createDeck(deckName, 'Words from reading passages');
    srsActions.addCardToDeck(deckId, {
      korean: selectedWord.korean,
      romanization: selectedWord.romanization,
      english: selectedWord.english,
      type: 'vocabulary',
      category: `Reading: ${passage.title}`,
    });
    earnXP(3);
    showToast(`Added "${selectedWord.korean}" to SRS`, 'success');
  };

  const coverageCount = Object.keys(passage.wordMap).length;

  return (
    <div className="flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-4 pb-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
        >
          ← All Passages
        </button>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${DIFF_STYLE[passage.difficulty].bg}`}>
                {DIFF_STYLE[passage.difficulty].label}
              </span>
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                TOPIK {passage.topikLevel} · {CAT_ICON[passage.category]}
              </span>
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">{passage.titleKorean}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{passage.title}</p>
          </div>
          {isRead && (
            <span className="flex-shrink-0 text-xs font-black px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              ✓ Read
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Tap any highlighted word to see its definition.
          <span className="ml-1 text-violet-500">{coverageCount} words defined.</span>
        </p>
      </div>

      {/* Reading text */}
      <div
        className="px-4 sm:px-6 pb-4 flex-1"
        onClick={() => setSelectedToken(null)}
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          {passage.lines.map((line, li) => (
            <p key={li} className="text-lg sm:text-xl leading-relaxed mb-3 last:mb-0 font-medium text-gray-900 dark:text-white">
              {line.split(/(\s+)/).map((token, ti) => {
                if (/^\s+$/.test(token)) return <span key={ti}> </span>;
                const key = cleanToken(token);
                const hasDef = !!passage.wordMap[key];
                const isSelected = selectedToken === token;
                return (
                  <WordChip
                    key={`${li}-${ti}`}
                    token={token}
                    isSelected={isSelected}
                    hasDefinition={hasDef}
                    onClick={(e: any) => { e.stopPropagation(); handleTokenClick(token); }}
                  />
                );
              })}
            </p>
          ))}
        </div>

        {/* Hint on first visit */}
        {tappedCount === 0 && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3 animate-pulse">
            👆 Tap a word to see its meaning
          </p>
        )}

        {/* Mark as read */}
        {!isRead && (
          <button
            onClick={() => { onMarkRead(passage.id); earnXP(10); markStudyToday(); }}
            className="mt-4 w-full py-3 text-sm font-black rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-violet-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            ✓ Mark as Read (+10 XP)
          </button>
        )}
      </div>

      {/* Definition panel — sticky at bottom of passage card */}
      <div className="sticky bottom-0 rounded-b-2xl overflow-hidden shadow-lg">
        <DefPanel
          word={selectedWord}
          token={selectedToken ?? ''}
          isPremium={isPremium}
          onSRS={handleAddSRS}
          onClose={() => setSelectedToken(null)}
        />
      </div>
    </div>
  );
};

// ── Passage library ───────────────────────────────────────────────────────────

const ReadingSection: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();
  const { subscriptionTier } = useFeatureAccess();
  const isPremium = subscriptionTier === 'premium';

  const [selectedPassage, setSelectedPassage] = useState<ReadingPassage | null>(null);
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [readPassages, setReadPassages] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('k-learn-read-passages') || '[]')); }
    catch { return new Set(); }
  });

  const markRead = useCallback((id: string) => {
    setReadPassages(prev => {
      const next = new Set(prev).add(id);
      localStorage.setItem('k-learn-read-passages', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const handleSelect = (p: ReadingPassage) => {
    if (!isAuthenticated) { openRegister(); return; }
    if (!p.isFree && !isPremium) return; // card shows lock, clicking does nothing
    setSelectedPassage(p);
  };

  const visible = readingPassages.filter(p => filter === 'all' || p.difficulty === filter);

  if (selectedPassage) {
    return (
      <PassageReader
        passage={selectedPassage}
        isPremium={isPremium}
        isAuthenticated={isAuthenticated}
        onBack={() => setSelectedPassage(null)}
        onMarkRead={markRead}
        isRead={readPassages.has(selectedPassage.id)}
      />
    );
  }

  // ── Library ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-6 p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {['읽기', '독해', '이해', '단어', '문장', '한국어'].map((w, i) => (
            <span key={i} className="absolute text-white/5 font-black"
              style={{ fontSize: `${1.2 + (i % 3) * 0.5}rem`, top: `${(i * 37) % 88}%`, left: `${(i * 43) % 82}%` }}>{w}</span>
          ))}
        </div>
        <div className="relative z-10 text-center">
          <div className="text-4xl mb-2">📖</div>
          <h1 className="text-xl sm:text-2xl font-black text-white mb-1">Reading Passages</h1>
          <p className="text-white/70 text-xs">Tap any word for an instant definition · 단어를 탭하면 뜻이 나와요</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Passages Read', value: readPassages.size, total: readingPassages.length },
          { label: 'Beginner',      value: readingPassages.filter(p => p.difficulty === 'beginner' && readPassages.has(p.id)).length,     total: readingPassages.filter(p => p.difficulty === 'beginner').length },
          { label: 'Premium',       value: readingPassages.filter(p => !p.isFree && readPassages.has(p.id)).length, total: readingPassages.filter(p => !p.isFree).length },
        ].map(({ label, value, total }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 text-center">
            <p className="text-lg font-black text-gray-900 dark:text-white">{value}<span className="text-xs text-gray-400">/{total}</span></p>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Difficulty filter */}
      <div className="flex rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm mb-5">
        {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2.5 text-xs font-black capitalize transition-all ${
              filter === f ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            style={filter === f ? { background: 'linear-gradient(135deg, #203a43, #2c5364)' } : {}}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Passage grid */}
      <div className="space-y-3">
        {visible.map(p => {
          const locked = !p.isFree && !isPremium;
          const read = readPassages.has(p.id);
          const diff = DIFF_STYLE[p.difficulty];
          const wordCount = p.lines.join(' ').split(/\s+/).length;

          return (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              disabled={locked && !isAuthenticated}
              className={`w-full text-left bg-white dark:bg-gray-900 rounded-2xl border transition-all duration-200 overflow-hidden
                ${locked
                  ? 'border-gray-100 dark:border-gray-800 opacity-75'
                  : read
                    ? 'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700'
                    : 'border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-700 hover:shadow-md'
                }
              `}
            >
              <div className="flex items-center gap-4 p-4">
                {/* Category icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  locked ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800'
                }`}>
                  {locked ? '🔒' : read ? '✅' : CAT_ICON[p.category]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${diff.bg}`}>
                      {diff.label}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                      TOPIK {p.topikLevel}
                    </span>
                    {p.isFree && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        FREE
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-black text-gray-900 dark:text-white truncate">{p.titleKorean}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.title}</p>
                </div>

                {/* Meta */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500">{wordCount} words</p>
                  <p className="text-[10px] text-gray-300 dark:text-gray-600 capitalize">{p.category}</p>
                  {!locked && (
                    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-1 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Locked upgrade strip */}
              {locked && (
                <a
                  href={GUMROAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
                >
                  <span className="text-xs text-white/70">⭐ Premium · All passages + SRS</span>
                  <span className="text-xs font-black text-white">Unlock →</span>
                </a>
              )}
            </button>
          );
        })}
      </div>

      {/* Not logged in nudge */}
      {!isAuthenticated && (
        <div className="mt-5 text-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Sign up to save your progress and unlock all features</p>
          <button
            onClick={openRegister}
            className="px-6 py-2 text-sm font-black text-white rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
          >
            Get Started Free →
          </button>
        </div>
      )}
    </div>
  );
};

export default ReadingSection;
