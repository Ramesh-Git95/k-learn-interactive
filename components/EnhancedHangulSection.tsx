import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { hangulCharacters, vocabulary } from '../data/koreanData';
import Drawer from './Drawer';
import HangulAlphabetDrawer from './HangulAlphabetDrawer';
import type { Section } from '../types';
import { getStrokes, JAMO_INFO } from '../data/strokeData';
import { jamoOf } from '../utils/pronunciation';
import { accentFor } from '../utils/moduleAccent';

// The Korean alphabet, one letter at a time.
//
// This used to be a wall of 40 cards: every letter shouting at once, with the
// sound hidden behind a hover and nothing about how to write it. It is now the
// clarity shape — one letter owns the screen (its sound, its name, its strokes,
// and the words it unlocks), while the full chart and the syllable-block
// explainer collapse into drawers. Every letter's content is real: names and
// sounds come from JAMO_INFO, strokes from getStrokes, and the readable-words
// list is computed from actual progress by decomposing words into jamo.

const ACC = accentFor('hangul');

interface HangulSectionProps {
  progress?: { [key: string]: boolean };
  toggleProgress?: (key: string) => void;
  /** Lets "Trace it" hand off to the writing practice screen. */
  setActiveSection?: (section: Section) => void;
}

const keyFor = (char: string) => `hangul_char_${char}`;

