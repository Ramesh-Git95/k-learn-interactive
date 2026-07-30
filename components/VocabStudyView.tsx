import React, { useEffect, useState } from 'react';
import { Heart, Lightbulb, Plus, X, AudioLines, ArrowLeft, ArrowRight } from 'lucide-react';
import type { Bookmark, VocabCategory, VocabItem } from '../types';
import AddToSRS from './AddToSRS';
import PronunciationButton from './PronunciationButton';
import SoundItOutModal from './SoundItOutModal';
import { accentFor } from '../utils/moduleAccent';

// Studying one set of words, in the mockup's 2a layout.
//
// The mockup draws an SRS grading drill here (not yet / almost / knew it), but
// that is what SRSStudySession already does. So the LAYOUT is adopted — one word
// centre stage, the set's state in a 290px rail — while the three grading
// buttons are replaced by this screen's real actions: examples, add to a deck,
// and pronunciation practice. Revealing the meaning is what marks a word
// studied, which is the job the flip card used to do.

const ACC = accentFor('vocabulary');

interface Props {
  category: VocabCategory;
  /** Already sliced for guests — never render more than this. */
  items: VocabItem[];
  isStudied: (item: VocabItem) => boolean;
  isBookmarked: (item: VocabItem) => boolean;
  toggleBookmark: (item: Bookmark) => void;
  /** Returns false when the daily limit blocks the study. */
  onStudy: (item: VocabItem) => boolean;
  limitReached: boolean;
  isAuthenticated: boolean;
  onExit: () => void;
}

