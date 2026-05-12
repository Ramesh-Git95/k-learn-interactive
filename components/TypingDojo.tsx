import React, { useState, useEffect, useRef, useCallback } from 'react';
import { vocabulary } from '../data/koreanData';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

interface Word {
  korean: string;
  romanization: string;
  english: string;
}

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

type GameState = 'idle' | 'playing' | 'done';

interface RoundResult {
  word: Word;
  input: string;
  correct: boolean;
}

const TypingDojo: React.FC = () => {
  const { subscriptionTier } = useFeatureAccess();
  const isFree = subscriptionTier === 'free';
  const TOTAL_SECONDS = isFree ? DEMO_SECONDS : FULL_SECONDS;
  const [state, setState] = useState<GameState>('idle');
  const [queue, setQueue] = useState<Word[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [flashWrong, setFlashWrong] = useState(false);
  const [showRomanization, setShowRomanization] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = queue[currentIdx] ?? null;
  const correct = results.filter(r => r.correct).length;
  const total = results.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

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

  const startGame = () => {
    const q = shuffle(WORD_POOL);
    setQueue(q);
    setCurrentIdx(0);
    setInput('');
    setResults([]);
    setTimeLeft(TOTAL_SECONDS);
    setShowRomanization(false);
    setState('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

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
    if (ok) {
      setFlashCorrect(true);
      setTimeout(() => setFlashCorrect(false), 400);
    } else {
      setFlashWrong(true);
      setTimeout(() => setFlashWrong(false), 400);
    }
    advance(current, input, ok);
  };

  const handleSkip = () => {
    if (!current) return;
    advance(current, '', false);
  };

  const timerPct = (timeLeft / TOTAL_SECONDS) * 100;
  const timerColor = timeLeft > 20 ? '#8B5CF6' : timeLeft > 10 ? '#F59E0B' : '#EF4444';

  // ── Idle screen ──────────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 60%, #06B6D4 100%)' }}
        >
          {['타자', '연습', '속도', '도장'].map((w, i) => (
            <span key={i} className="absolute text-white/10 font-black select-none pointer-events-none"
              style={{ fontSize: `${1.5 + (i % 3) * 0.5}rem`, top: `${(i * 37) % 85}%`, left: `${(i * 53) % 90}%` }}>
              {w}
            </span>
          ))}
          <div className="relative z-10 text-center">
            <div className="text-6xl mb-4">⌨️</div>
            <h1 className="text-2xl sm:text-3xl font-black mb-2">Typing Dojo</h1>
            <p className="text-white/80 text-sm mb-6 max-w-sm mx-auto">
              A Korean word appears — type the English meaning as fast as you can.{' '}
              {isFree
                ? <><strong>15-second demo</strong> — upgrade for the full 60-second challenge!</>
                : <>You have <strong>60 seconds</strong>. How many can you get right?</>
              }
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-6 text-center">
              {[['⏱', isFree ? '15 sec' : '60 sec', isFree ? 'Demo' : 'Time limit'], ['📚', `${WORD_POOL.length}+`, 'Word pool'], ['🎯', 'Accuracy', 'Tracked']].map(([em, val, lbl]) => (
                <div key={lbl} className="bg-white/15 rounded-xl p-3">
                  <div className="text-xl mb-0.5">{em}</div>
                  <div className="text-sm font-black">{val}</div>
                  <div className="text-[10px] text-white/70">{lbl}</div>
                </div>
              ))}
            </div>
            <button
              onClick={startGame}
              className="px-10 py-3 bg-white text-purple-700 font-black rounded-xl hover:scale-[1.03] active:scale-[0.97] transition-transform text-sm"
            >
              Start Challenge →
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>📖</span> How to play
          </h2>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex gap-2"><span className="text-violet-500 font-bold">1.</span> A Korean word appears on screen</li>
            <li className="flex gap-2"><span className="text-violet-500 font-bold">2.</span> Type its English meaning and press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">Enter</kbd></li>
            <li className="flex gap-2"><span className="text-violet-500 font-bold">3.</span> Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">Tab</kbd> or click Skip to pass a word</li>
            <li className="flex gap-2"><span className="text-violet-500 font-bold">4.</span> Minor punctuation differences are forgiven — spelling counts!</li>
          </ul>
        </div>
      </div>
    );
  }

  // ── Results screen ───────────────────────────────────────────────────────────
  if (state === 'done') {
    const grade =
      accuracy >= 90 ? { label: 'Master', emoji: '🏆', color: 'text-yellow-600 dark:text-yellow-400' }
      : accuracy >= 70 ? { label: 'Proficient', emoji: '⭐', color: 'text-violet-600 dark:text-violet-400' }
      : accuracy >= 50 ? { label: 'Practicing', emoji: '📈', color: 'text-blue-600 dark:text-blue-400' }
      : { label: 'Keep Going', emoji: '💪', color: 'text-pink-600 dark:text-pink-400' };

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Score header */}
        <div
          className="rounded-2xl p-6 text-center text-white mb-6"
          style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
        >
          <div className="text-5xl mb-2">{grade.emoji}</div>
          <h2 className="text-2xl font-black mb-1">{grade.label}</h2>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              ['✅', correct.toString(), 'Correct'],
              ['❌', (total - correct).toString(), 'Missed'],
              ['🎯', `${accuracy}%`, 'Accuracy'],
            ].map(([em, val, lbl]) => (
              <div key={lbl} className="bg-white/15 rounded-xl py-2.5">
                <div className="text-lg">{em}</div>
                <div className="text-xl font-black">{val}</div>
                <div className="text-[10px] text-white/70">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {isFree && (
          <div className="bg-gradient-to-r from-pink-50 to-violet-50 dark:from-pink-900/20 dark:to-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-5 mb-5 text-center">
            <p className="text-sm font-black text-gray-900 dark:text-white mb-1">You got {correct} right in 15 seconds!</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Imagine what you could do in 60 seconds. The full challenge is waiting.</p>
            <button
              onClick={() => window.open('https://gumroad.com/l/klearn-lifetime', '_blank')}
              className="px-7 py-2.5 text-white text-sm font-black rounded-xl hover:scale-[1.02] transition-transform"
              style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
            >
              ⭐ Unlock Full 60-Second Challenge →
            </button>
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <button
            onClick={startGame}
            className="flex-1 py-3 text-white text-sm font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
          >
            {isFree ? 'Try Demo Again →' : 'Play Again →'}
          </button>
          <button
            onClick={() => setState('idle')}
            className="px-5 py-3 text-sm font-black rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Home
          </button>
        </div>

        {/* Review */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-black text-gray-900 dark:text-white">Review</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {results.map((r, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <span className={`text-lg flex-shrink-0 ${r.correct ? 'text-green-500' : 'text-red-400'}`}>
                    {r.correct ? '✓' : '✗'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-gray-900 dark:text-white">{r.word.korean}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{r.word.romanization}</span>
                  </div>
                  <div className="text-right text-xs flex-shrink-0">
                    {r.correct ? (
                      <span className="text-green-600 dark:text-green-400 font-bold">{r.input}</span>
                    ) : (
                      <span>
                        {r.input && <span className="text-red-400 line-through mr-1">{r.input || '—'}</span>}
                        <span className="text-gray-600 dark:text-gray-400 font-bold">{r.word.english}</span>
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

  // ── Playing screen ───────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Timer bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-black text-gray-500 dark:text-gray-400">
            {correct} correct · {total - correct} missed
          </span>
          <span
            className="text-xl font-black tabular-nums"
            style={{ color: timerColor }}
          >
            {timeLeft}s
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
          />
        </div>
      </div>

      {/* Word card */}
      <div
        className={`rounded-2xl border-2 p-8 text-center mb-5 transition-all duration-150 ${
          flashCorrect
            ? 'bg-green-50 dark:bg-green-900/20 border-green-400'
            : flashWrong
            ? 'bg-red-50 dark:bg-red-900/20 border-red-400'
            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
        }`}
      >
        <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
          Type the English meaning
        </div>
        <p className="text-5xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
          {current?.korean}
        </p>
        {showRomanization ? (
          <p className="text-sm text-violet-500 dark:text-violet-400 font-bold">{current?.romanization}</p>
        ) : (
          <button
            onClick={() => setShowRomanization(true)}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
          >
            Show romanization (−2 pts)
          </button>
        )}
        <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Word {currentIdx + 1} of {queue.length}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Tab') { e.preventDefault(); handleSkip(); }
          }}
          placeholder="Type English meaning…"
          className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-violet-400 text-sm font-medium"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-5 py-3 text-white text-sm font-black rounded-xl disabled:opacity-40 hover:scale-[1.03] active:scale-[0.97] transition-transform"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}
        >
          ↵
        </button>
      </form>

      <button
        onClick={handleSkip}
        className="w-full py-2 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        Skip word (Tab)
      </button>

      {/* Live score */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <span className="text-green-600 dark:text-green-400 font-bold">✓ {correct} correct</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500 dark:text-gray-400">{accuracy}% accuracy</span>
        </div>
      )}
    </div>
  );
};

export default TypingDojo;
