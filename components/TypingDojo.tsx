import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Check } from 'lucide-react';
import { vocabulary, commonPhrases } from '../data/koreanData';
import { accentFor } from '../utils/moduleAccent';
import { keysToType, jamoForKey, KEY_FOR_JAMO, ROWS, jamoOfKey, shiftJamoOfKey, fingerForJamo } from '../utils/dubeolsik';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';

// Two drills live here, because they train different things and the app has
// always had the second one.
//
//  · Type the Korean — the real 두벌식 layout, mapped in the browser so a
//    learner with no Korean input method can still practise it.
//  · Type the meaning — a Korean word appears, you race to recall the English.
//
// Both are timed the same way: a 15-second taste on the free plan, the full
// minute on Premium.

const ACC = accentFor('typing');

type Drill = 'korean' | 'meaning';
type GameState = 'idle' | 'playing' | 'done';

interface Word { korean: string; romanization: string; english: string }

// Flatten all vocab into a usable word pool, de-dupe and filter
const WORD_POOL: Word[] = (() => {
  const seen = new Set<string>();
  const words: Word[] = [];
  for (const cat of vocabulary) {
    for (const item of cat.items) {
      const key = item.korean;
      if (!seen.has(key) && item.english.length < 40) {
        seen.add(key);
        words.push({ korean: item.korean, romanization: item.romanization, english: item.english.toLowerCase() });
      }
    }
  }
  return words;
})();

const LINE_POOL = commonPhrases;

const FULL_SECONDS = 60;
const DEMO_SECONDS = 15;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Check answer: allow minor typos via normalisation (trim, lowercase, ignore punctuation)
const normalise = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');

const isCorrect = (input: string, target: string): boolean => {
  const ni = normalise(input);
  const nt = normalise(target);
  if (ni === nt) return true;
  // Accept if any slash-separated alternative matches
  return nt.split('/').map(s => s.trim()).some(alt => ni === alt);
};

interface RoundResult { word: Word; input: string; correct: boolean }

const isJamo = (c: string) => {
  const n = c.codePointAt(0) ?? 0;
  return n >= 0x3131 && n <= 0x3163;
};

const railCard =
  'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

