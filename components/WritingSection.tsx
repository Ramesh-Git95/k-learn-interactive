import React, { useMemo, useRef, useState } from 'react';
import StrokeAnimation, { type StrokeAnimationHandle } from './StrokeAnimation';
import WritingCanvas, { type WritingCanvasHandle } from './WritingCanvas';
import { getStrokes, WRITABLE_CHARS, FREE_WRITING_CHARS, JAMO_INFO } from '../data/strokeData';
import { hangulCharacters } from '../data/koreanData';
import { scoreWriting, type WritingResult } from '../utils/strokeScoring';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useUpgrade } from '../hooks/useUpgrade';
import { useProgress } from '../contexts/ProgressContext';

// Writing practice: watch the letter being written, then write it yourself and
// have it marked.
//
// Three modes in order — Trace (ghost letter underneath), Freehand (guides only),
// Test (nothing to lean on). Marking happens locally and instantly; see
// utils/strokeScoring.ts for why it grades strokes rather than an image.

type Mode = 'trace' | 'freehand' | 'test';

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'trace',    label: '① Trace',    hint: 'Follow the grey letter underneath.' },
  { id: 'freehand', label: '② Freehand', hint: 'Guides only — you draw the letter.' },
  { id: 'test',     label: '③ Test',     hint: 'Nothing to lean on. Show what you know.' },
];

const VERDICT_STYLE: Record<WritingResult['verdict'], { label: string; ring: string; text: string }> = {
  excellent:  { label: 'Excellent',  ring: 'stroke-green-500',  text: 'text-green-600 dark:text-green-400' },
  good:       { label: 'Good',       ring: 'stroke-[#D9A441]',  text: 'text-[#B8860B] dark:text-[#D9A441]' },
  close:      { label: 'Close',      ring: 'stroke-[#E4572E]',  text: 'text-[#E4572E]' },
  'try-again':{ label: 'Try again',  ring: 'stroke-gray-400',   text: 'text-gray-500 dark:text-gray-400' },
};

