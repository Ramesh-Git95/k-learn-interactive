import React, { useCallback, useEffect, useRef, useState } from 'react';

// Hangul syllable mixer — the landing page's interactive demo.
//
// Ported from the Claude Design mock "Hangul Hero". The interaction is the
// point: pick a consonant and a vowel and a REAL Hangul syllable assembles from
// them. That's the actual insight about the writing system — blocks are built,
// not memorised — and it lands in about three seconds, which the old grid of
// clickable characters never managed.
//
// Colours follow this project's Hanji/Dancheong palette rather than the mock's
// purple, so it reads as part of the page instead of an import.

// Hangul syllables are composed arithmetically, which is what makes this work:
// 0xAC00 + (initial x 588) + (medial x 28) + final. The index tables below are
// positions in Unicode's initial/medial orderings, not the alphabet's.
const CHO = [
  { ch: 'ㄱ', idx: 0,  rom: 'g' },
  { ch: 'ㄴ', idx: 2,  rom: 'n' },
  { ch: 'ㅁ', idx: 6,  rom: 'm' },
  { ch: 'ㅂ', idx: 7,  rom: 'b' },
  { ch: 'ㅅ', idx: 9,  rom: 's' },
  { ch: 'ㅇ', idx: 11, rom: ''  }, // silent as an initial
];

const JUNG = [
  { ch: 'ㅏ', idx: 0,  rom: 'a'  },
  { ch: 'ㅓ', idx: 4,  rom: 'eo' },
  { ch: 'ㅗ', idx: 8,  rom: 'o'  },
  { ch: 'ㅜ', idx: 13, rom: 'u'  },
  { ch: 'ㅣ', idx: 20, rom: 'i'  },
  { ch: 'ㅡ', idx: 18, rom: 'eu' },
];

// Combos that begin a real, common word — the reward for exploring.
const WORDS: Record<string, { word: string; meaning: string }> = {
  '0-0': { word: '가방',   meaning: 'bag' },
  '1-0': { word: '나',     meaning: 'I / me' },
  '1-1': { word: '너',     meaning: 'you' },
  '1-2': { word: '노래',   meaning: 'song' },
  '2-3': { word: '무지개', meaning: 'rainbow' },
  '3-0': { word: '바다',   meaning: 'sea' },
  '3-3': { word: '부모',   meaning: 'parents' },
  '4-0': { word: '사랑',   meaning: 'love' },
  '4-2': { word: '소리',   meaning: 'sound' },
  '5-4': { word: '이름',   meaning: 'name' },
};

const TOTAL_COMBOS = CHO.length * JUNG.length; // 36
const PARTICLE_COLORS = ['#E4572E', '#D9A441', '#3F8571', '#2F5D8A', '#8E3B54'];

const compose = (choI: number, jungI: number) =>
  String.fromCharCode(0xac00 + CHO[choI].idx * 588 + JUNG[jungI].idx * 28);

interface Burst { id: number; parts: { tx: number; ty: number; color: string }[]; }

