import React, { useEffect, useRef, useState } from 'react';

// The landing page's word strip.
//
// This replaced a 30-second linear marquee. A continuous scroll signals "there
// is a lot of Korean here", which is worth saying, but nothing ever holds still
// long enough to read — so it said the one thing at the cost of the other.
//
// Three words are shown instead: the one just gone, the one being read, and the
// one coming next. The strip slides one card left every few seconds and then
// waits, so the queue stays visible while the leading word can be read. The
// leading word is uncovered a syllable at a time, left to right, the direction
// Hangul is written.
//
// Below 640px the track shows a single card, which is the right shape for a
// phone — see .kl-strip-track in index.css for how one step stays -25% at both
// widths.

const PAIRS: { ko: string; en: string }[] = [
  { ko: '안녕하세요', en: 'Hello' },
  { ko: '감사합니다', en: 'Thank you' },
  { ko: '사랑해', en: 'I love you' },
  { ko: '한국어', en: 'Korean' },
  { ko: '공부하다', en: 'To study' },
  { ko: '맛있다', en: 'Delicious' },
  { ko: '드라마', en: 'K-Drama' },
  { ko: '아이돌', en: 'Idol' },
  { ko: '화이팅', en: 'Fighting!' },
  { ko: '괜찮아요', en: "It's okay" },
  { ko: '진짜요?', en: 'Really?' },
  { ko: '대박', en: 'Awesome' },
  { ko: '어디예요?', en: 'Where is it?' },
  { ko: '얼마예요?', en: 'How much?' },
  { ko: '멋있다', en: 'Cool!' },
];

const STEP_MS = 3600;
const SLIDE_MS = 620;
const SYLLABLE_MS = 90;
const KO_FONT = { fontFamily: 'Pretendard Variable, sans-serif' };