const WritingSection: React.FC = () => {
  const { isPremium } = useFeatureAccess();
  const { startUpgrade } = useUpgrade();
  const { progress, updateProgress } = useProgress();

  const [char, setChar] = useState<string>(WRITABLE_CHARS[0]);
  const [mode, setMode] = useState<Mode>('trace');
  const [result, setResult] = useState<WritingResult | null>(null);
  const [strokeCount, setStrokeCount] = useState(0);

  const animRef = useRef<StrokeAnimationHandle>(null);
  const canvasRef = useRef<WritingCanvasHandle>(null);

  const data = useMemo(() => getStrokes(char), [char]);
  const info = JAMO_INFO[char];

  const hangulEntry = useMemo(() => hangulCharacters.find(h => h.char === char), [char]);
  const romanization = hangulEntry?.romanization ?? info?.nameRoman ?? '';
  const isVowel = hangulEntry?.type === 'vowel';

  // Speak the letter's NAME (기역), which is what a Korean teacher says when
  // pointing at it — a bare consonant jamo has no sound on its own for TTS to
  // pronounce.
  const speakLetter = () => {
    if (!info || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // required before every speak() in this app
    const u = new SpeechSynthesisUtterance(info.name);
    u.lang = 'ko-KR';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };
  const locked = (c: string) => !isPremium && !FREE_WRITING_CHARS.includes(c);
  const learned = (c: string) => !!progress[`writing_char_${c}`];
  const learnedCount = WRITABLE_CHARS.filter(learned).length;

  const pick = (c: string) => {
    if (locked(c)) { startUpgrade(); return; }
    setChar(c);
    setResult(null);
    setStrokeCount(0);
  };

  const check = () => {
    const drawn = canvasRef.current?.getStrokes() ?? [];
    const r = scoreWriting(char, drawn);
    setResult(r);
    // A letter counts as learned once it's written well without the ghost —
    // tracing proves nothing on its own.
    if (r && r.score >= 72 && mode !== 'trace' && !learned(char)) {
      updateProgress(`writing_char_${char}`, true);
    }
  };

  const reset = () => { canvasRef.current?.clear(); setResult(null); setStrokeCount(0); };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
              ✍️ Writing
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Watch how it's written, then write it yourself — 손으로 배워요.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-[#E4572E]">{learnedCount}/{WRITABLE_CHARS.length}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">letters learned</div>
          </div>
        </div>
      </div>

      {/* Letter picker */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 mb-5">
        <div className="flex flex-wrap gap-1.5">
          {WRITABLE_CHARS.map(c => {
            const isLocked = locked(c);
            const isActive = c === char;
            return (
              <button
                key={c}
                onClick={() => pick(c)}
                title={
                  isLocked
                    ? `${c} · ${JAMO_INFO[c]?.name ?? ''} — Premium letter`
                    : `${c} · ${JAMO_INFO[c]?.name ?? ''} (${JAMO_INFO[c]?.nameRoman ?? ''})`
                }
                className={`relative w-10 h-10 rounded-xl text-lg font-black transition-all duration-150 ${
                  isActive
                    ? 'text-white scale-110 shadow-md'
                    : isLocked
                    ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600'
                    : learned(c)
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:-translate-y-0.5'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:-translate-y-0.5 hover:text-[#E4572E]'
                }`}
                style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  ...(isActive ? { background: 'var(--brand-gradient)' } : {}),
                }}
              >
                {c}
                {isLocked && <span className="absolute -top-1 -right-1 text-[9px]">🔒</span>}
                {!isLocked && learned(c) && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 text-[9px]">✓</span>
                )}
              </button>
            );
          })}
        </div>
        {!isPremium && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">
            The 14 basic consonants are free.{' '}
            <button onClick={startUpgrade} className="font-bold text-[#E4572E] hover:underline">
              Unlock all {WRITABLE_CHARS.length} letters — $4/month
            </button>
          </p>
        )}
      </div>

      {/* Mode selector */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); reset(); }}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
              mode === m.id
                ? 'text-white shadow-md'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-800 hover:border-[#E4572E]'
            }`}
            style={mode === m.id ? { background: 'var(--brand-gradient)' } : undefined}
          >
            {m.label}
          </button>
        ))}
        <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-1">
          {MODES.find(m => m.id === mode)?.hint}
        </span>
      </div>

      {/* What am I writing? — naming the letter, so the hand and the head learn
          the same thing. */}
      {info && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 mb-5 flex items-center gap-4 flex-wrap">
          <span
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-black text-white flex-shrink-0"
            style={{ background: 'var(--brand-gradient)', fontFamily: 'Pretendard Variable, sans-serif' }}
          >
            {char}
          </span>
          <div className="flex-1 min-w-[180px]">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-lg font-black text-gray-900 dark:text-white">{info.name}</span>
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{info.nameRoman}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {isVowel ? 'vowel' : 'consonant'}
              </span>
            </div>
            <p className="text-[13px] text-gray-600 dark:text-gray-300 mt-0.5">
              Sounds <span className="font-bold text-[#E4572E]">{romanization}</span> — {info.sound}
            </p>
          </div>
          <button
            onClick={speakLetter}
            title={`Hear ${info.name}`}
            className="px-4 py-2 rounded-xl text-sm font-black border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-[#E4572E] hover:text-[#E4572E] transition-colors flex-shrink-0"
          >
            🔊 Hear it
          </button>
        </div>
      )}

      {/* Watch + write */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Watch */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Watch</h2>
            <span className="text-[11px] font-bold text-gray-400">
              {data?.strokes.length} stroke{data?.strokes.length === 1 ? '' : 's'}
            </span>
          </div>

          <StrokeAnimation ref={animRef} char={char} className="w-full aspect-square" />

          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => animRef.current?.play(false)}
              className="px-4 py-2 rounded-xl text-sm font-black text-white btn-brand">▶ Replay</button>
            <button onClick={() => animRef.current?.play(true)}
              className="px-4 py-2 rounded-xl text-sm font-black border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-[#E4572E] hover:text-[#E4572E] transition-colors">
              🐢 Slow
            </button>
          </div>

          {data?.tip && (
            <p className="text-[12px] text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
              💡 {data.tip}
            </p>
          )}
        </div>

        {/* Write */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Your turn</h2>
            <span className="text-[11px] font-bold text-gray-400">
              {strokeCount} stroke{strokeCount === 1 ? '' : 's'} drawn
            </span>
          </div>

          <WritingCanvas
            ref={canvasRef}
            char={char}
            showGuide={mode === 'trace'}
            onStrokesChange={setStrokeCount}
            className="w-full aspect-square text-gray-900 dark:text-white"
          />

          <div className="flex items-center gap-2 mt-3">
            <button onClick={check} disabled={strokeCount === 0}
              className="px-4 py-2 rounded-xl text-sm font-black text-white btn-brand disabled:opacity-40 disabled:cursor-not-allowed">
              ✓ Check
            </button>
            <button onClick={() => canvasRef.current?.undo()} disabled={strokeCount === 0}
              className="px-3 py-2 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#E4572E] transition-colors disabled:opacity-40">
              ↶ Undo
            </button>
            <button onClick={reset}
              className="px-3 py-2 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#E4572E] transition-colors">
              ↺ Clear
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 animate-fade-in-up">
          <div className="flex items-center gap-5 flex-wrap">
            {/* Score ring */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" strokeWidth="3"
                  className="stroke-gray-100 dark:stroke-gray-800" />
                <circle cx="18" cy="18" r="16" fill="none" strokeWidth="3" strokeLinecap="round"
                  className={VERDICT_STYLE[result.verdict].ring}
                  strokeDasharray={`${(result.score / 100) * 100.5} 100.5`}
                  style={{ transition: 'stroke-dasharray 700ms ease-out' }} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-gray-900 dark:text-white">
                {result.score}
              </span>
            </div>

            <div className="flex-1 min-w-[200px]">
              <div className={`text-lg font-black ${VERDICT_STYLE[result.verdict].text}`}>
                {VERDICT_STYLE[result.verdict].label}
              </div>
              <ul className="mt-1 space-y-0.5">
                {result.notes.map((n, i) => (
                  <li key={i} className="text-[13px] text-gray-600 dark:text-gray-300">• {n}</li>
                ))}
              </ul>

              {/* Per-stroke marks */}
              {result.marks.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {result.marks.map(m => (
                    <span key={m.index}
                      title={`Stroke ${m.index + 1}: ${Math.round(m.shape * 100)}% shape${m.directionOk ? '' : ', wrong direction'}`}
                      className={`px-2 py-1 rounded-lg text-[11px] font-black ${
                        !m.directionOk
                          ? 'bg-[#E4572E]/10 text-[#E4572E]'
                          : m.shape >= 0.75
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                      {m.index + 1}. {m.directionOk ? `${Math.round(m.shape * 100)}%` : '↩ backwards'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={reset}
                className="px-4 py-2 rounded-xl text-sm font-black text-white btn-brand">Try again</button>
              {mode === 'trace' && result.score >= 72 && (
                <button onClick={() => { setMode('freehand'); reset(); }}
                  className="px-4 py-2 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#E4572E] transition-colors">
                  Try freehand →
                </button>
              )}
            </div>
          </div>

          {mode === 'trace' && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
              Tracing doesn't count towards a letter being learned — switch to Freehand when you're ready.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default WritingSection;