export default function HangulMixer() {
  const [choIndex, setChoIndex] = useState<number | null>(null);
  const [jungIndex, setJungIndex] = useState<number | null>(null);
  const [tried, setTried] = useState<Set<string>>(new Set());
  const [found, setFound] = useState<Set<string>>(new Set());
  const [burst, setBurst] = useState<Burst | null>(null);
  const [toast, setToast] = useState<{ word: string; meaning: string } | null>(null);

  const burstId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const speak = (ch: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // required before every speak() in this app
    const u = new SpeechSynthesisUtterance(ch);
    u.lang = 'ko-KR';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  };

  const commit = useCallback((c: number, j: number) => {
    const key = `${c}-${j}`;
    speak(compose(c, j));

    setTried(prev => new Set(prev).add(key));

    const id = ++burstId.current;
    setBurst({
      id,
      parts: Array.from({ length: 12 }, (_, k) => {
        const angle = (Math.PI * 2 * k) / 12 + Math.random() * 0.3;
        const dist = 46 + Math.random() * 26;
        return {
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist,
          color: PARTICLE_COLORS[k % PARTICLE_COLORS.length],
        };
      }),
    });
    timers.current.push(setTimeout(() => {
      // Only clear if no newer burst has replaced this one.
      setBurst(b => (b && b.id === id ? null : b));
    }, 750));

    const hit = WORDS[key];
    if (hit) {
      // The toast celebrates DISCOVERY, so it only fires the first time.
      setFound(prev => {
        if (prev.has(key)) return prev;
        setToast(hit);
        timers.current.push(setTimeout(() => setToast(t => (t === hit ? null : t)), 1600));
        return new Set(prev).add(key);
      });
    }
  }, []);

  const pickCho = (i: number) => {
    setChoIndex(i);
    if (jungIndex !== null) commit(i, jungIndex);
  };
  const pickJung = (i: number) => {
    setJungIndex(i);
    if (choIndex !== null) commit(choIndex, i);
  };
  const randomize = () => {
    const c = Math.floor(Math.random() * CHO.length);
    const j = Math.floor(Math.random() * JUNG.length);
    setChoIndex(c);
    setJungIndex(j);
    commit(c, j);
  };

  const hasResult = choIndex !== null && jungIndex !== null;
  const syllable = hasResult ? compose(choIndex!, jungIndex!) : null;
  const readout = hasResult
    ? `${syllable}  ·  ${CHO[choIndex!].rom}${JUNG[jungIndex!].rom}`
    : 'Pick a consonant and a vowel to begin';

  // Chips arc outward from the centre — a small touch that makes the two
  // columns feel like they're feeding the wheel between them.
  const arc = (i: number, len: number) => Math.sin((i / (len - 1)) * Math.PI) * 10;

  const chipBase =
    'w-11 h-11 rounded-full flex items-center justify-center text-lg font-black text-white ' +
    'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70';

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5CFFB1] animate-pulse-gentle" />
          Interactive · Syllable Mixer
        </span>
        <button
          onClick={randomize}
          aria-label="Try a random combination"
          title="Surprise me"
          className="h-9 w-9 rounded-xl border border-white/20 bg-white/10 text-base text-white transition-transform hover:scale-110 hover:rotate-12"
        >
          🎲
        </button>
      </div>
      <p className="mb-5 text-[13px] font-medium text-white/60">
        Combine a consonant + a vowel — watch real Hangul assemble instantly
      </p>

      {/* Consonants · wheel · vowels */}
      <div className="flex items-center justify-between gap-2">
        {/* Consonants */}
        <div className="flex flex-col items-center gap-2">
          <span className="mb-0.5 text-[10px] font-black uppercase tracking-[0.06em] text-[#F8C4AE]">
            Consonant
          </span>
          {CHO.map((c, i) => {
            const sel = choIndex === i;
            return (
              <button
                key={c.ch}
                onClick={() => pickCho(i)}
                aria-pressed={sel}
                aria-label={`Consonant ${c.ch}`}
                className={`${chipBase} ${sel ? 'scale-110' : 'scale-100 hover:scale-105'}`}
                style={{
                  marginRight: arc(i, CHO.length),
                  fontFamily: 'Pretendard Variable, sans-serif',
                  border: `1px solid rgba(255,255,255,${sel ? 0.6 : 0.16})`,
                  background: sel ? 'linear-gradient(135deg,#F07A55,#E4572E)' : 'rgba(255,255,255,.07)',
                  boxShadow: sel ? '0 0 0 4px rgba(228,87,46,.25), 0 6px 16px -4px rgba(0,0,0,.5)' : 'none',
                }}
              >
                {c.ch}
              </button>
            );
          })}
        </div>

        {/* The wheel */}
        <div className="relative flex h-[340px] w-[190px] flex-none items-center justify-center">
          <div
            className="kl-mix-ring absolute h-[168px] w-[168px] rounded-full transition-opacity duration-500"
            style={{
              opacity: hasResult ? 1 : 0.35,
              background:
                'conic-gradient(from 0deg, #E4572E, #D9A441, #3F8571, #2F5D8A, #8E3B54, #E4572E)',
            }}
          />
          <div
            className="absolute h-[156px] w-[156px] rounded-full"
            style={{ background: '#16202F', boxShadow: 'inset 0 0 30px rgba(0,0,0,.45)' }}
          />

          <div className="relative flex h-[156px] w-[156px] items-center justify-center">
            {!hasResult && (
              <div className="kl-mix-idle flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-white/30 text-2xl font-black text-white/35">
                ?
              </div>
            )}

            {syllable && (
              <div
                // Keyed by the syllable so a new combination re-triggers the
                // materialise animation instead of silently swapping glyphs.
                key={syllable}
                className="kl-mix-syllable text-6xl font-black text-white"
                style={{ fontFamily: 'Pretendard Variable, sans-serif', textShadow: '0 6px 24px rgba(0,0,0,.4)' }}
              >
                {syllable}
              </div>
            )}

            {burst?.parts.map((p, k) => (
              <span
                key={`${burst.id}-${k}`}
                className="kl-mix-particle pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -m-[3px] rounded-full"
                style={{
                  background: p.color,
                  ['--kl-tx' as string]: `${p.tx}px`,
                  ['--kl-ty' as string]: `${p.ty}px`,
                }}
              />
            ))}
          </div>

          {toast && (
            <div
              className="kl-mix-toast absolute bottom-1 left-1/2 whitespace-nowrap rounded-full border border-[#5CFFB1]/40 bg-[#5CFFB1]/15 px-3 py-1.5 text-[12px] font-bold text-[#5CFFB1]"
              role="status"
            >
              ✨ {toast.word} · {toast.meaning}
            </div>
          )}
        </div>

        {/* Vowels */}
        <div className="flex flex-col items-center gap-2">
          <span className="mb-0.5 text-[10px] font-black uppercase tracking-[0.06em] text-[#9DBBD8]">
            Vowel
          </span>
          {JUNG.map((v, i) => {
            const sel = jungIndex === i;
            return (
              <button
                key={v.ch}
                onClick={() => pickJung(i)}
                aria-pressed={sel}
                aria-label={`Vowel ${v.ch}`}
                className={`${chipBase} ${sel ? 'scale-110' : 'scale-100 hover:scale-105'}`}
                style={{
                  marginLeft: arc(i, JUNG.length),
                  fontFamily: 'Pretendard Variable, sans-serif',
                  border: `1px solid rgba(255,255,255,${sel ? 0.6 : 0.16})`,
                  background: sel ? 'linear-gradient(135deg,#4A7BB0,#2F5D8A)' : 'rgba(255,255,255,.07)',
                  boxShadow: sel ? '0 0 0 4px rgba(47,93,138,.3), 0 6px 16px -4px rgba(0,0,0,.5)' : 'none',
                }}
              >
                {v.ch}
              </button>
            );
          })}
        </div>
      </div>

      {/* Readout */}
      <div className="mt-1.5 min-h-[22px] text-center" aria-live="polite">
        <span className="text-[15px] font-bold text-white/85">{readout}</span>
      </div>

      {/* Progress */}
      <div className="mt-3.5">
        <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-white/55">
          <span>{tried.size} / {TOTAL_COMBOS} combos tried</span>
          <span>{found.size} real words found</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/12">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${(tried.size / TOTAL_COMBOS) * 100}%`,
              background: 'linear-gradient(90deg,#E4572E,#8E3B54)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