const TypingDojo: React.FC = () => {
  const { subscriptionTier } = useFeatureAccess();
  const isFree = subscriptionTier === 'free';
  const { openUpgradeModal } = useUpgradeModal();
  const TOTAL_SECONDS = isFree ? DEMO_SECONDS : FULL_SECONDS;

  const [drill, setDrill] = useState<Drill>('korean');
  const [state, setState] = useState<GameState>('idle');
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);

  // ── Meaning drill ──
  const [queue, setQueue] = useState<Word[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [flashWrong, setFlashWrong] = useState(false);
  const [showRomanization, setShowRomanization] = useState(false);

  // ── Korean drill ──
  const [lines, setLines] = useState<typeof LINE_POOL>([]);
  const [lineIdx, setLineIdx] = useState(0);
  const [keyIdx, setKeyIdx] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [missedKeys, setMissedKeys] = useState<Record<string, number>>({});
  const [linesDone, setLinesDone] = useState(0);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [bestKpm, setBestKpm] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = queue[currentIdx] ?? null;
  const correct = results.filter(r => r.correct).length;
  const total = results.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const line = lines[lineIdx] ?? null;
  const keys = useMemo(() => (line ? keysToType(line.korean) : []), [line]);
  const nextKey = keys[keyIdx] ?? null;

  // How many characters of the line are FINISHED. Measuring by the length of
  // what has been composed would go wrong mid-syllable: after the ㄴ of 녕 the
  // composer holds a bare jamo in its own character slot, which would swallow
  // the rest of the line. Counting the keys each character costs cannot.
  const perChar = useMemo(
    () => (line ? Array.from(line.korean).map(c => keysToType(c).length) : []),
    [line],
  );
  const doneChars = useMemo(() => {
    let spent = 0;
    let n = 0;
    for (const cost of perChar) {
      if (spent + cost > keyIdx) break;
      spent += cost;
      n++;
    }
    return n;
  }, [perChar, keyIdx]);

  const elapsed = TOTAL_SECONDS - timeLeft;
  const kpm = elapsed > 0 ? Math.round((hits / elapsed) * 60) : 0;
  const keyAccuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100;

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const endGame = useCallback(() => {
    stopTimer();
    setState('done');
  }, [stopTimer]);

  useEffect(() => {
    if (state !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { endGame(); return 0; }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [state, endGame, stopTimer]);

  // Remember the best run of this sitting. Nothing is stored on the account, so
  // the rail says "this session" rather than implying a personal record.
  useEffect(() => {
    if (state === 'done' && drill === 'korean' && kpm > bestKpm) setBestKpm(kpm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const startGame = (which: Drill = drill) => {
    setDrill(which);
    setTimeLeft(TOTAL_SECONDS);
    if (which === 'meaning') {
      setQueue(shuffle(WORD_POOL));
      setCurrentIdx(0);
      setInput('');
      setResults([]);
      setShowRomanization(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setLines(shuffle(LINE_POOL));
      setLineIdx(0);
      setKeyIdx(0);
      setHits(0);
      setMisses(0);
      setMissedKeys({});
      setLinesDone(0);
    }
    setState('playing');
  };

  // ── Korean drill: a key press ───────────────────────────────────────────────
  // Wrong presses are counted but not entered. Letting them through would build
  // a syllable the target never contained, and the learner would then be typing
  // to repair their own mistake rather than learning where the key is.
  const pressJamo = useCallback((jamo: string) => {
    if (!nextKey) return;
    if (jamo !== nextKey) {
      setMisses(m => m + 1);
      setMissedKeys(prev => ({ ...prev, [nextKey]: (prev[nextKey] ?? 0) + 1 }));
      setWrongKey(jamo);
      setTimeout(() => setWrongKey(null), 250);
      return;
    }
    setHits(h => h + 1);
    if (keyIdx + 1 >= keys.length) {
      setLinesDone(n => n + 1);
      setLineIdx(i => (i + 1 < lines.length ? i + 1 : 0));
      setKeyIdx(0);
    } else {
      setKeyIdx(i => i + 1);
    }
  }, [nextKey, keyIdx, keys.length, lines.length]);

  useEffect(() => {
    if (state !== 'playing' || drill !== 'korean') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { endGame(); return; }
      const jamo = jamoForKey(e.key, e.shiftKey);
      // A space or a mark like ? is typed as itself, so the drill can use real
      // sentences rather than bare words.
      const pressed = jamo ?? (e.key.length === 1 ? e.key : null);
      if (!pressed) return;
      e.preventDefault();
      pressJamo(pressed);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, drill, pressJamo, endGame]);

  const advance = (word: Word, userInput: string, wasCorrect: boolean) => {
    setResults(prev => [...prev, { word, input: userInput, correct: wasCorrect }]);
    if (currentIdx + 1 >= queue.length) {
      endGame();
    } else {
      setCurrentIdx(i => i + 1);
      setInput('');
      setShowRomanization(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !input.trim()) return;
    const ok = isCorrect(input, current.english);
    if (ok) { setFlashCorrect(true); setTimeout(() => setFlashCorrect(false), 400); }
    else { setFlashWrong(true); setTimeout(() => setFlashWrong(false), 400); }
    advance(current, input, ok);
  };

  const handleSkip = () => { if (current) advance(current, '', false); };

  const worstKeys = useMemo(
    () => Object.entries(missedKeys).sort((a, b) => b[1] - a[1]).slice(0, 3),
    [missedKeys],
  );

  const header = (title: string, right?: React.ReactNode) => (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-[12.5px]">
          <span className="font-medium text-[#4A5566] dark:text-gray-400">Practice</span>
          <span className="text-[#4A5566] dark:text-gray-600">/</span>
          <span className="font-semibold" style={{ color: ACC.light }}>Typing</span>
        </div>
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
          {title}
        </h1>
      </div>
      {right}
    </div>
  );

  // ── Idle ────────────────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="mx-auto max-w-4xl">
        {header('Typing')}

        {/* The limit was stated here as a flat sentence, with the only way to
            act on it buried in the results screen — so a free player had to
            finish a drill before the app ever offered them the full minute. */}
        <div className="mb-5 flex max-w-[62ch] flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-[15px] text-[#3E4A5A] dark:text-gray-400">
            {isFree
              ? 'Both drills run for 15 seconds on the free plan. Premium gives you the full minute.'
              : 'Both drills run for one minute.'}
          </p>
          {isFree && (
            <button
              onClick={openUpgradeModal}
              className="flex h-9 shrink-0 items-center rounded-[9px] px-3.5 text-[13px] font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ background: ACC.light }}
            >
              See Premium
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => startGame('korean')}
            className="kl-card flex flex-col p-5 text-left transition-transform duration-200 hover:-translate-y-1"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl font-korean text-[19px] font-bold"
              style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D`, color: ACC.light }}
            >
              한
            </span>
            <div className="mt-4 text-[16px] font-semibold text-[#16202F] dark:text-white">Type the Korean</div>
            <p className="mt-1.5 flex-1 text-[13.5px] leading-[1.55] text-[#4A5566] dark:text-gray-400">
              A real phrase appears and you type it on the standard Korean keyboard. You do not need
              Korean installed — this page maps your keys for you, so R is ㄱ exactly as it would be.
            </p>
            <span className="mt-3.5 text-[13px] font-semibold" style={{ color: ACC.light }}>Start →</span>
          </button>

          <button
            onClick={() => startGame('meaning')}
            className="kl-card flex flex-col p-5 text-left transition-transform duration-200 hover:-translate-y-1"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[19px] font-bold"
              style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D`, color: ACC.light }}
            >
              EN
            </span>
            <div className="mt-4 text-[16px] font-semibold text-[#16202F] dark:text-white">Type the meaning</div>
            <p className="mt-1.5 flex-1 text-[13.5px] leading-[1.55] text-[#4A5566] dark:text-gray-400">
              A Korean word appears and you type what it means, as fast as you can recall it.
              {' '}{WORD_POOL.length} words in the pool. Enter to answer, Tab to skip.
            </p>
            <span className="mt-3.5 text-[13px] font-semibold" style={{ color: ACC.light }}>Start →</span>
          </button>
        </div>

        <div className="kl-card mt-5 p-5">
          <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
            About the Korean keyboard
          </div>
          <p className="max-w-[70ch] text-[13.5px] leading-[1.6] text-[#3E4A5A] dark:text-gray-400">
            두벌식 (dubeolsik) is the standard layout: consonants on the left half, vowels on the
            right, and syllables assemble themselves as you type — press ㅇ, ㅏ, ㄴ and you get 안.
            It is worth learning as it is, rather than a friendlier invention, because it is the
            layout on every Korean phone and computer.
          </p>
        </div>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  if (state === 'done') {
    if (drill === 'korean') {
      return (
        <div className="mx-auto max-w-4xl">
          {header('Time')}
          <div className="kl-card p-6">
            <div className="flex flex-wrap gap-8">
              {[
                [`${kpm}`, 'keys per minute'],
                [`${keyAccuracy}%`, 'accuracy'],
                [`${linesDone}`, linesDone === 1 ? 'line finished' : 'lines finished'],
              ].map(([v, l]) => (
                <div key={l}>
                  <div className="font-display text-[32px] font-semibold text-[#16202F] dark:text-white">{v}</div>
                  <div className="mt-0.5 text-[13px] text-[#4A5566] dark:text-gray-500">{l}</div>
                </div>
              ))}
            </div>
            <p className="mt-5 max-w-[60ch] text-[14px] leading-[1.6] text-[#3E4A5A] dark:text-gray-400">
              {hits === 0
                ? 'Nothing landed this time. The keys are printed on the keyboard below the line — find the outlined one and press it, there is no hurry.'
                : keyAccuracy >= 95
                ? 'Almost every key went in first time. Speed comes on its own from here.'
                : `You found ${hits} keys and missed ${misses}. Accuracy is worth more than speed at this stage — the hand remembers what it did correctly.`}
            </p>

            {worstKeys.length > 0 && (
              <div className="mt-5 border-t border-[rgba(20,32,47,0.12)] pt-4 dark:border-gray-800">
                <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
                  Keys you missed most
                </div>
                <div className="flex flex-wrap gap-2">
                  {worstKeys.map(([j, n]) => (
                    <span
                      key={j}
                      className="flex items-center gap-2 rounded-[9px] px-3 py-1.5 text-[13px]"
                      style={{ background: `${ACC.light}14`, color: ACC.light }}
                    >
                      <span className="font-korean text-[16px] font-bold">{j}</span>
                      <span className="text-[12px] text-[#4A5566] dark:text-gray-400">
                        {KEY_FOR_JAMO[j] ? `${KEY_FOR_JAMO[j].shift ? 'shift+' : ''}${KEY_FOR_JAMO[j].key.toUpperCase()}` : ''}
                        {' · '}{n}×
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => startGame('korean')}
                className="flex h-11 items-center rounded-[10px] px-5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
              >
                Go again
              </button>
              <button
                onClick={() => setState('idle')}
                className="flex h-11 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[14px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
              >
                Both drills
              </button>
            </div>

            {isFree && (
              <p className="mt-4 text-[13px] text-[#4A5566] dark:text-gray-500">
                That was the 15-second version.{' '}
                <button onClick={openUpgradeModal} className="font-semibold hover:underline" style={{ color: ACC.light }}>
                  Premium runs the full minute — $4/month
                </button>
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-4xl">
        {header('Time')}
        <div className="kl-card p-6">
          <div className="flex flex-wrap gap-8">
            {[
              [`${correct}`, 'right'],
              [`${total - correct}`, 'missed'],
              [`${accuracy}%`, 'accuracy'],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="font-display text-[32px] font-semibold text-[#16202F] dark:text-white">{v}</div>
                <div className="mt-0.5 text-[13px] text-[#4A5566] dark:text-gray-500">{l}</div>
              </div>
            ))}
          </div>
          <p className="mt-5 max-w-[60ch] text-[14px] leading-[1.6] text-[#3E4A5A] dark:text-gray-400">
            {total === 0
              ? 'No answers this round.'
              : `You recalled ${correct} of ${total}. The ones below that you missed are the ones worth a second look.`}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => startGame('meaning')}
              className="flex h-11 items-center rounded-[10px] px-5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
            >
              Go again
            </button>
            <button
              onClick={() => setState('idle')}
              className="flex h-11 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[14px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
            >
              Both drills
            </button>
          </div>

          {isFree && (
            <p className="mt-4 text-[13px] text-[#4A5566] dark:text-gray-500">
              That was the 15-second version.{' '}
              <button onClick={openUpgradeModal} className="font-semibold hover:underline" style={{ color: ACC.light }}>
                Premium runs the full minute — $4/month
              </button>
            </p>
          )}
        </div>

        {results.length > 0 && (
          <div className="kl-card mt-4 overflow-hidden">
            <div className="border-b border-[rgba(20,32,47,0.12)] px-5 py-3 text-[13.5px] font-semibold text-[#16202F] dark:border-gray-800 dark:text-white">
              Every word you saw
            </div>
            <div className="divide-y divide-[rgba(20,32,47,0.08)] dark:divide-gray-800">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex-none">
                    {r.correct
                      ? <Check className="h-4 w-4" style={{ color: '#2E6B59' }} />
                      : <span className="text-[15px] text-[#C13F22]">×</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-korean text-[15px] font-semibold text-[#16202F] dark:text-white">{r.word.korean}</span>
                    <span className="ml-2 text-[12px] text-[#4A5566] dark:text-gray-500">{r.word.romanization}</span>
                  </div>
                  <div className="flex-none text-right text-[12.5px]">
                    {r.correct ? (
                      <span className="font-semibold" style={{ color: '#2E6B59' }}>{r.input}</span>
                    ) : (
                      <span>
                        {r.input && <span className="mr-1.5 text-[#C13F22] line-through">{r.input}</span>}
                        <span className="font-semibold text-[#16202F] dark:text-gray-300">{r.word.english}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Playing ─────────────────────────────────────────────────────────────────
  const timerBlock = (
    <div className="flex flex-none items-center gap-3.5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-3.5 items-end gap-[2.5px]" aria-hidden="true">
          <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light }} />
          <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.15s' }} />
        </span>
        <span className="text-[13.5px] tabular-nums text-[#4A5566] dark:text-gray-400">
          {timeLeft} second{timeLeft === 1 ? '' : 's'} left
        </span>
      </div>
      <button
        onClick={endGame}
        className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
      >
        Stop
      </button>
    </div>
  );

  if (drill === 'korean' && line) {
    return (
      <div className="mx-auto max-w-6xl">
        {header(isFree ? 'Fifteen-second drill' : 'Sixty-second drill', timerBlock)}

        <div className="flex flex-col items-start gap-5 lg:flex-row">
          <div className="order-1 w-full min-w-0 flex-1">
            <div className="kl-card p-5 sm:p-7">
              <div className="mb-3 text-[12.5px] font-semibold" style={{ color: ACC.light }}>TYPE THIS LINE</div>

              <div className="font-korean text-[28px] leading-[1.5] sm:text-[34px]">
                <span className="font-semibold" style={{ color: ACC.light }}>
                  {line.korean.slice(0, doneChars)}
                </span>
                <span
                  className="rounded px-0.5 font-semibold text-[#16202F] dark:text-white"
                  style={{ background: `${ACC.light}26`, boxShadow: `inset 0 -2px 0 ${ACC.light}` }}
                >
                  {line.korean.slice(doneChars, doneChars + 1)}
                </span>
                <span className="text-[#B4BAC3] dark:text-gray-600">
                  {line.korean.slice(doneChars + 1)}
                </span>
              </div>

              <div className="mt-3 text-[13.5px] text-[#4A5566] dark:text-gray-400">
                {line.romanization} · “{line.english}”
              </div>

              <div className="mt-4 border-t border-[rgba(20,32,47,0.12)] pt-4 text-[13.5px] text-[#16202F] dark:border-gray-800 dark:text-gray-200">
                {nextKey === ' ' ? (
                  <>Next is a <strong className="font-semibold">space</strong>.</>
                ) : nextKey && isJamo(nextKey) ? (
                  <>
                    Next key is <strong className="font-korean text-[16px] font-bold" style={{ color: ACC.light }}>{nextKey}</strong>
                    {KEY_FOR_JAMO[nextKey] && (
                      <> — press <strong className="font-semibold">
                        {KEY_FOR_JAMO[nextKey].shift ? 'shift + ' : ''}{KEY_FOR_JAMO[nextKey].key.toUpperCase()}
                      </strong></>
                    )}
                    , outlined below.
                  </>
                ) : (
                  <>Next is <strong className="font-semibold">{nextKey}</strong> — type it as normal.</>
                )}
              </div>
            </div>

            {/* The layout itself */}
            <div className="kl-card mt-4 p-4 sm:p-5">
              <div className="flex flex-col items-center gap-1.5">
                {ROWS.map((row, ri) => (
                  <div key={ri} className="flex w-full justify-center gap-1.5">
                    {row.map(k => {
                      const jamo = jamoOfKey(k);
                      const shifted = shiftJamoOfKey(k);
                      const isNext = nextKey === jamo || (!!shifted && nextKey === shifted);
                      const isWrong = wrongKey === jamo || (!!shifted && wrongKey === shifted);
                      return (
                        <button
                          key={k}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => pressJamo(nextKey === shifted && shifted ? shifted : jamo)}
                          className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg border py-2 transition-colors"
                          style={{
                            borderColor: isNext ? ACC.light : 'rgba(20,32,47,0.14)',
                            background: isWrong ? 'rgba(193,63,34,0.12)' : isNext ? `${ACC.light}14` : undefined,
                            boxShadow: isNext ? `0 0 0 1.5px ${ACC.light}` : undefined,
                          }}
                          title={`${k.toUpperCase()} — ${jamo}${shifted ? ` (shift: ${shifted})` : ''}`}
                        >
                          <span className="font-korean text-[16px] font-semibold text-[#16202F] dark:text-white">{jamo}</span>
                          <span className="mt-0.5 text-[9.5px] uppercase leading-none text-[#4A5566] dark:text-gray-500">{k}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => pressJamo(' ')}
                  className="mt-1 flex h-9 w-1/2 items-center justify-center rounded-lg border text-[12px] font-semibold text-[#4A5566] transition-colors dark:text-gray-400"
                  style={{
                    borderColor: nextKey === ' ' ? ACC.light : 'rgba(20,32,47,0.14)',
                    background: nextKey === ' ' ? `${ACC.light}14` : undefined,
                  }}
                >
                  space
                </button>
              </div>
              <p className="mt-3.5 text-center text-[12.5px] text-[#4A5566] dark:text-gray-500">
                Use your own keyboard, or tap the keys. Consonants left, vowels right.
              </p>
            </div>
          </div>

          {/* Rail */}
          <div className="order-2 w-full flex-none lg:w-[290px]">
            <div className={`${railCard} mb-3.5`}>
              <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">This drill</div>
              <div className="flex flex-col gap-2.5 text-[13.5px] text-[#4A5566] dark:text-gray-400">
                <div className="flex justify-between">
                  Speed<strong className="font-semibold text-[#16202F] dark:text-white">{kpm} keys/min</strong>
                </div>
                <div className="flex justify-between">
                  Accuracy<strong className="font-semibold text-[#16202F] dark:text-white">{keyAccuracy}%</strong>
                </div>
                <div className="flex justify-between">
                  Lines finished<strong className="font-semibold text-[#16202F] dark:text-white">{linesDone}</strong>
                </div>
                {bestKpm > 0 && (
                  <div className="flex justify-between">
                    Best this session<strong className="font-semibold text-[#16202F] dark:text-white">{bestKpm} keys/min</strong>
                  </div>
                )}
              </div>
            </div>

            {worstKeys.length > 0 && (
              <div className={`${railCard} mb-3.5`}>
                <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
                  Keys you keep missing
                </div>
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {worstKeys.map(([j]) => (
                    <span
                      key={j}
                      className="flex h-9 w-9 items-center justify-center rounded-lg font-korean text-[16px] font-semibold"
                      style={{ background: `${ACC.light}1F`, color: ACC.light }}
                    >
                      {j}
                    </span>
                  ))}
                </div>
                <p className="text-[12.5px] leading-[1.5] text-[#4A5566] dark:text-gray-500">
                  {(() => {
                    const fingers = new Set(worstKeys.map(([j]) => fingerForJamo(j)).filter(Boolean));
                    return fingers.size === 1
                      ? `All of them sit under your ${[...fingers][0]} finger.`
                      : worstKeys
                          .map(([j]) => `${j} is ${fingerForJamo(j) ?? 'off the letter rows'}`)
                          .join(' · ');
                  })()}
                </p>
              </div>
            )}

            <div className={railCard}>
              <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Layout</div>
              <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
                두벌식 (dubeolsik) is the standard Korean keyboard: consonants left, vowels right,
                syllables assemble themselves as you type. A wrong key is counted but not entered, so
                the line never gets away from you.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing: meaning drill ──────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl">
      {header(isFree ? 'Fifteen-second drill' : 'Sixty-second drill', timerBlock)}

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="order-1 w-full min-w-0 flex-1">
          <div
            className="kl-card p-6 text-center transition-colors duration-150 sm:p-8"
            style={
              flashCorrect ? { borderColor: '#2E6B59', background: 'rgba(46,107,89,0.08)' }
              : flashWrong ? { borderColor: '#C13F22', background: 'rgba(193,63,34,0.08)' }
              : undefined
            }
          >
            <div className="mb-3 text-[12.5px] font-semibold" style={{ color: ACC.light }}>
              TYPE THE ENGLISH MEANING
            </div>
            <p className="font-korean text-[40px] font-semibold leading-tight text-[#16202F] sm:text-[52px] dark:text-white">
              {current?.korean}
            </p>
            {showRomanization ? (
              <p className="mt-2 text-[14px] font-medium" style={{ color: ACC.light }}>{current?.romanization}</p>
            ) : (
              <button
                onClick={() => setShowRomanization(true)}
                className="mt-2 text-[12.5px] text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-500 dark:hover:text-gray-300"
              >
                Show romanization
              </button>
            )}
            <div className="mt-3 text-[12.5px] text-[#4A5566] dark:text-gray-500">
              Word {currentIdx + 1} of {queue.length}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex gap-2.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); handleSkip(); } }}
              placeholder="What does it mean?"
              className="kl-field h-12 flex-1 rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] bg-[#FFFCF4] px-4 text-[15px] text-[#16202F] placeholder:text-[#8A93A0] focus:border-[#16202F] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-12 flex-none items-center rounded-[10px] px-6 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
            >
              Answer
            </button>
          </form>

          <button
            onClick={handleSkip}
            className="mt-3 text-[12.5px] text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-500 dark:hover:text-gray-300"
          >
            Skip this one (Tab)
          </button>
        </div>

        <div className="order-2 w-full flex-none lg:w-[290px]">
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">This drill</div>
            <div className="flex flex-col gap-2.5 text-[13.5px] text-[#4A5566] dark:text-gray-400">
              <div className="flex justify-between">
                Right<strong className="font-semibold text-[#16202F] dark:text-white">{correct}</strong>
              </div>
              <div className="flex justify-between">
                Missed<strong className="font-semibold text-[#16202F] dark:text-white">{total - correct}</strong>
              </div>
              <div className="flex justify-between">
                Accuracy<strong className="font-semibold text-[#16202F] dark:text-white">{accuracy}%</strong>
              </div>
            </div>
          </div>

          <div className={railCard}>
            <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">How it is marked</div>
            <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
              Punctuation and capitals are forgiven, and any of the listed meanings counts. Spelling
              does not — a word you cannot spell is a word you have not quite got yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingDojo;
