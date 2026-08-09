import React, { useMemo, useRef, useState } from 'react';
import { Check, Lock } from 'lucide-react';
import StrokeAnimation, { type StrokeAnimationHandle } from './StrokeAnimation';
import WritingCanvas, { type WritingCanvasHandle } from './WritingCanvas';
import { getStrokes, WRITABLE_CHARS, FREE_WRITING_CHARS, JAMO_INFO } from '../data/strokeData';
import { hangulCharacters } from '../data/koreanData';
import { scoreWriting, type WritingResult } from '../utils/strokeScoring';
import { describeStrokes, exampleWordsFor } from '../utils/writingGuide';
import { accentFor } from '../utils/moduleAccent';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useUpgrade } from '../hooks/useUpgrade';
import { useProgress } from '../contexts/ProgressContext';
import { celebrate } from '../utils/celebrate';

// Writing practice: watch the letter being written, then write it yourself and
// have it marked.
//
// Three modes in order — Trace (ghost letter underneath), Freehand (guides only),
// Test (nothing to lean on). Marking happens locally and instantly; see
// utils/strokeScoring.ts for why it grades strokes rather than an image.

const ACC = accentFor('writing');

type Mode = 'trace' | 'freehand' | 'test';

const MODES: { id: Mode; label: string; verb: string; hint: string }[] = [
  { id: 'trace', label: 'Trace', verb: 'Trace',
    hint: 'Follow the grey letter underneath. Trace it as many times as you like — this one does not count towards the letter being learned.' },
  { id: 'freehand', label: 'Freehand', verb: 'Write',
    hint: 'Guides only. Write the letter yourself, in the stroke order listed beside the box.' },
  { id: 'test', label: 'Test', verb: 'Test',
    hint: 'Nothing to lean on. Write it from memory, then have it marked.' },
];

const VERDICT: Record<WritingResult['verdict'], { label: string; color: string }> = {
  excellent: { label: 'Excellent', color: '#2E6B59' },
  good: { label: 'Good shape', color: '#2E6B59' },
  close: { label: 'Close', color: '#A8761F' },
  'try-again': { label: 'Try again', color: '#4A5566' },
};

interface Attempt { id: number; char: string; verdict: WritingResult['verdict']; score: number }

const railCard =
  'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

