import React, { useEffect, useRef, useState } from 'react';

// The landing page's word strip.
//
// This replaced a 30-second linear marquee, which said "there is a lot of
// Korean here" — worth saying — but never held still long enough for any of it
// to be read. One word is shown at full size instead: the Korean is uncovered a
// syllable at a time, left to right, the direction it is written, then the
// romanisation and meaning arrive under it. It holds for four seconds and moves
// on, and the dots say how many there are.

interface Pair { ko: string; rom: string; en: string }

// ── ROMANISATION NEEDS A NATIVE SPEAKER'S EYE ────────────────────────────────
// Five of these are lifted from content already shipping in data/koreanData.ts,
// two of them out of longer phrases (이거 얼마예요? → eolmayeyo, 화장실 어디예요?
// → eodiyeyo). They are marked ✓. The other ten were written here and have not
// been checked — add them to the proofreading pile with grammarNotes,
// phraseNotes, topikQuestions and the mixer's word lists.
const PAIRS: Pair[] = [
  { ko: '안녕하세요', rom: 'annyeonghaseyo', en: 'Hello' },        // ✓ shipped
  { ko: '감사합니다', rom: 'gamsahamnida',   en: 'Thank you' },    // ✓ shipped
  { ko: '사랑해',     rom: 'saranghae',      en: 'I love you' },
  { ko: '한국어',     rom: 'hangugeo',       en: 'Korean' },
  { ko: '공부하다',   rom: 'gongbuhada',     en: 'To study' },
  { ko: '맛있다',     rom: 'masitda',        en: 'Delicious' },
  { ko: '드라마',     rom: 'deurama',        en: 'K-Drama' },
  { ko: '아이돌',     rom: 'aidol',          en: 'Idol' },
  { ko: '화이팅',     rom: 'hwaiting',       en: 'Fighting!' },
  { ko: '괜찮아요',   rom: 'gwaenchanayo',   en: "It's okay" },    // ✓ shipped
  { ko: '진짜요?',    rom: 'jinjjayo?',      en: 'Really?' },
  { ko: '대박',       rom: 'daebak',         en: 'Awesome' },
  { ko: '어디예요?',  rom: 'eodiyeyo?',      en: 'Where is it?' }, // ✓ from a shipped phrase
  { ko: '얼마예요?',  rom: 'eolmayeyo?',     en: 'How much?' },    // ✓ from a shipped phrase
  { ko: '멋있다',     rom: 'meositda',       en: 'Cool!' },
];

const HOLD_MS = 4000;
const SYLLABLE_MS = 90;
const KO_FONT = { fontFamily: 'Pretendard Variable, sans-serif' };

const speakKorean = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // required before every speak() in this app
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 0.75;
  window.speechSynthesis.speak(u);
};

/** One span per syllable so each can be wiped in on its own delay. */
const InkWord: React.FC<{ text: string; animate: boolean }> = ({ text, animate }) => (
  <>
    {Array.from(text).map((ch, i) => (
      <span
        key={i}
        className={animate ? 'kl-ink-syl' : undefined}
        style={animate ? { animationDelay: `${i * SYLLABLE_MS}ms` } : undefined}
      >
        {ch}
      </span>
    ))}
  </>
);

