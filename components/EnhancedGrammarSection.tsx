import React, { useMemo, useRef, useState } from 'react';
import { Check, ArrowRight, Lock } from 'lucide-react';
import { grammarPatterns } from '../data/koreanData';
import { noteFor, type GrammarNote } from '../data/grammarNotes';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PremiumPeek } from './PremiumLock';
import { FREE_GRAMMAR_COUNT } from '../constants';
import SoftNudge from './SoftNudge';
import { useAuth } from '../contexts/AuthContext';
import GuestSignUpGate from './GuestSignUpGate';
import Drawer from './Drawer';
import type { Section } from '../types';
import { accentFor } from '../utils/moduleAccent';
import { smoothScrollToElement } from '../utils/smoothScroll';

// Grammar, one rule at a time.
//
// This used to be seven cards stacked down the page, each shouting its pattern
// in a gradient. It is now the clarity shape: one rule owns the screen — stated
// in a single line, taken apart into its pieces, then shown working in real
// sentences — while the rest of the rules sit in a drawer. The rail carries the
// page outline and what comes before and after, so a rule always has a place in
// the sequence rather than floating alone.
//
// The one-line statements and the morpheme breakdowns live in data/grammarNotes.ts;
// everything else (pattern, explanation, examples) is the original data.

const ACC = accentFor('grammar');
const GUEST_PATTERN_LIMIT = 3;
const GUEST_MARK_THRESHOLD = 2;

// ── Tint the rule inside its own example ─────────────────────────────────────
// A learner reading 어제 영화를 봤어요 should not have to hunt for the past tense.
// Scans the sentence and tints every listed substring (longest first, so a
// multi-character mark wins over a single character starting at the same spot).
const Highlighted: React.FC<{ text: string; marks?: string[] }> = ({ text, marks }) => {
  if (!marks?.length) return <>{text}</>;
  const sorted = [...marks].sort((a, b) => b.length - a.length);
  const out: React.ReactNode[] = [];
  let buffer = '';
  let i = 0;
  while (i < text.length) {
    const hit = sorted.find(m => text.startsWith(m, i));
    if (hit) {
      if (buffer) { out.push(buffer); buffer = ''; }
      out.push(
        <span key={i} style={{ color: ACC.light }}>{hit}</span>,
      );
      i += hit.length;
    } else {
      buffer += text[i];
      i += 1;
    }
  }
  if (buffer) out.push(buffer);
  return <>{out}</>;
};