const WritingSection: React.FC = () => {
  const { isPremium } = useFeatureAccess();
  const { startUpgrade } = useUpgrade();
  const { progress, updateProgress } = useProgress();

  const [char, setChar] = useState<string>(WRITABLE_CHARS[0]);
  const [mode, setMode] = useState<Mode>('trace');
  const [result, setResult] = useState<WritingResult | null>(null);
  const [strokeCount, setStrokeCount] = useState(0);
  // Kept for this sitting only, and labelled as such — there is no attempt
  // history on the account, and a rail that implied otherwise would be lying.
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const animRef = useRef<StrokeAnimationHandle>(null);
  const canvasRef = useRef<WritingCanvasHandle>(null);

  const data = useMemo(() => getStrokes(char), [char]);
  const info = JAMO_INFO[char];
  const strokeLines = useMemo(() => describeStrokes(char), [char]);
  const examples = useMemo(() => exampleWordsFor(char), [char]);

  const hangulEntry = useMemo(() => hangulCharacters.find(h => h.char === char), [char]);
  const romanization = hangulEntry?.romanization ?? info?.nameRoman ?? '';
  const isVowel = hangulEntry?.type === 'vowel';

  const modeInfo = MODES.find(m => m.id === mode)!;

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
  const charIndex = WRITABLE_CHARS.indexOf(char);

  const pick = (c: string) => {
    if (locked(c)) { startUpgrade(); return; }
    setChar(c);
    setResult(null);
    setStrokeCount(0);
  };

  const nextLetter = () => {
    const next = WRITABLE_CHARS.slice(charIndex + 1).find(c => !locked(c));
    if (next) pick(next);
    else startUpgrade();
  };

  const check = () => {
    const drawn = canvasRef.current?.getStrokes() ?? [];
    const r = scoreWriting(char, drawn);
    setResult(r);
    if (r) {
      setAttempts(prev => [{ id: Date.now(), char, verdict: r.verdict, score: r.score }, ...prev].slice(0, 4));
    }
    // A letter counts as learned once it's written well without the ghost —
    // tracing proves nothing on its own.
    if (r && r.score >= 72 && mode !== 'trace' && !learned(char)) {
      updateProgress(`writing_char_${char}`, true);
      celebrate({
        variant: 'letter',
        emoji: char,
        title: 'Letter learned!',
        subtitle: info ? `${info.name} · ${info.nameRoman}` : char,
      });
    }
  };

  const reset = () => { canvasRef.current?.clear(); setResult(null); setStrokeCount(0); };

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[12.5px]">
            <span className="font-medium text-[#4A5566] dark:text-gray-400">Practice</span>
            <span className="text-[#4A5566] dark:text-gray-600">/</span>
            <span className="font-semibold" style={{ color: ACC.light }}>Writing</span>
          </div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            {modeInfo.verb} <span className="font-korean">{char}</span>
            <span className="text-[#4A5566] dark:text-gray-500">
              {' '}· letter {charIndex + 1} of {WRITABLE_CHARS.length}
            </span>
          </h1>
          <p className="mt-1 text-[15px] text-[#4A5566] dark:text-gray-400">
            {info ? `${info.name} · ${info.nameRoman}` : ''} — {isVowel ? 'vowel' : 'consonant'}
          </p>
        </div>
        <div className="flex-none">
          <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
            {learnedCount} of {WRITABLE_CHARS.length} letters written
          </div>
          <div className="h-1.5 w-[200px] overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(learnedCount / WRITABLE_CHARS.length) * 100}%`, background: ACC.light }}
            />
          </div>
        </div>
      </div>

      {/* ── Modes ── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[12.5px] text-[#4A5566] dark:text-gray-500">Mode:</span>
        {MODES.map((m, i) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); reset(); }}
            className={`inline-flex h-9 shrink-0 items-center rounded-[9px] px-3.5 text-[12.5px] font-semibold leading-none transition-colors ${
              mode === m.id
                ? 'text-white'
                : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
            }`}
            style={mode === m.id ? { background: ACC.light } : undefined}
          >
            {i + 1}. {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        {/* ── Practice ── */}
        <div className="order-1 w-full min-w-0 flex-1">
          <div
            className="mb-4 flex items-start gap-3 rounded-r-lg border-l-[3px] px-4 py-3"
            style={{ borderColor: ACC.light, background: `${ACC.light}14` }}
          >
            <span
              className="kl-accent flex-none whitespace-nowrap text-[12.5px] font-semibold"
              style={{ ['--kl-acc' as string]: ACC.light, ['--kl-acc-dk' as string]: ACC.dark }}
            >
              DO THIS NEXT
            </span>
            <span className="text-[13.5px] leading-snug text-[#16202F] dark:text-gray-200">
              {modeInfo.hint}
            </span>
          </div>

          <div className="flex flex-col gap-5 md:flex-row">
            {/* The box you write in */}
            <div className="w-full min-w-0 md:flex-1">
              <div className="kl-card p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-[#16202F] dark:text-white">Your turn</span>
                  <span className="text-[12px] text-[#4A5566] dark:text-gray-500">
                    {strokeCount} of {data?.strokes.length ?? 0} strokes drawn
                  </span>
                </div>

                <WritingCanvas
                  ref={canvasRef}
                  char={char}
                  showGuide={mode === 'trace'}
                  onStrokesChange={setStrokeCount}
                  className="w-full aspect-square text-[#16202F] dark:text-white"
                />

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={check}
                    disabled={strokeCount === 0}
                    className="flex h-11 shrink-0 items-center rounded-[10px] px-5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                    style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
                  >
                    Check it
                  </button>
                  <button
                    onClick={() => canvasRef.current?.undo()}
                    disabled={strokeCount === 0}
                    className="flex h-11 shrink-0 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
                  >
                    Undo stroke
                  </button>
                  <button
                    onClick={reset}
                    className="flex h-11 shrink-0 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
                  >
                    Clear and retry
                  </button>
                  <button
                    onClick={nextLetter}
                    className="ml-auto flex h-11 shrink-0 items-center text-[13.5px] font-semibold transition-opacity hover:opacity-70"
                    style={{ color: ACC.light }}
                  >
                    Next letter →
                  </button>
                </div>
              </div>

              {/* Marking */}
              {result && (
                <div className="kl-card mt-4 p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-16 flex-none">
                      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                        <circle cx="18" cy="18" r="16" fill="none" strokeWidth="3"
                          className="stroke-[rgba(20,32,47,0.10)] dark:stroke-gray-800" />
                        <circle cx="18" cy="18" r="16" fill="none" strokeWidth="3" strokeLinecap="round"
                          stroke={VERDICT[result.verdict].color}
                          strokeDasharray={`${(result.score / 100) * 100.5} 100.5`}
                          style={{ transition: 'stroke-dasharray 700ms ease-out' }} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[17px] font-semibold text-[#16202F] dark:text-white">
                        {result.score}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold" style={{ color: VERDICT[result.verdict].color }}>
                        {VERDICT[result.verdict].label}
                      </div>
                      <ul className="mt-1.5 space-y-1">
                        {result.notes.map((n, i) => (
                          <li key={i} className="text-[13.5px] leading-[1.5] text-[#3E4A5A] dark:text-gray-400">{n}</li>
                        ))}
                      </ul>

                      {result.marks.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {result.marks.map(m => (
                            <span
                              key={m.index}
                              title={`Stroke ${m.index + 1}: ${Math.round(m.shape * 100)}% shape${m.directionOk ? '' : ', wrong direction'}`}
                              className="rounded-md px-2 py-1 text-[11.5px] font-semibold"
                              style={
                                !m.directionOk
                                  ? { background: 'rgba(193,63,34,0.12)', color: '#C13F22' }
                                  : m.shape >= 0.75
                                  ? { background: 'rgba(46,107,89,0.12)', color: '#2E6B59' }
                                  : { background: 'rgba(20,32,47,0.06)', color: '#4A5566' }
                              }
                            >
                              {m.index + 1}. {m.directionOk ? `${Math.round(m.shape * 100)}%` : 'backwards'}
                            </span>
                          ))}
                        </div>
                      )}

                      {mode === 'trace' && result.score >= 72 && (
                        <button
                          onClick={() => { setMode('freehand'); reset(); }}
                          className="mt-3.5 flex h-10 items-center rounded-[9px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-[13px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
                        >
                          Ready — try it freehand →
                        </button>
                      )}
                    </div>
                  </div>

                  {mode === 'trace' && (
                    <p className="mt-3.5 border-t border-[rgba(20,32,47,0.12)] pt-3 text-[12.5px] text-[#4A5566] dark:border-gray-800 dark:text-gray-500">
                      Tracing does not count towards the letter being learned — switch to Freehand when
                      your hand knows the way.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* The guide, beside the box rather than above it */}
            <div className="w-full flex-none md:w-[250px]">
              <div className="kl-card p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-[#16202F] dark:text-white">Watch it written</span>
                  <span className="text-[12px] text-[#4A5566] dark:text-gray-500">
                    {data?.strokes.length} stroke{data?.strokes.length === 1 ? '' : 's'}
                  </span>
                </div>

                <StrokeAnimation ref={animRef} char={char} className="w-full aspect-square" />

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => animRef.current?.play(false)}
                    className="flex h-10 flex-1 items-center justify-center rounded-[9px] text-[12.5px] font-semibold text-white"
                    style={{ background: ACC.light }}
                  >
                    Replay
                  </button>
                  <button
                    onClick={() => animRef.current?.play(true)}
                    className="flex h-10 flex-1 items-center justify-center rounded-[9px] border border-[rgba(20,32,47,0.2)] text-[12.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
                  >
                    Slowly
                  </button>
                </div>
              </div>

              <div className="kl-card mt-3.5 p-4">
                <div className="mb-2.5 text-[12.5px] font-semibold text-[#16202F] dark:text-white">Stroke order</div>
                <ol className="flex flex-col gap-2">
                  {strokeLines.map((line, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] leading-[1.45] text-[#3E4A5A] dark:text-gray-400">
                      <span
                        className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-semibold"
                        style={{ background: `${ACC.light}1F`, color: ACC.light }}
                      >
                        {i + 1}
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
                {data?.tip && (
                  <p className="mt-3 border-t border-[rgba(20,32,47,0.12)] pt-3 text-[12.5px] leading-[1.5] text-[#4A5566] dark:border-gray-800 dark:text-gray-500">
                    {data.tip}
                  </p>
                )}
              </div>

              {attempts.length > 0 && (
                <div className="kl-card mt-3.5 p-4">
                  <div className="mb-2.5 text-[12.5px] font-semibold text-[#16202F] dark:text-white">
                    This session
                  </div>
                  <div className="flex flex-col gap-2">
                    {attempts.map(a => (
                      <div key={a.id} className="flex items-center justify-between gap-2">
                        <span className="font-korean text-[17px] font-semibold text-[#16202F] dark:text-white">
                          {a.char}
                        </span>
                        <span className="text-[12px] font-semibold" style={{ color: VERDICT[a.verdict].color }}>
                          {VERDICT[a.verdict].label.toLowerCase()} · {a.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Rail ── */}
        <div className="order-2 w-full flex-none lg:w-[290px]">
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-1 text-[13.5px] font-semibold text-[#16202F] dark:text-white">All letters</div>
            <p className="mb-3 text-[12px] text-[#4A5566] dark:text-gray-500">
              In teaching order. A tick means you have written it without the ghost.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {WRITABLE_CHARS.map(c => {
                const isLocked = locked(c);
                const isActive = c === char;
                const done = learned(c);
                return (
                  <button
                    key={c}
                    onClick={() => pick(c)}
                    title={
                      isLocked
                        ? `${c} · ${JAMO_INFO[c]?.name ?? ''} — Premium`
                        : `${c} · ${JAMO_INFO[c]?.name ?? ''} (${JAMO_INFO[c]?.nameRoman ?? ''})`
                    }
                    className={`relative flex h-9 w-9 items-center justify-center rounded-[9px] font-korean text-[16px] font-semibold transition-colors ${
                      isActive
                        ? 'text-white'
                        : isLocked
                        ? 'border border-[rgba(20,32,47,0.10)] text-[#B4BAC3] dark:border-gray-800 dark:text-gray-700'
                        : 'border border-[rgba(20,32,47,0.14)] text-[#16202F] hover:border-[rgba(20,32,47,0.34)] dark:border-gray-700 dark:text-gray-200'
                    }`}
                    style={
                      isActive
                        ? { background: ACC.light }
                        : done
                        ? { background: `${ACC.light}14`, borderColor: `${ACC.light}4D` }
                        : undefined
                    }
                  >
                    {c}
                    {isLocked && (
                      <Lock className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-[#B4BAC3] dark:text-gray-700" />
                    )}
                    {!isLocked && done && !isActive && (
                      <Check className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5" style={{ color: ACC.light }} />
                    )}
                  </button>
                );
              })}
            </div>
            {!isPremium && (
              <p className="mt-3 text-[12px] leading-[1.5] text-[#4A5566] dark:text-gray-500">
                The 14 basic consonants are free.{' '}
                <button onClick={startUpgrade} className="font-semibold hover:underline" style={{ color: ACC.light }}>
                  Unlock all {WRITABLE_CHARS.length} — $4/month
                </button>
              </p>
            )}
          </div>

          {info && (
            <div className={`${railCard} mb-3.5`}>
              <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">This letter</div>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 flex-none items-center justify-center rounded-xl font-korean text-[24px] font-bold"
                  style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D`, color: ACC.light }}
                >
                  {char}
                </span>
                <div className="min-w-0">
                  <div className="font-korean text-[16px] font-semibold text-[#16202F] dark:text-white">
                    {info.name}
                  </div>
                  <div className="text-[12.5px] text-[#4A5566] dark:text-gray-500">{info.nameRoman}</div>
                </div>
              </div>
              <p className="mt-3 text-[13.5px] leading-[1.5] text-[#3E4A5A] dark:text-gray-400">
                Sounds <span className="font-semibold" style={{ color: ACC.light }}>{romanization}</span> — {info.sound}
              </p>
              <button
                onClick={speakLetter}
                className="mt-3 flex h-10 w-full items-center justify-center rounded-[9px] border border-[rgba(20,32,47,0.2)] text-[13px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
              >
                Hear its name
              </button>
            </div>
          )}

          {examples.length > 0 && (
            <div className={railCard}>
              <div className="mb-1 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
                Where this shows up
              </div>
              <p className="mb-3 text-[12px] text-[#4A5566] dark:text-gray-500">
                Words from the vocabulary that use {char}.
              </p>
              <div className="flex flex-col gap-2.5">
                {examples.map(w => (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingSection;