export default function WordStrip() {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    setReduced(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      if (!pausedRef.current) setIndex(i => (i + 1) % PAIRS.length);
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  const go = (i: number) => {
    const t = ((i % PAIRS.length) + PAIRS.length) % PAIRS.length;
    setIndex(t);
    speakKorean(PAIRS[t].ko);
  };

  // Pausing is for a reader lingering — a pointer resting on the block, or a
  // keyboard user tabbed into it. Neither describes a tap: a touch tap fires a
  // synthetic mouseenter and focuses the button, but no mouseleave follows until
  // you touch something else, which used to leave the strip frozen on a phone.
  const hold = {
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch') pausedRef.current = true;
    },
    onPointerLeave: () => { pausedRef.current = false; },
    onPointerCancel: () => { pausedRef.current = false; },
    onFocus: (e: React.FocusEvent) => {
      try {
        if ((e.target as HTMLElement).matches(':focus-visible')) pausedRef.current = true;
      } catch {
        /* :focus-visible unsupported — leave it running rather than stuck */
      }
    },
    onBlur: () => { pausedRef.current = false; },
  };

  const cur = PAIRS[index];
  // The meaning follows the last syllable rather than landing with it.
  const tailDelay = cur.ko.length * SYLLABLE_MS;

  return (
    // kl-reveal is the page's own scroll-in class, picked up by the
    // useScrollReveal hook LandingPage already runs.
    <div className="kl-reveal px-4 py-10">
      <div className="mx-auto max-w-6xl" {...hold}>
        <div className="mb-3 flex items-center gap-3">
          <span className="flex-none text-[11.5px] font-black uppercase tracking-[0.16em] text-[#4A5566] dark:text-gray-300">
            <span aria-hidden className="mr-1.5 text-[#C13F22] dark:text-[#F5825E]">🔊</span>
            Tap a word to hear it
          </span>
          <span className="h-px flex-1 bg-[rgba(20,32,47,0.10)] dark:bg-white/10" />
          <span className="flex-none text-[11.5px] font-bold tabular-nums text-[#4A5566] dark:text-gray-400">
            {index + 1} / {PAIRS.length}
          </span>
        </div>

        <div
          className="kl-word-card flex flex-col items-start gap-6 rounded-[22px] px-6 py-6 sm:flex-row sm:items-center sm:gap-8 sm:px-9 sm:py-8"
          data-feature="true"
        >
          {/* The word */}
          <button
            onClick={() => speakKorean(cur.ko)}
            aria-label={`Hear ${cur.ko}, ${cur.en}`}
            className="min-w-0 flex-1 text-left"
          >
            <span
              // Keyed on the word so each change remounts the spans and the
              // wipe runs again rather than the text silently swapping.
              key={cur.ko}
              className="block break-keep text-[38px] font-black leading-[1.1] tracking-[-0.02em] text-[#16202F] sm:text-[54px] dark:text-white"
              style={KO_FONT}
            >
              <InkWord text={cur.ko} animate={!reduced} />
            </span>
            <span
              key={`${cur.ko}-rom`}
              className="kl-word-rise mt-2 block text-[14.5px] text-[#5A6472] dark:text-gray-400"
              style={{ animationDelay: `${tailDelay + 120}ms` }}
            >
              {cur.rom}
            </span>
            <span
              key={`${cur.ko}-en`}
              className="kl-word-rise mt-0.5 block text-[19px] font-bold text-[#C13F22] dark:text-[#F5825E]"
              style={{ animationDelay: `${tailDelay + 240}ms` }}
            >
              {cur.en}
            </span>
          </button>

          {/* Controls */}
          <div className="flex w-full flex-none flex-row items-center gap-4 sm:w-auto sm:flex-col sm:items-end sm:gap-3">
            <button
              onClick={() => speakKorean(cur.ko)}
              className="flex h-11 flex-none items-center gap-2 rounded-[11px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-[13.5px] font-bold text-[#16202F] transition-colors hover:border-[#C13F22] hover:text-[#C13F22] dark:border-white/25 dark:text-gray-100 dark:hover:border-[#F5825E] dark:hover:text-[#F5825E]"
            >
              <span aria-hidden>🔊</span> Hear it
            </button>

            <div className="flex flex-wrap items-center gap-1.5 sm:max-w-[168px] sm:justify-end">
              {PAIRS.map((p, i) => (
                <button
                  key={p.ko}
                  onClick={() => go(i)}
                  aria-label={`${p.en} — word ${i + 1} of ${PAIRS.length}`}
                  aria-current={i === index ? 'true' : undefined}
                  // The resting colour needs both themes — an ink dot at 20%
                  // is invisible on the dark card, so it stays a class rather
                  // than an inline value.
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index
                      ? 'bg-[#C13F22] dark:bg-[#F5825E]'
                      : 'bg-[rgba(20,32,47,0.22)] dark:bg-white/30'
                  }`}
                  style={{ width: i === index ? 18 : 6 }}
                />
              ))}
            </div>

            {reduced && (
              <button
                onClick={() => go(index + 1)}
                className="flex-none text-[11px] font-bold uppercase tracking-wider text-[#C13F22] transition-opacity hover:opacity-70 dark:text-[#F5825E]"
              >
                Next word →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
