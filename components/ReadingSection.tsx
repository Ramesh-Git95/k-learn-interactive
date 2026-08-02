import React, { useState, useCallback, useMemo } from 'react';
import { Check, Lock } from 'lucide-react';
import { accentFor } from '../utils/moduleAccent';
import { findDeckWithWord, unsavedWords } from '../utils/srsLookup';

const ACC = accentFor('reading');
import { readingPassages } from '../data/readingData';
import type { ReadingPassage, ReadingWord, WordType } from '../data/readingData';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useSRSContext } from '../contexts/SRSContext';
import { useToastContext } from '../contexts/ToastContext';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import SoundItOutModal from './SoundItOutModal';
import { useUpgrade } from '../hooks/useUpgrade';

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
  adjective:   'bg-[#FBDCCB] text-[#A83619] dark:bg-[#5F2010]/30 dark:text-[#F07A55]',
  adverb:      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  particle:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  expression:  'bg-[#DDEBE4] text-[#265847] dark:bg-[#153327]/30 dark:text-[#6BA88F]',
  pronoun:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  conjunction: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

const DIFF_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  beginner:     { label: 'Beginner',     color: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
  intermediate: { label: 'Intermediate', color: '#3F8571', bg: 'bg-[#EEF5F1] dark:bg-[#153327]/20 text-[#265847] dark:text-[#93C2AE]' },
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
  const handleClick = (e: React.MouseEvent) => { e.stopPropagation(); onClick(); };
  return (
    <span
      onClick={handleClick}
      className={`inline cursor-pointer rounded transition-all duration-150 px-0.5
        ${hasDefinition
          ? isSelected
            ? 'bg-[#BFDACD] dark:bg-[#1D4436] text-[#153327] dark:text-white underline decoration-dotted underline-offset-2'
            : 'hover:bg-[#EEF5F1] dark:hover:bg-[#153327]/30 hover:text-[#265847] dark:hover:text-[#93C2AE]'
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
  onSoundItOut: () => void;
  onClose: () => void;
}

const DefPanel: React.FC<DefPanelProps> = ({ word, token, isPremium, onSRS, onSoundItOut, onClose }) => {
  const { startUpgrade } = useUpgrade();
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
          <button
            onClick={onSoundItOut}
            title="Sound it out — syllable by syllable"
            aria-label={`Sound out ${word.korean}`}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#E4572E] hover:bg-[#FDEEE6] dark:hover:bg-[#5F2010]/20 transition-colors text-base"
          >
            🔊
          </button>
          {isPremium ? (
            <button
              onClick={onSRS}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-black text-white rounded-xl hover:scale-105 transition-transform"
              style={{ background: 'var(--brand-gradient)' }}
            >
              + SRS
            </button>
          ) : (
            <button
              onClick={startUpgrade}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-black text-[#3F8571] border border-[#BFDACD] dark:border-[#265847] rounded-xl hover:bg-[#EEF5F1] dark:hover:bg-[#153327]/20 transition-colors"
              title="Premium: save to SRS"
            >
              🔒 SRS
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close definition"
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
  const [soundOut, setSoundOut] = useState<ReadingWord | null>(null);
  const [showEnglish, setShowEnglish] = useState(false);
  const [savedAll, setSavedAll] = useState(false);
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set());
  const { decks, actions: srsActions } = useSRSContext();
  const { showToast } = useToastContext();

  const selectedKey = selectedToken ? cleanToken(selectedToken) : null;
  const selectedWord = selectedKey ? (passage.wordMap[selectedKey] ?? null) : null;
  // Which deck already holds the tapped word, if any — so the button can say so
  // instead of inviting a press that would quietly do nothing.
  const savedIn = selectedWord ? findDeckWithWord(decks, selectedWord.korean) : null;
  const isSaved = !!selectedWord && (!!savedIn || justSaved.has(selectedWord.korean));

  const handleTokenClick = useCallback((token: string) => {
    const key = cleanToken(token);
    if (!key || !passage.wordMap[key]) return;
    setSelectedToken(prev => prev === token ? null : token);
    setTappedCount(n => n + 1);
    earnXP(1);
    markStudyToday();
  }, [passage.wordMap]);

  const DECK_NAME = 'Reading Vocabulary';

  const addWords = (words: ReadingWord[]) => {
    if (!words.length) return;
    const existing = decks.find(d => d.name === DECK_NAME);
    const deckId = existing ? existing.id : srsActions.createDeck(DECK_NAME, 'Words from reading passages');
    const already = new Set((existing?.cards ?? []).map(c => c.content.korean));
    let added = 0;
    words.forEach(w => {
      if (already.has(w.korean)) return;
      srsActions.addCardToDeck(deckId, {
        korean: w.korean,
        romanization: w.romanization,
        english: w.english,
        type: 'vocabulary',
        category: `Reading: ${passage.title}`,
      });
      added++;
    });
    setJustSaved(prev => {
      const next = new Set(prev);
      words.forEach(w => next.add(w.korean));
      return next;
    });
    earnXP(3);
    const skipped = words.length - added;
    showToast(
      added === 0
        ? `Already in ${DECK_NAME}`
        : `${added} added to ${DECK_NAME}${skipped ? ` · ${skipped} already there` : ''}`,
      'success',
    );
  };

  const handleAddSRS = () => { if (selectedWord) addWords([selectedWord]); };

  // The glossary is the passage's own wordMap, listed in the order the words
  // first appear rather than however the object happens to be keyed — so
  // following the rail down matches reading the passage across.
  const glossary = useMemo(() => {
    const seen: ReadingWord[] = [];
    const taken = new Set<string>();
    passage.lines.forEach(line => line.split(/\s+/).forEach(tok => {
      const key = cleanToken(tok);
      const w = passage.wordMap[key];
      if (w && !taken.has(key)) { taken.add(key); seen.push(w); }
    }));
    // Anything defined but not matched by tokenising still belongs in the list.
    Object.entries(passage.wordMap).forEach(([k, w]) => {
      if (!taken.has(k)) { taken.add(k); seen.push(w); }
    });
    return seen;
  }, [passage]);

  // Only the words not already saved somewhere — so the button offers real
  // work rather than a no-op.
  const newWords = useMemo(
    () => unsavedWords(decks, glossary).filter(w => !justSaved.has(w.korean)),
    [decks, glossary, justSaved],
  );

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.75;
    window.speechSynthesis.speak(u);
  };

  const railCard = 'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <div className="min-w-0">
          <button
            onClick={onBack}
            className="mb-2 text-[12.5px] font-medium text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← All passages
          </button>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            {passage.title}
            <span className="text-[#4A5566] dark:text-gray-500"> · TOPIK {passage.topikLevel}</span>
          </h1>
          <p className="mt-1 font-korean text-[15px] text-[#4A5566] dark:text-gray-400">{passage.titleKorean}</p>
        </div>
        <div className="flex flex-none items-center gap-3.5">
          <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">
            {passage.lines.length} lines · {glossary.length} words defined
          </span>
          {!isRead && (
            <button
              onClick={() => { onMarkRead(passage.id); earnXP(10); markStudyToday(); }}
              className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
            >
              Mark as read
            </button>
          )}
          {isRead && (
            <span className="flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: ACC.light }}>
              <Check className="h-4 w-4" /> Read
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        {/* ── The passage ── */}
        <div className="order-1 w-full min-w-0 flex-1">
          <div
            className="mb-4 flex items-start gap-3 rounded-r-lg border-l-[3px] px-4 py-3 sm:items-center"
            style={{ borderColor: ACC.light, background: `${ACC.light}14` }}
          >
            <span className="kl-accent flex-none whitespace-nowrap text-[12.5px] font-semibold"
                  style={{ ['--kl-acc' as string]: ACC.light, ['--kl-acc-dk' as string]: ACC.dark }}>
              HOW TO READ THIS
            </span>
            <span className="text-[13.5px] leading-snug text-[#16202F] dark:text-gray-200">
              Read it through once without stopping. Underlined words are in the glossary — no tapping needed.
            </span>
          </div>

          <div className="kl-card p-6 sm:p-8">
            <div className="max-w-[62ch]" onClick={() => setSelectedToken(null)}>
              {passage.lines.map((line, li) => (
                <p key={li} className="mb-5 font-korean text-[21px] leading-[1.95] text-[#16202F] last:mb-0 sm:text-[25px] dark:text-white">
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
                        onClick={() => handleTokenClick(token)}
                      />
                    );
                  })}
                </p>
              ))}
            </div>

            {showEnglish && (
              <div className="kl-well mt-6 rounded-xl p-4">
                <div className="mb-2 text-[12.5px] font-semibold text-[#4A5566] dark:text-gray-400">
                  WORD BY WORD, NOT A TRANSLATION
                </div>
                <p className="text-[14px] leading-relaxed text-[#3E4A5A] dark:text-gray-300">
                  {glossary.map(w => `${w.korean} = ${w.english}`).join(' · ')}
                </p>
              </div>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[rgba(20,32,47,0.12)] pt-6 dark:border-gray-800">
              <button
                onClick={() => speak(passage.lines.join(' '))}
                className="flex h-12 items-center gap-2.5 rounded-[10px] px-5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
              >
                <span className="flex h-3.5 items-end gap-[2.5px]" aria-hidden="true">
                  <span className="kl-bar w-[3px] bg-white" style={{ height: '100%' }} />
                  <span className="kl-bar w-[3px] bg-white" style={{ height: '100%', animationDelay: '0.15s' }} />
                  <span className="kl-bar w-[3px] bg-white" style={{ height: '100%', animationDelay: '0.3s' }} />
                </span>
                Read it to me
              </button>
              <button
                onClick={() => setShowEnglish(v => !v)}
                className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
              >
                {showEnglish ? 'Hide the words' : 'Show the words'}
              </button>
              <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">
                Audio is read slowly.
              </span>
            </div>
          </div>

          {tappedCount === 0 && (
            <p className="mt-3 text-[12.5px] text-[#4A5566] dark:text-gray-500">
              Tap an underlined word to hear it or send it to a deck — its meaning is already in the glossary.
            </p>
          )}
        </div>

        {/* ── Glossary rail, always open ── */}
        <div className="order-2 w-full flex-none lg:w-[290px]">
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-1 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Glossary</div>
            <p className="mb-3.5 text-[12px] text-[#4A5566] dark:text-gray-500">
              Every underlined word, in the order it appears.
            </p>
            <div className="flex max-h-[420px] flex-col gap-3.5 overflow-y-auto">
              {glossary.map(w => {
                const isSel = selectedWord?.korean === w.korean;
                return (
                  <div
                    key={w.korean}
                    className="rounded-lg px-2 py-1.5 transition-colors"
                    style={isSel ? { background: `${ACC.light}14`, boxShadow: `inset 2px 0 0 ${ACC.light}` } : undefined}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-korean text-[19px] font-bold text-[#16202F] dark:text-white">{w.korean}</span>
                      <button
                        onClick={() => setSoundOut(w)}
                        className="flex-none text-[11.5px] font-medium text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-500 dark:hover:text-gray-300"
                        title={`Sound out ${w.korean}`}
                      >
                        hear
                      </button>
                    </div>
                    <div className="mt-1 text-[13px] text-[#4A5566] dark:text-gray-400">
                      {w.romanization} — {w.english}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => { addWords(newWords); setSavedAll(true); }}
              disabled={savedAll || !isAuthenticated || newWords.length === 0}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[9px] border border-[rgba(20,32,47,0.2)] text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] disabled:opacity-60 dark:border-gray-700 dark:text-gray-200"
            >
              {!isAuthenticated ? 'Sign in to save these'
                : newWords.length === 0
                ? <><Check className="h-4 w-4" style={{ color: ACC.light }} /> All {glossary.length} already saved</>
                : savedAll
                ? <><Check className="h-4 w-4" style={{ color: ACC.light }} /> Saved to deck</>
                : `Save ${newWords.length} new ${newWords.length === 1 ? 'word' : 'words'}`}
            </button>
          </div>

          {selectedWord && (
            <div className={`${railCard} mb-3.5`}>
              <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Tapped word</div>
              <div className="font-korean text-[24px] font-bold text-[#16202F] dark:text-white">{selectedWord.korean}</div>
              <div className="mt-1.5 text-[13.5px] text-[#4A5566] dark:text-gray-400">
                {selectedWord.romanization} — {selectedWord.english}
              </div>
              {selectedWord.type && (
                <div className="mt-1 text-[12.5px] text-[#4A5566] dark:text-gray-500">{selectedWord.type}</div>
              )}
              <div className="mt-3.5 flex gap-2.5">
                <button
                  onClick={() => setSoundOut(selectedWord)}
                  className="flex h-11 flex-1 items-center justify-center rounded-[9px] border border-[rgba(20,32,47,0.2)] text-[13px] font-semibold text-[#16202F] dark:border-gray-700 dark:text-gray-200"
                >
                  Sound it out
                </button>
                {isSaved ? (
                  <span
                    className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[9px] text-[13px] font-semibold"
                    style={{ background: `${ACC.light}1A`, color: ACC.light }}
                    title={savedIn ? `Already in "${savedIn.name}"` : 'Saved to your deck'}
                  >
                    <Check className="h-3.5 w-3.5" /> In your deck
                  </span>
                ) : (
                  <button
                    onClick={handleAddSRS}
                    disabled={!isAuthenticated}
                    className="flex h-11 flex-1 items-center justify-center rounded-[9px] text-[13px] font-semibold text-white disabled:opacity-50"
                    style={{ background: ACC.light }}
                  >
                    Add to deck
                  </button>
                )}
              </div>
            </div>
          )}

          <div className={railCard}>
            <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">How this helps</div>
            <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
              Reading whole sentences is where grammar you have studied starts to feel ordinary. Do
              not stop at every word — finish the passage, then come back for the ones that mattered.
            </p>
          </div>
        </div>
      </div>

      {/* Sound-it-out (syllable player) modal */}
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

// ── Passage library ───────────────────────────────────────────────────────────

const ReadingSection: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();
  const { isPremium } = useFeatureAccess();
  const { startUpgrade } = useUpgrade();

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
  const readCount = readPassages.size;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-6 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            Reading
          </h1>
          <p className="mt-2 max-w-[60ch] text-[15px] text-[#3E4A5A] dark:text-gray-400">
            Short passages with every word defined beside them. This is where the grammar you have
            studied starts to feel ordinary.
          </p>
        </div>
        <div className="flex-none">
          <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
            {readCount} of {readingPassages.length} read
          </div>
          <div className="h-1.5 w-[200px] overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${(readCount / readingPassages.length) * 100}%`, background: ACC.light }} />
          </div>
        </div>
      </div>

      {/* Difficulty filter */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[12.5px] text-[#4A5566] dark:text-gray-500">Level:</span>
        {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(f => (
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
            {f}
          </button>
        ))}
      </div>

      {/* Passages */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p, i) => {
          const locked = !p.isFree && !isPremium;
          const read = readPassages.has(p.id);
          const wordCount = p.lines.join(' ').split(/\s+/).length;
          const defined = Object.keys(p.wordMap).length;

          if (locked) {
            return (
              <button
                key={p.id}
                onClick={startUpgrade}
                className="kl-premium kl-cascade flex flex-col items-start rounded-[18px] p-5 text-left"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-white"
                  style={{ background: 'var(--brand-gradient)' }}
                >
                  <Lock className="h-4 w-4" />
                </span>
                <span className="font-korean text-[16px] font-semibold text-[#16202F] dark:text-white">{p.titleKorean}</span>
                <span className="mt-0.5 text-[13px] text-[#4A5566] dark:text-gray-400">{p.title}</span>
                <span className="mt-3 text-[12.5px] text-[#4A5566] dark:text-gray-500">
                  TOPIK {p.topikLevel} · {wordCount} words
                </span>
                <span className="mt-3 text-[13px] font-semibold text-[#C13F22] dark:text-[#F07A55]">
                  Unlock · $4/mo →
                </span>
              </button>
            );
          }

          return (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className="kl-card kl-cascade flex flex-col p-5 text-left transition-transform duration-200 hover:-translate-y-1"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-xl font-korean text-[19px] font-bold"
                  style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D`, color: ACC.light }}
                >
                  {p.titleKorean.charAt(0)}
                </span>
                {read && (
                  <span className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: ACC.light }}>
                    <Check className="h-3.5 w-3.5" /> read
                  </span>
                )}
              </div>

              <div className="mt-4 font-korean text-[16px] font-semibold text-[#16202F] dark:text-white">{p.titleKorean}</div>
              <div className="mt-0.5 flex-1 text-[13.5px] text-[#4A5566] dark:text-gray-400">{p.title}</div>

              <div className="mt-3 text-[12.5px] text-[#4A5566] dark:text-gray-500">
                TOPIK {p.topikLevel} · {wordCount} words · {defined} defined
              </div>

              <span className="mt-3.5 text-[13px] font-semibold" style={{ color: ACC.light }}>
                {read ? 'Read it again →' : 'Read this →'}
              </span>
            </button>
          );
        })}
      </div>

      {!isAuthenticated && (
        <div className="kl-card mt-5 flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="min-w-[240px] flex-1 text-[14px] text-[#3E4A5A] dark:text-gray-400">
            Sign up free to open the passages, keep your place, and send words straight to a review deck.
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
    </div>
  );
};

export default ReadingSection;