// The page leans hard on persimmon. The progress line is pine so the section
// has a second colour to breathe with, rather than another orange bar.
const PINE = '#2E6B59';
const PINE_LIGHT = '#4E9B85';

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
  const [stepping, setStepping] = useState(false);
  const [snap, setSnap] = useState(false); // one frame with no transition, to reset
  const [reduced, setReduced] = useState(false);

  const pausedRef = useRef(false);
  const startRef = useRef(0);
  const progressRef = useRef(0);
  const steppingRef = useRef(false);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setReduced(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  }, []);

  const at = (i: number) => PAIRS[((i % PAIRS.length) + PAIRS.length) % PAIRS.length];

  // Slide one card left, then swap the data underneath and snap the track back
  // with no transition, so the next step starts from the same place.
  const beginStep = () => {
    if (steppingRef.current) return;
    steppingRef.current = true;
    setStepping(true);
    window.setTimeout(() => {
      setSnap(true);
      setIndex(i => (i + 1) % PAIRS.length);
      setStepping(false);
      steppingRef.current = false;
      requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false)));
    }, SLIDE_MS);
  };

  // The bar is written straight to the DOM rather than held in state — it moves
  // every frame, and re-rendering the strip sixty times a second to draw a line
  // would be wasteful. Only the step itself is a state change.
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    startRef.current = performance.now();

    const tick = (now: number) => {
      if (pausedRef.current || steppingRef.current) {
        // Hold the elapsed time still, so resuming carries on rather than jumping.
        startRef.current = now - progressRef.current * STEP_MS;
      } else {
        const p = Math.min(1, (now - startRef.current) / STEP_MS);
        progressRef.current = p;
        if (barRef.current) barRef.current.style.width = `${p * 100}%`;
        if (p >= 1) {
          progressRef.current = 0;
          if (barRef.current) barRef.current.style.width = '0%';
          startRef.current = now;
          beginStep();
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const jumpTo = (i: number) => {
    if (steppingRef.current) return;
    const target = ((i % PAIRS.length) + PAIRS.length) % PAIRS.length;
    setIndex(target);
    startRef.current = performance.now();
    progressRef.current = 0;
    if (barRef.current) barRef.current.style.width = '0%';
    speakKorean(PAIRS[target].ko);
  };

  // Pausing is for a reader who is lingering — a pointer resting on the strip,
  // or a keyboard user tabbed into it. Neither describes a tap.
  //
  // A touch tap fires a synthetic mouseenter AND focuses the button, but no
  // mouseleave ever follows until you touch something else, so hovering logic
  // left the strip frozen after every tap on a phone. Touch pointers are
  // therefore ignored, and focus only counts when it is focus-visible, which a
  // tap does not produce but a Tab key does.
  const hold = {
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch') pausedRef.current = true;
    },
    onPointerLeave: () => { pausedRef.current = false; },
    onPointerCancel: () => { pausedRef.current = false; },
    onFocus: (e: React.FocusEvent) => {
      const el = e.target as HTMLElement;
      try {
        if (el.matches(':focus-visible')) pausedRef.current = true;
      } catch {
        /* :focus-visible unsupported — leave it running rather than stuck */
      }
    },
    onBlur: () => { pausedRef.current = false; },
  };

  // Four cards ride the track: the one just gone, the current, and the two
  // coming. The lead moves to the third as the slide runs, so the emphasis
  // travels with the movement instead of snapping at the end.
  const cards = [at(index - 1), at(index), at(index + 1), at(index + 2)];
  const leadAt = stepping ? 2 : 1;

  return (
    // kl-reveal is the page's own scroll-in class, picked up by the
    // useScrollReveal hook LandingPage already runs — so this section arrives
    // the same way every other one does, and shows immediately under
    // reduced-motion.
    //
    // No outer card: the word cards ARE the surface. Wrapping them in a second
    // panel made a box inside a box and buried the thing worth looking at.
    <div className="kl-reveal px-4 py-10">
      <div className="mx-auto max-w-6xl" {...hold}>
        <div className="mb-4 flex items-center gap-3">
          <span
            className="flex-none text-[11.5px] font-black uppercase tracking-[0.16em] text-[#4A5566] dark:text-gray-300"
          >
            <span aria-hidden className="mr-1.5" style={{ color: PINE }}>🔊</span>
            Tap a word to hear it
          </span>
          <span className="h-px flex-1 bg-[rgba(20,32,47,0.10)] dark:bg-white/10" />
          <span className="flex-none text-[11.5px] font-bold tabular-nums text-[#4A5566] dark:text-gray-400">
            {index + 1} / {PAIRS.length}
          </span>
        </div>

        <div className="overflow-hidden">
          <div
            className="kl-strip-track flex"
            style={{
              transform: `translateX(calc(var(--kl-rest) - ${stepping ? 25 : 0}%))`,
              transition: snap ? 'none' : `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
          >
            {cards.map((p, k) => {
              const isLead = k === leadAt;
              return (
                <div key={`${index}-${k}`} className="w-1/4 flex-none px-1.5">
                  <button
                    onClick={() => (isLead ? speakKorean(p.ko) : jumpTo(index + (k - 1)))}
                    aria-label={`Hear ${p.ko}, ${p.en}`}
                    data-lead={isLead}
                    className="kl-word-card flex h-full w-full flex-col justify-center gap-1 rounded-2xl px-5 py-4 text-left transition-[border-color,box-shadow,background] duration-500 sm:px-6 sm:py-5"
                  >
                    <span
                      // Keyed on the word so a step remounts the spans and the
                      // wipe runs again rather than the text silently swapping.
                      key={p.ko}
                      className={`truncate font-black leading-tight ${
                        isLead
                          ? 'text-[26px] text-[#16202F] sm:text-[32px] dark:text-white'
                          : 'text-[19px] text-[#3E4A5A] dark:text-gray-300'
                      }`}
                      style={KO_FONT}
                    >
                      {isLead ? <InkWord text={p.ko} animate={!reduced} /> : p.ko}
                    </span>
                    <span
                      className={`truncate ${
                        isLead
                          ? 'text-[15px] font-bold text-[#C13F22] dark:text-[#F5825E]'
                          : 'text-[13px] font-medium text-[#5A6472] dark:text-gray-400'
                      }`}
                    >
                      {p.en}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 px-1.5">
          <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-white/10">
            <span
              ref={barRef}
              className="block h-full rounded-full"
              style={{ width: 0, background: `linear-gradient(90deg, ${PINE}, ${PINE_LIGHT})` }}
            />
          </span>
          {reduced && (
            <button
              onClick={() => jumpTo(index + 1)}
              className="flex-none text-[11px] font-bold uppercase tracking-wider transition-opacity hover:opacity-70"
              style={{ color: PINE }}
            >
              Next word →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