const HangulSection: React.FC<HangulSectionProps> = ({ progress = {}, toggleProgress, setActiveSection }) => {
  const consonants = hangulCharacters.filter(c => c.type === 'consonant');
  const vowels     = hangulCharacters.filter(c => c.type === 'vowel');

  const isStudied = (char: string) => !!progress[keyFor(char)];
  const studiedCount = hangulCharacters.filter(c => isStudied(c.char)).length;
  const total = hangulCharacters.length;

  // Open on the frontier — the first letter not yet learned — so the page always
  // shows the one thing to do. An explicit pick always wins.
  const frontier = hangulCharacters.find(c => !isStudied(c.char)) ?? hangulCharacters[0];
  const [picked, setPicked] = useState<string | null>(null);
  const activeChar = picked ?? frontier.char;

  const letter = hangulCharacters.find(c => c.char === activeChar) ?? frontier;
  const index  = hangulCharacters.findIndex(c => c.char === activeChar);
  const info   = JAMO_INFO[letter.char];
  const strokeData = getStrokes(letter.char);
  const isVowel = letter.type === 'vowel';

  const markStudied = (char: string) => {
    if (toggleProgress && !isStudied(char)) toggleProgress(keyFor(char));
  };

  // Speak — same engine and rate the cards have always used.
  const say = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  };

  // Only a LETTER counts as studied. Example words are spoken without writing
  // progress — a `hangul_char_밥` key would be junk in the DB and would also
  // award XP off the `hangul_` prefix (see utils/xpAwards.ts).
  //
  // Pinning the letter here matters: without it, marking this letter studied moves
  // the frontier, and since `picked` was still null the page would jump to the
  // next letter the instant you pressed "Hear it" — taking the strokes with it and
  // contradicting the instruction to hear it twice. Advancing is the Next
  // letter button's job, not a side effect of playing a sound.
  const speakLetter = (char: string) => { say(char); markStudied(char); setPicked(char); };

  // Words the learner can genuinely read now: spelled only with letters they
  // have learned (counting this one), and containing this letter.
  const readableWords = useMemo(() => {
    const known = new Set(hangulCharacters.filter(c => isStudied(c.char)).map(c => c.char));
    known.add(letter.char);
    return vocabulary
      .flatMap(cat => cat.items)
      .filter(it => !/\s/.test(it.korean) && it.korean.length <= 3)
      .filter(it => {
        const js = jamoOf(it.korean);
        return js.includes(letter.char) && js.every(j => known.has(j));
      })
      .slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter.char, studiedCount]);

  const nextLetter = hangulCharacters[(index + 1) % total];

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Page header: which letter, and how far through ── */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[34px] dark:text-white">
            Letter {index + 1}: <span className="font-korean">{letter.char}</span>
          </h1>
        </div>
        <div className="flex-none">
          <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
            {studiedCount} of {total} letters learned
          </div>
          <div className="h-1.5 w-[200px] overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${(studiedCount / total) * 100}%`, background: ACC.light }} />
          </div>
        </div>
      </div>

      {/* ── DO THIS NEXT ── */}
      <div
        className="mb-5 flex items-start gap-3 rounded-r-lg border-l-[3px] px-4 py-3 sm:items-center"
        style={{ borderColor: ACC.light, background: `${ACC.light}14` }}
      >
        <span className="kl-accent flex-none whitespace-nowrap text-[12.5px] font-semibold"
              style={{ ['--kl-acc' as string]: ACC.light, ['--kl-acc-dk' as string]: ACC.dark }}>
          DO THIS NEXT
        </span>
        <span className="text-[13.5px] leading-snug text-[#16202F] dark:text-gray-200">
          Hear the sound twice, then trace {strokeData ? `the ${strokeData.strokes.length} ${strokeData.strokes.length === 1 ? 'stroke' : 'strokes'}` : 'it'}.
          {readableWords.length > 0 && ` Two minutes, and you can read ${readableWords.length} more ${readableWords.length === 1 ? 'word' : 'words'}.`}
        </span>
      </div>

      {/* ── Focus + support ── */}
      <div className="grid gap-4.5 gap-y-5 lg:grid-cols-[1.25fr_1fr]">

        {/* The letter itself */}
        <div className="kl-card p-6 sm:p-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
            <div
              className="flex h-[130px] w-[130px] flex-none items-center justify-center rounded-2xl sm:h-[150px] sm:w-[150px]"
              style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}52` }}
            >
              <span className="font-korean text-[80px] font-bold leading-none text-[#16202F] sm:text-[96px] dark:text-white">
                {letter.char}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[36px] font-semibold leading-none tracking-[-0.03em] text-[#16202F] sm:text-[44px] dark:text-white">
                {letter.romanization}
              </div>
              <div className="mt-2.5 text-[14px] font-medium text-[#4A5566] dark:text-gray-400">
                {isVowel ? 'vowel · 모음 (mo-eum)' : 'consonant · 자음 (ja-eum)'}
                {info && <> · called <span className="font-korean">{info.name}</span> ({info.nameRoman})</>}
              </div>
              {info && (
                <p className="mt-3.5 text-[15px] leading-[1.6] text-[#3E4A5A] sm:text-base dark:text-gray-300">
                  Sounds {info.sound}.
                </p>
              )}
              {isStudied(letter.char) && (
                <span className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
                      style={{ color: ACC.light }}>
                  ✓ Learned
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={() => speakLetter(letter.char)}
              className="flex h-12 items-center gap-2.5 rounded-[10px] px-[22px] text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
            >
              <span className="flex h-3.5 items-end gap-[2.5px]" aria-hidden="true">
                <span className="kl-bar w-[3px] bg-white" style={{ height: '100%' }} />
                <span className="kl-bar w-[3px] bg-white" style={{ height: '100%', animationDelay: '0.15s' }} />
                <span className="kl-bar w-[3px] bg-white" style={{ height: '100%', animationDelay: '0.3s' }} />
              </span>
              Hear it
            </button>
            {setActiveSection && (
              <button
                onClick={() => setActiveSection('writing')}
                className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
              >
                Trace it
              </button>
            )}
            <span className="text-[13px] text-[#4A5566] dark:text-gray-500">
              Plays slowly — and marks the letter as learned.
            </span>
          </div>

          {/* What this letter unlocks */}
          <div className="mt-7 border-t border-[rgba(20,32,47,0.12)] pt-5 dark:border-gray-800">
            {readableWords.length > 0 ? (
              <>
                <div className="mb-3 text-[13px] font-semibold text-[#16202F] dark:text-white">
                  You can now read {readableWords.length === 1 ? 'this word' : `${readableWords.length === 2 ? 'two' : 'three'} words`}
                </div>
                <div className="flex flex-wrap gap-3">
                  {readableWords.map(w => (
                    <button
                      key={w.korean}
                      onClick={() => say(w.korean)}
                      className="kl-well min-w-[104px] flex-1 rounded-xl px-4 py-3 text-left transition-colors hover:border-[rgba(20,32,47,0.22)]"
                      title={`Hear ${w.korean}`}
                    >
                      <div className="font-korean text-[24px] font-bold text-[#16202F] dark:text-white">{w.korean}</div>
                      <div className="mt-1.5 text-[12.5px] text-[#4A5566] dark:text-gray-400">
                        {w.romanization} · {w.english}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[13.5px] text-[#4A5566] dark:text-gray-400">
                {studiedCount < 10
                  ? 'Learn a few vowels and real words will start appearing here — Korean letters combine into syllable blocks, so a handful unlocks a lot.'
                  : 'This letter is a rare one — no word in the vocabulary list uses it yet. It still shows up inside longer words you will meet later.'}
              </p>
            )}
          </div>
        </div>

        {/* How to write it */}
        {strokeData && (
          <div className="kl-card p-6 sm:p-7">
            <div className="text-[15px] font-semibold text-[#16202F] dark:text-white">How to write it</div>
            <div className="mt-1.5 text-[13px] text-[#4A5566] dark:text-gray-400">{strokeData.tip}</div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {strokeData.strokes.map((_, k) => {
                const isLast = k === strokeData.strokes.length - 1;
                return (
                  <div
                    key={k}
                    className="relative flex h-[106px] items-center justify-center rounded-xl"
                    style={isLast
                      ? { background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D` }
                      : { background: 'rgba(20,32,47,0.035)', border: '1px solid rgba(20,32,47,0.10)' }}
                  >
                    <span className="absolute left-3 top-2.5 text-[12px] font-semibold"
                          style={{ color: isLast ? ACC.light : '#4A5566' }}>
                      {k + 1}
                    </span>
                    <svg width="72" height="72" viewBox="0 0 100 100" aria-hidden="true">
                      {/* strokes already written */}
                      {strokeData.strokes.slice(0, k).map((d, j) => (
                        <path key={j} d={d} fill="none" stroke="currentColor"
                              className="text-[#16202F]/40 dark:text-white/35"
                              strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
                      ))}
                      {/* the stroke being added, drawing itself */}
                      <path
                        d={strokeData.strokes[k]}
                        pathLength={1}
                        className="kl-draw"
                        fill="none"
                        stroke={ACC.light}
                        strokeWidth={8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-[12.5px] text-[#4A5566] dark:text-gray-500">
              {strokeData.strokes.length} {strokeData.strokes.length === 1 ? 'stroke' : 'strokes'}, in this order.
              {setActiveSection && ' Use "Trace it" to write it yourself.'}
            </div>
          </div>
        )}
      </div>

      {/* ── Reference material, with "next" sitting beside it (as the mockup) ── */}
      <div className="mt-5 space-y-3.5">
        <Drawer
          label="The whole alphabet"
          meta={`${consonants.length} consonants · ${vowels.length} vowels`}
          action={
            // Once this letter is learned, moving on becomes the obvious step —
            // so the button fills in rather than the page moving on its own.
            <button
              onClick={() => setPicked(nextLetter.char)}
              className={`flex h-14 flex-none items-center gap-2 whitespace-nowrap rounded-xl px-5 text-[14px] font-semibold transition-colors ${
                isStudied(letter.char)
                  ? 'text-white'
                  : 'border border-[rgba(20,32,47,0.14)] bg-[rgba(255,252,244,0.7)] text-[#16202F] hover:bg-[#FFFCF4] dark:border-gray-800 dark:bg-gray-900/50 dark:text-white dark:hover:bg-gray-900'
              }`}
              style={isStudied(letter.char)
                ? { background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }
                : undefined}
            >
              Next letter: <span className="font-korean">{nextLetter.char}</span>
              <ArrowRight className="h-4 w-4" style={isStudied(letter.char) ? undefined : { color: ACC.light }} />
            </button>
          }
        >
          {close => (
            <HangulAlphabetDrawer
              currentChar={letter.char}
              isStudied={isStudied}
              studiedCount={studiedCount}
              onSelect={setPicked}
              onToggleStudied={char => toggleProgress?.(keyFor(char))}
              onSpeak={say}
              close={close}
            />
          )}
        </Drawer>

        <Drawer label="How syllable blocks work" meta="음절">
          <div className="kl-card p-6">
            <p className="mb-4 text-[14px] leading-relaxed text-[#3E4A5A] dark:text-gray-300">
              Korean is not written in a line of letters — it is written in syllable blocks.
              Each block stacks at least one consonant and one vowel together.
            </p>
            <div className="space-y-3">
              <div className="kl-well flex items-start gap-3.5 rounded-xl p-3.5">
                <span className="font-korean text-[26px] font-bold leading-none" style={{ color: ACC.light }}>가</span>
                <div>
                  <p className="text-[14px] font-semibold text-[#16202F] dark:text-white">Consonant + vowel</p>
                  <p className="mt-0.5 text-[12.5px] text-[#4A5566] dark:text-gray-400">ㄱ + ㅏ = 가 (ga) — the simplest block</p>
                </div>
              </div>
              <div className="kl-well flex items-start gap-3.5 rounded-xl p-3.5">
                <span className="font-korean text-[26px] font-bold leading-none" style={{ color: '#2E6B59' }}>각</span>
                <div>
                  <p className="text-[14px] font-semibold text-[#16202F] dark:text-white">
                    Consonant + vowel + 받침 (batchim)
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-[#4A5566] dark:text-gray-400">ㄱ + ㅏ + ㄱ = 각 (gak) — a final consonant underneath</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-[#4A5566] dark:text-gray-500">
              A consonant's sound can shift depending on where it sits in the block — which is
              why the letters above list two sounds each.
            </p>
          </div>
        </Drawer>
      </div>
    </div>
  );
};

export default HangulSection;