// ── Build the word yourself ──────────────────────────────────────────────────
// Korean words are assembled, so assembling one teaches the rule in a way that
// reading about it cannot. The pieces are the same `parts` the breakdown uses;
// their labels appear as each piece lands, so building IS the explanation.
const BuildIt: React.FC<{ note: GrammarNote; onHear: (t: string) => void }> = ({ note, onHear }) => {
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);

  // Shuffled once per rule — a reshuffle on every render would move the pieces
  // under the reader's finger.
  const order = useMemo(() => {
    const idx = note.parts.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    // A shuffle that lands in the right order teaches nothing.
    if (idx.every((v, i) => v === i) && idx.length > 1) [idx[0], idx[1]] = [idx[1], idx[0]];
    return idx;
  }, [note]);

  const complete = placed.length === note.parts.length;

  const tap = (i: number) => {
    if (complete) return;
    if (i === placed.length) { setPlaced(p => [...p, i]); setWrong(null); }
    else { setWrong(i); setTimeout(() => setWrong(null), 500); }
  };

  return (
    <div
      className="my-6 scroll-mt-24 rounded-r-xl border-l-[3px] px-5 py-5 sm:px-6"
      style={{ borderColor: ACC.light, background: `${ACC.light}12` }}
    >
      <div className="mb-1 text-[13px] font-semibold" style={{ color: ACC.light }}>BUILD IT YOURSELF</div>
      <p className="mb-4 text-[14px] text-[#3E4A5A] dark:text-gray-400">
        Tap the pieces in order to say {note.goal}
      </p>

      {/* Pieces */}
      {!complete && (
        <div className="mb-5 flex flex-wrap gap-2.5">
          {order.map(i => {
            const used = placed.includes(i);
            return (
              // Korean and its meaning always travel together — seeing the pair
              // on every piece, on every rule, is free vocabulary exposure.
              <button
                key={i}
                onClick={() => tap(i)}
                disabled={used}
                className={`flex min-w-[74px] flex-col items-center justify-center rounded-xl border px-4 py-2 transition-all ${
                  used
                    ? 'invisible'
                    : wrong === i
                    ? 'border-[#C13F22]'
                    : 'border-[rgba(20,32,47,0.2)] bg-[#FFFCF4] hover:-translate-y-0.5 dark:border-gray-700 dark:bg-gray-900'
                }`}
                style={wrong === i ? { animation: 'klShake 0.4s ease' } : undefined}
              >
                <span className={`font-korean text-[20px] font-bold leading-none ${
                  wrong === i ? 'text-[#C13F22]' : 'text-[#16202F] dark:text-white'
                }`}>
                  {note.parts[i].text}
                </span>
                <span className={`mt-1 text-[11.5px] leading-none ${
                  wrong === i ? 'text-[#C13F22]' : 'text-[#4A5566] dark:text-gray-500'
                }`}>
                  {note.parts[i].gloss}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Assembled so far — labels appear as pieces land */}
      <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
        {note.parts.map((part, i) => {
          const shown = placed.includes(i);
          return (
            <React.Fragment key={i}>
              {i > 0 && shown && <span className="pb-5 text-[18px] font-medium text-[#4A5566] dark:text-gray-500">+</span>}
              <span className="flex flex-col items-center">
                <span
                  className="font-korean text-[26px] font-bold sm:text-[30px]"
                  style={{ color: shown ? (part.focus ? ACC.light : undefined) : undefined }}
                >
                  {shown
                    ? <span className={part.focus ? '' : 'text-[#16202F] dark:text-white'}>{part.text}</span>
                    : <span className="text-[#4A5566]/35 dark:text-gray-700">___</span>}
                </span>
                {/* Meaning stays on the piece; the grammatical role joins it
                    once placed, so the pair is never separated. */}
                <span className="mt-1.5 h-8 text-center text-[12px] leading-[1.35] text-[#4A5566] dark:text-gray-500">
                  {shown && (
                    <>
                      <span className="block font-medium text-[#16202F] dark:text-gray-300">{part.gloss}</span>
                      <span className="block">{part.label}</span>
                    </>
                  )}
                </span>
              </span>
            </React.Fragment>
          );
        })}
        {complete && (
          <>
            <span className="pb-5 text-[18px] font-medium text-[#4A5566] dark:text-gray-500">→</span>
            <span className="flex flex-col items-center">
              <span className="font-korean text-[26px] font-bold text-[#16202F] sm:text-[30px] dark:text-white">
                {note.result}
              </span>
              <span className="mt-1.5 h-8 text-center text-[12px] leading-[1.35]">
                <span className="block font-semibold" style={{ color: ACC.light }}>✓ that's it</span>
                <span className="block text-[#4A5566] dark:text-gray-500">{note.goal}</span>
              </span>
            </span>
          </>
        )}
      </div>

      {/* Why it takes this form — only once they have built it */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {complete ? (
          <>
            <p className="text-[15px] text-[#16202F] dark:text-gray-200">{note.note}</p>
            <div className="flex flex-none gap-2.5">
              <button
                onClick={() => { setPlaced([]); setWrong(null); }}
                className="h-11 rounded-[9px] border border-[rgba(20,32,47,0.2)] px-4 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
              >
                Again
              </button>
              <button
                onClick={() => onHear(note.result)}
                className="inline-flex h-11 items-center gap-2.5 rounded-[9px] border border-[rgba(20,32,47,0.2)] px-4 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
              >
                <span className="flex h-3 items-end gap-[2.5px]" aria-hidden="true">
                  <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light }} />
                  <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.15s' }} />
                  <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.3s' }} />
                </span>
                Hear it
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setPlaced(note.parts.map((_, i) => i))}
            className="text-[13.5px] font-semibold text-[#4A5566] underline-offset-4 hover:underline dark:text-gray-400"
          >
            Show me instead
          </button>
        )}
      </div>
    </div>
  );
};

interface Props {
  progress: { [key: string]: boolean };
  toggleProgress: (key: string) => void;
  setActiveSection?: (section: Section) => void;
}

const EnhancedGrammarSection: React.FC<Props> = ({ progress, toggleProgress, setActiveSection }) => {
  const { canAccess } = useFeatureAccess();
  const { isAuthenticated } = useAuth();
  const [guestMarkCount, setGuestMarkCount] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const ruleRef = useRef<HTMLDivElement>(null);
  const exampleRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const practiceRef = useRef<HTMLDivElement>(null);

  const isCompleted = (i: number) => !!progress[`grammar_pattern_${i}`];
  const toggle = (i: number) => {
    if (!isAuthenticated && !isCompleted(i)) setGuestMarkCount(c => c + 1);
    toggleProgress(`grammar_pattern_${i}`);
  };

  const total = grammarPatterns.length;
  const completedCount = grammarPatterns.filter((_, i) => isCompleted(i)).length;

  // The last 40% are the Premium tier, as they have always been. The count is
  // shared from constants.ts so the landing page can state it instead of
  // guessing at it.
  const isAdvanced = (i: number) => i >= FREE_GRAMMAR_COUNT;
  const canSeeAdvanced = canAccess('advancedGrammar');

  // Guests read the first three rules.
  const maxVisible = isAuthenticated ? total : GUEST_PATTERN_LIMIT;
  const reachable = (i: number) => i < maxVisible;

  // Open on the first unread rule the reader can actually reach.
  const frontier = grammarPatterns.findIndex((_, i) => reachable(i) && !isCompleted(i));
  const index = picked ?? (frontier >= 0 ? frontier : 0);
  const pattern = grammarPatterns[index];
  const note = noteFor(pattern.pattern);
  const done = isCompleted(index);
  const locked = isAdvanced(index) && !canSeeAdvanced;

  // Reading time from the actual text, not a guess.
  const words = pattern.explanation.split(/\s+/).length
    + pattern.examples.length * 10
    + (note ? note.oneLine.split(/\s+/).length + note.note.split(/\s+/).length : 0);
  const minutes = Math.max(1, Math.round(words / 130));

  const say = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  };

  const jump = (ref: React.RefObject<HTMLDivElement | null>) => () => {
    if (ref.current) smoothScrollToElement(ref.current, { offset: 96 });
  };

  const prev = index > 0 ? index - 1 : null;
  const next = index < total - 1 ? index + 1 : null;

  const hangulStudied = Object.keys(progress).filter(k => k.startsWith('hangul_char_') && progress[k]).length;

  const HearIt = ({ text }: { text: string }) => (
    <button
      onClick={() => say(text)}
      className="inline-flex h-11 flex-none items-center gap-2.5 rounded-[9px] border border-[rgba(20,32,47,0.2)] px-4 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
      title={`Hear ${text}`}
    >
      <span className="flex h-3 items-end gap-[2.5px]" aria-hidden="true">
        <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light }} />
        <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.15s' }} />
        <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.3s' }} />
      </span>
      Hear it
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl">
      {hangulStudied < 10 && (
        <SoftNudge
          id="hangul-first-grammar"
          className="mb-5"
          text={<>Most learners do <strong>Hangul basics first</strong> (~30 min) — it makes every example below readable.</>}
          actionLabel="Start Hangul →"
          actionSection="hangul"
        />
      )}

      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            <span className="font-korean">{pattern.pattern}</span>
            <span className="text-[#4A5566] dark:text-gray-500"> · rule {index + 1} of {total}</span>
          </h1>
        </div>
        <div className="flex flex-none items-center gap-3.5">
          <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">{minutes} min read</span>
          <button
            onClick={() => toggle(index)}
            disabled={locked}
            className={`flex h-12 items-center gap-2 rounded-[10px] px-5 text-[15px] font-semibold transition-colors disabled:opacity-40 ${
              done ? 'text-white' : 'border-[1.5px] border-[rgba(20,32,47,0.22)] text-[#16202F] hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200'
            }`}
            style={done ? { background: ACC.light } : undefined}
          >
            {done ? <><Check className="h-4 w-4" /> Read</> : 'Mark as read'}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        {/* ── The rule ── */}
        <div className="w-full min-w-0 flex-1">
          {locked ? (
            <PremiumPeek
              title="Advanced grammar — Premium"
              description={`Unlock ${total - FREE_GRAMMAR_COUNT} advanced patterns, including this one.`}
              maxHeight={420}
            >
              <div className="kl-card p-7">
                <div className="mb-3 text-[13px] font-semibold" style={{ color: ACC.light }}>THE RULE, IN ONE LINE</div>
                <h2 className="font-display text-[26px] font-semibold leading-[1.2] tracking-[-0.03em] text-[#16202F] dark:text-white">
                  {note?.oneLine ?? pattern.pattern}
                </h2>
                <p className="mt-3.5 text-[17px] leading-[1.65] text-[#3E4A5A] dark:text-gray-300">{pattern.explanation}</p>
              </div>
            </PremiumPeek>
          ) : (
            <div className="kl-card p-6 sm:p-8">
              {/* The rule in one line */}
              <div ref={ruleRef} className="max-w-[66ch] scroll-mt-24">
                <div className="mb-3 text-[13px] font-semibold" style={{ color: ACC.light }}>
                  THE RULE, IN ONE LINE
                </div>
                <h2 className="font-display text-[26px] font-semibold leading-[1.2] tracking-[-0.03em] text-[#16202F] sm:text-[32px] dark:text-white">
                  {note?.oneLine ?? pattern.pattern}
                </h2>
                <p className="mt-3.5 text-[16px] leading-[1.65] text-[#3E4A5A] sm:text-[18px] dark:text-gray-300">
                  {pattern.explanation}
                </p>
              </div>

              {/* Build it yourself — replaces the static breakdown */}
              {note && (
                <div ref={exampleRef}>
                  <BuildIt key={pattern.pattern} note={note} onHear={say} />
                </div>
              )}

              {/* The rule working in real sentences */}
              <div ref={moreRef} className="scroll-mt-24">
                <div className="mb-3 text-[13px] font-semibold text-[#16202F] dark:text-white">
                  {pattern.examples.length} {pattern.examples.length === 1 ? 'sentence' : 'sentences'} using it
                </div>
                <div className="overflow-hidden rounded-xl border border-[rgba(20,32,47,0.12)] dark:border-gray-800">
                  {pattern.examples.map((ex, j) => (
                    <div
                      key={j}
                      className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 ${
                        j > 0 ? 'border-t border-[rgba(20,32,47,0.10)] dark:border-gray-800' : ''
                      }`}
                    >
                      <div className="font-korean text-[21px] font-bold text-[#16202F] sm:w-[190px] sm:flex-none dark:text-white">
                        <Highlighted text={ex.korean} marks={note?.marks[ex.korean]} />
                      </div>
                      <div className="flex-1 text-[15px] text-[#3E4A5A] dark:text-gray-300">{ex.english}</div>
                      <HearIt text={ex.korean} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Practice hand-off */}
              {setActiveSection && (
                <div ref={practiceRef} className="mt-6 flex scroll-mt-24 flex-wrap items-center gap-3.5">
                  <button
                    onClick={() => setActiveSection('quiz')}
                    className="flex h-12 items-center rounded-[10px] px-5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
                    style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
                  >
                    Practise in the quiz →
                  </button>
                  <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">
                    Grammar questions are mixed into the quiz.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Move through the rules */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => prev !== null && setPicked(prev)}
              disabled={prev === null}
              className="flex h-12 items-center rounded-[10px] border border-[rgba(20,32,47,0.14)] bg-[rgba(255,252,244,0.7)] px-4 text-[14px] font-medium text-[#4A5566] transition-colors hover:text-[#16202F] disabled:opacity-40 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400"
            >
              ← Previous
            </button>
            {/* Sized to its content and filled — it is the primary action, but
                a full-width bar on desktop reads as a banner, not a button. */}
            {next !== null && reachable(next) && (
              <button
                onClick={() => setPicked(next)}
                className="ml-auto flex h-12 items-center gap-2.5 rounded-[10px] px-5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}52` }}
              >
                <span className="hidden sm:inline">Next rule:</span>
                <span className="font-korean">{grammarPatterns[next].pattern}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Guest gate — after they have marked a couple of rules read */}
          {!isAuthenticated && guestMarkCount >= GUEST_MARK_THRESHOLD && total > GUEST_PATTERN_LIMIT && (
            <div className="mt-5">
              <GuestSignUpGate visibleCount={GUEST_PATTERN_LIMIT} totalCount={total} type="patterns" />
            </div>
          )}
        </div>

        {/* ── Rail ── */}
        <div className="w-full flex-none lg:w-[290px]">
          {!locked && (
            <div className="mb-3.5 rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">On this page</div>
              <div className="flex flex-col gap-1">
                {[
                  { label: 'The rule in one line', ref: ruleRef, first: true },
                  ...(note ? [{ label: 'Build it yourself', ref: exampleRef, first: false }] : []),
                  { label: 'Sentences using it', ref: moreRef, first: false },
                  ...(setActiveSection ? [{ label: 'Practice', ref: practiceRef, first: false }] : []),
                ].map(row => (
                  <button
                    key={row.label}
                    onClick={jump(row.ref)}
                    className="py-1 text-left text-[14px] font-medium text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200"
                    style={row.first
                      ? { color: '#16202F', borderLeft: `2px solid ${ACC.light}`, paddingLeft: 10 }
                      : { paddingLeft: 12 }}
                  >
                    {row.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {prev !== null && (
            <div className="mb-3.5 rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Before this rule</div>
              <p className="text-[14px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
                Rule {prev + 1} · <strong className="font-korean font-semibold text-[#16202F] dark:text-white">{grammarPatterns[prev].pattern}</strong>
                {isCompleted(prev) ? ' — you have read this.' : ' — worth reading first.'}
              </p>
              <button
                onClick={() => setPicked(prev)}
                className="mt-3 flex h-11 w-full items-center rounded-[9px] border border-[rgba(20,32,47,0.2)] px-3.5 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
              >
                {isCompleted(prev) ? 'Reread it →' : 'Read it first →'}
              </button>
            </div>
          )}

          {next !== null && (
            <div className="mb-3.5 rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Next up</div>
              <p className="text-[14px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
                Rule {next + 1} · <strong className="font-korean font-semibold text-[#16202F] dark:text-white">{grammarPatterns[next].pattern}</strong>
                {isAdvanced(next) && !canSeeAdvanced && ' (Premium)'}
              </p>
            </div>
          )}

          <div className="rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Your progress</div>
            <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${(completedCount / total) * 100}%`, background: ACC.light }} />
            </div>
            <p className="text-[13.5px] text-[#4A5566] dark:text-gray-400">
              {completedCount} of {total} rules read
            </p>
          </div>
        </div>
      </div>

      {/* ── All the rules ── */}
      <div className="mt-5">
        <Drawer label="All grammar rules" meta={`${completedCount}/${total} read`}>
          <div className="kl-card divide-y divide-[rgba(20,32,47,0.10)] p-2 dark:divide-gray-800">
            {grammarPatterns.map((p, i) => {
              const adv = isAdvanced(i);
              const lockedRow = (adv && !canSeeAdvanced) || !reachable(i);
              const active = i === index;
              return (
                <button
                  key={p.pattern}
                  onClick={() => setPicked(i)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                    active ? '' : 'hover:bg-[rgba(20,32,47,0.04)] dark:hover:bg-white/5'
                  }`}
                  style={active ? { background: `${ACC.light}14` } : undefined}
                >
                  <span
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11.5px] font-semibold"
                    style={isCompleted(i)
                      ? { background: `${ACC.light}24`, color: ACC.light }
                      : { background: 'rgba(20,32,47,0.06)', color: '#4A5566' }}
                  >
                    {isCompleted(i) ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-korean text-[15px] font-semibold text-[#16202F] dark:text-white">
                      {p.pattern}
                    </span>
                    <span className="block truncate text-[12.5px] text-[#4A5566] dark:text-gray-500">
                      {noteFor(p.pattern)?.oneLine ?? p.explanation}
                    </span>
                  </span>
                  {lockedRow && <Lock className="h-3.5 w-3.5 flex-none text-[#4A5566] dark:text-gray-500" />}
                </button>
              );
            })}
          </div>
        </Drawer>
      </div>
    </div>
  );
};

export default EnhancedGrammarSection;