const VocabStudyView: React.FC<Props> = ({
  category, items, isStudied, isBookmarked, toggleBookmark,
  onStudy, limitReached, isAuthenticated, onExit,
}) => {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showAddToSRS, setShowAddToSRS] = useState(false);
  const [showSoundItOut, setShowSoundItOut] = useState(false);

  const item = items[index];
  const studied = item ? isStudied(item) : false;
  const examples = item?.examples ?? [];

  // A word already studied shows its meaning straight away — re-hiding what the
  // learner has seen would be busywork.
  useEffect(() => { setRevealed(studied); }, [index, studied]);

  const blocked = limitReached && !studied;

  const reveal = () => {
    if (revealed || !item) return;
    if (!studied) {
      if (onStudy(item) === false) return; // daily limit
    }
    setRevealed(true);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const go = (delta: number) => {
    setIndex(i => Math.min(items.length - 1, Math.max(0, i + delta)));
  };

  // Keyboard: space/enter reveals, arrows move through the set. Held back while
  // a modal is open, or the keys would drive the card hidden behind it.
  const modalOpen = showExamples || showAddToSRS || showSoundItOut;
  useEffect(() => {
    if (modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); revealed ? go(1) : reveal(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!item) return null;

  const studiedCount = items.filter(isStudied).length;
  const pct = items.length ? (studiedCount / items.length) * 100 : 0;

  const requireAuth = (action: () => void) => () => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
      return;
    }
    action();
  };

  const actionBtn = (
    onClick: () => void, icon: React.ReactNode, label: string, title: string, locked: boolean,
  ) => (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.2)] px-4 text-[14px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
    >
      {icon}
      {locked ? `${label} · sign in` : label}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
          Word {index + 1} of {items.length}
        </h1>
        <div className="flex items-center gap-3.5">
          <span className="hidden text-[13.5px] text-[#4A5566] sm:inline dark:text-gray-500">
            Progress saves automatically
          </span>
          <button
            onClick={onExit}
            className="flex h-10 items-center rounded-[9px] border border-[rgba(20,32,47,0.2)] px-3.5 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
          >
            Exit set
          </button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        {/* ── The word ── */}
        <div className="w-full min-w-0 flex-1">
          <div className="kl-card relative flex flex-col items-stretch gap-7 p-7 sm:p-8 md:flex-row md:items-center md:gap-9">
            {/* Bookmark lives on the card, as before */}
            <button
              onClick={() => { toggleBookmark(item); if ('vibrate' in navigator) navigator.vibrate(50); }}
              className="absolute right-4 top-4 rounded-lg p-1.5 transition-colors"
              title={isBookmarked(item) ? 'Saved — tap to remove' : 'Save this word'}
              aria-label={isBookmarked(item) ? 'Remove bookmark' : 'Add bookmark'}
            >
              <Heart
                className={`h-[18px] w-[18px] ${isBookmarked(item) ? '' : 'text-[#4A5566] dark:text-gray-500'}`}
                style={isBookmarked(item) ? { color: '#C13F22' } : undefined}
                fill={isBookmarked(item) ? '#C13F22' : 'none'}
              />
            </button>

            {/* Left: the Korean */}
            <div className="flex-none text-center md:min-w-[250px]">
              <div className="mb-4 text-[12.5px] font-semibold" style={{ color: ACC.light }}>
                {studied ? 'YOU HAVE STUDIED THIS' : 'DO YOU KNOW THIS WORD?'}
              </div>
              <div className="break-words font-korean text-[52px] font-bold leading-none text-[#16202F] sm:text-[64px] dark:text-white">
                {item.korean}
              </div>
              <div className="mt-3 text-[16px] text-[#4A5566] dark:text-gray-400">{item.romanization}</div>
              <button
                onClick={() => setShowSoundItOut(true)}
                className="mt-4 inline-flex h-11 items-center gap-2.5 rounded-[9px] border-[1.5px] px-4 text-[14px] font-semibold transition-colors"
                style={{ borderColor: `${ACC.light}80`, color: ACC.light }}
                title="Sound it out — syllable by syllable"
              >
                <span className="flex h-3 items-end gap-[2.5px]" aria-hidden="true">
                  <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light }} />
                  <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.15s' }} />
                  <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.3s' }} />
                </span>
                Hear it
              </button>
            </div>

            {/* Right: the meaning, once revealed */}
            <div className="min-w-0 flex-1 border-t border-[rgba(20,32,47,0.12)] pt-6 md:border-l md:border-t-0 md:pl-9 md:pt-0 dark:border-gray-800">
              {revealed ? (
                <>
                  <div className="break-words font-display text-[28px] font-semibold tracking-[-0.02em] text-[#16202F] sm:text-[32px] dark:text-white">
                    {item.english}
                  </div>
                  {/* One example inline — but only for signed-in users, since the
                      full examples list has always been behind sign-in. */}
                  {isAuthenticated && examples[0] && (
                    <div className="kl-well mt-5 rounded-xl px-4 py-3.5">
                      <div className="font-korean text-[19px] font-semibold text-[#16202F] dark:text-white">
                        {examples[0].korean}
                      </div>
                      <div className="mt-1.5 text-[13.5px] text-[#4A5566] dark:text-gray-400">
                        {examples[0].romanization ? `${examples[0].romanization} · ` : ''}“{examples[0].english}”
                      </div>
                    </div>
                  )}
                  {!isAuthenticated && examples.length > 0 && (
                    <p className="mt-4 text-[13.5px] text-[#4A5566] dark:text-gray-400">
                      Sign in to see this word used in a sentence.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[15px] leading-[1.6] text-[#3E4A5A] dark:text-gray-400">
                    Have a guess first — you remember far more by trying than by reading.
                  </p>
                  <button
                    onClick={reveal}
                    disabled={blocked}
                    className="mt-5 flex h-12 items-center rounded-[10px] px-6 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
                    style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}52` }}
                  >
                    Show meaning
                  </button>
                  {blocked && (
                    <p className="mt-3 text-[13px] text-[#C13F22] dark:text-[#F07A55]">
                      You've reached today's free word limit.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── What you can do with this word ── */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {examples.length > 0 && actionBtn(
              requireAuth(() => setShowExamples(true)),
              <Lightbulb className="h-4 w-4" />, 'Examples',
              isAuthenticated ? 'See example sentences' : 'Sign in to see examples',
              !isAuthenticated,
            )}
            {actionBtn(
              requireAuth(() => setShowAddToSRS(true)),
              <Plus className="h-4 w-4" />, 'Add to deck',
              isAuthenticated ? 'Add this word to a spaced repetition deck' : 'Sign in to add to a deck',
              !isAuthenticated,
            )}
            <PronunciationButton
              korean={item.korean}
              romanization={item.romanization}
              size="sm"
              hintKey={index === 0 ? 'vocab' : undefined}
            />
          </div>

          {/* ── Move through the set ── */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => go(-1)}
              disabled={index === 0}
              className="flex h-12 items-center gap-2 rounded-[10px] border border-[rgba(20,32,47,0.14)] bg-[rgba(255,252,244,0.7)] px-4 text-[14px] font-medium text-[#4A5566] transition-colors hover:text-[#16202F] disabled:opacity-40 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
            {index < items.length - 1 ? (
              <button
                onClick={() => go(1)}
                className="flex h-12 flex-1 items-center justify-between rounded-[10px] border border-[rgba(20,32,47,0.14)] bg-[rgba(255,252,244,0.7)] px-5 transition-colors hover:bg-[#FFFCF4] dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-900"
              >
                <span className="text-[14px] font-semibold text-[#16202F] dark:text-white">
                  Next word: <span className="font-korean">{items[index + 1].korean}</span>
                </span>
                <ArrowRight className="h-4 w-4" style={{ color: ACC.light }} />
              </button>
            ) : (
              <button
                onClick={onExit}
                className="flex h-12 flex-1 items-center justify-center rounded-[10px] px-5 text-[14px] font-semibold text-white"
                style={{ background: ACC.light }}
              >
                {studiedCount === items.length ? 'Set complete — back to sets' : 'Back to sets'}
              </button>
            )}
          </div>
        </div>

        {/* ── Rail: the set at a glance ── */}
        <div className="w-full flex-none lg:w-[290px]">
          <div className="rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">This set</div>
            <div className="mb-3.5 h-2 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: ACC.light }} />
            </div>
            <div className="flex gap-5 text-[13.5px] text-[#4A5566] dark:text-gray-400">
              <span><strong className="font-semibold text-[#16202F] dark:text-white">{studiedCount}</strong> studied</span>
              <span><strong className="font-semibold text-[#16202F] dark:text-white">{items.length - studiedCount}</strong> to go</span>
            </div>
          </div>

          <div className="mt-3.5 rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="text-[13.5px] font-semibold text-[#16202F] dark:text-white">
              Words in {category.name}
            </div>
            <p className="mb-2.5 mt-1 text-[12px] text-[#4A5566] dark:text-gray-500">
              Tap any word to jump straight to it.
            </p>
            <div className="-mx-2 flex max-h-[320px] flex-col overflow-y-auto">
              {items.map((w, i) => {
                const done = isStudied(w);
                const now = i === index;
                return (
                  <button
                    key={w.korean}
                    onClick={() => setIndex(i)}
                    aria-current={now ? 'true' : undefined}
                    title={`Go to ${w.korean} — ${w.english}`}
                    className={`flex items-baseline justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                      now ? '' : 'hover:bg-[rgba(20,32,47,0.05)] dark:hover:bg-white/5'
                    }`}
                    style={now ? { background: `${ACC.light}14`, boxShadow: `inset 2px 0 0 ${ACC.light}` } : undefined}
                  >
                    <span className={`min-w-0 truncate font-korean text-[16px] font-semibold ${
                      now ? 'text-[#16202F] dark:text-white' : done ? 'text-[#16202F] dark:text-gray-200' : 'text-[#16202F]/60 dark:text-gray-500'
                    }`}>
                      {w.korean}{' '}
                      <span className="font-sans text-[12.5px] font-medium text-[#4A5566] dark:text-gray-500">{w.english}</span>
                    </span>
                    <span className="flex flex-none items-center gap-1.5 text-[12.5px] font-medium">
                      {now && <span className="kl-pulse inline-block h-1.5 w-1.5 rounded-full" style={{ background: ACC.light }} />}
                      <span style={{ color: now ? '#16202F' : done ? ACC.light : undefined }}
                            className={now ? 'font-semibold dark:text-white' : done ? '' : 'text-[#4A5566] dark:text-gray-500'}>
                        {now ? 'now' : done ? 'studied' : i === index + 1 ? 'next' : ''}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals (unchanged behaviour) ── */}
      {showExamples && examples.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowExamples(false)}>
          <div className="kl-card max-h-[80vh] w-full max-w-lg overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-display text-[17px] font-semibold text-[#16202F] dark:text-white">
                <span className="font-korean">{item.korean}</span> in a sentence
              </h3>
              <button
                onClick={() => setShowExamples(false)}
                aria-label="Close examples"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[#4A5566] transition-colors hover:bg-[rgba(20,32,47,0.06)] dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {examples.map((ex, i) => (
                <div key={i} className="kl-well rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex-1 font-korean text-[17px] font-semibold text-[#16202F] dark:text-white">{ex.korean}</p>
                    <button
                      onClick={() => {
                        if ('speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                          const u = new SpeechSynthesisUtterance(ex.korean);
                          u.lang = 'ko-KR'; u.rate = 0.8;
                          window.speechSynthesis.speak(u);
                        }
                      }}
                      aria-label="Pronounce example"
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[#4A5566] transition-colors hover:text-[#2E6B59] dark:hover:text-[#5FB89B]"
                    >
                      <AudioLines className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[13.5px] text-[#3E4A5A] dark:text-gray-300">{ex.english}</p>
                  {ex.romanization && <p className="mt-1 text-[12.5px] text-[#4A5566] dark:text-gray-500">{ex.romanization}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSoundItOut && (
        <SoundItOutModal
          korean={item.korean}
          english={item.english}
          romanization={item.romanization}
          onClose={() => setShowSoundItOut(false)}
        />
      )}

      {showAddToSRS && (
        <AddToSRS
          content={{ korean: item.korean, english: item.english, romanization: item.romanization, type: 'vocabulary', category: item.category }}
          onClose={() => setShowAddToSRS(false)}
          onSuccess={() => setShowAddToSRS(false)}
        />
      )}
    </div>
  );
};

export default VocabStudyView;
