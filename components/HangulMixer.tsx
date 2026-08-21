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

// Blocks that ARE a word on their own — not words that merely start with the
// block. The distinction matters because it is what lets the demo say "you just
// read a Korean word" and mean it: build 소 and you have read 'cow', whole.
//
// Deliberately short. Plenty of other blocks here have a dictionary gloss from
// their Chinese-derived reading — 고 'high', 부 'wealth', 수 'number' — but none
// of those stands alone in speech, and calling them real words on the landing
// page is the kind of claim a Korean speaker would pull us up on. Everything
// not listed is reported honestly as a valid syllable with no meaning by itself.
const WORDS: Record<string, string> = {
  '1-0': 'I, me',
  '1-1': 'you',
  '0-5': 'that',
  '4-0': 'four',
  '5-2': 'five',
  '0-3': 'nine',
  '4-2': 'cow',
  '3-4': 'rain',
  '2-3': 'radish',
  '5-4': 'two, this',
};

// A common word each block BEGINS. This is the other half of the truth, and the
// prettier half: 사 on its own is the number four, but it opens 사랑, love.
// Kept separate from WORDS so the page never implies you have read the whole
// word — you built one block of it. Every entry is checked to actually start
// with its block. Five blocks (니 므 브 스 으) open nothing common, and say so.
const STARTS: Record<string, { word: string; meaning: string }> = {
  '0-0': { word: '가방',     meaning: 'bag' },
  '0-1': { word: '거울',     meaning: 'mirror' },
  '0-2': { word: '고양이',   meaning: 'cat' },
  '0-3': { word: '구름',     meaning: 'cloud' },
  '0-4': { word: '기차',     meaning: 'train' },
  '0-5': { word: '그림',     meaning: 'picture' },
  '1-0': { word: '나비',     meaning: 'butterfly' },
  '1-1': { word: '너무',     meaning: 'too, very' },
  '1-2': { word: '노래',     meaning: 'song' },
  '1-3': { word: '누나',     meaning: 'older sister' },
  '1-5': { word: '느낌',     meaning: 'a feeling' },
  '2-0': { word: '마음',     meaning: 'heart, mind' },
  '2-1': { word: '머리',     meaning: 'head' },
  '2-2': { word: '모자',     meaning: 'hat' },
  '2-3': { word: '무지개',   meaning: 'rainbow' },
  '2-4': { word: '미안해요', meaning: 'sorry' },
  '3-0': { word: '바다',     meaning: 'sea' },
  '3-1': { word: '버스',     meaning: 'bus' },
  '3-2': { word: '보물',     meaning: 'treasure' },
  '3-3': { word: '부모',     meaning: 'parents' },
  '3-4': { word: '비행기',   meaning: 'aeroplane' },
  '4-0': { word: '사랑',     meaning: 'love' },
  '4-1': { word: '서울',     meaning: 'Seoul' },
  '4-2': { word: '소리',     meaning: 'sound' },
  '4-3': { word: '수박',     meaning: 'watermelon' },
  '4-4': { word: '시간',     meaning: 'time' },
  '5-0': { word: '아버지',   meaning: 'father' },
  '5-1': { word: '어머니',   meaning: 'mother' },
  '5-2': { word: '오늘',     meaning: 'today' },
  '5-3': { word: '우유',     meaning: 'milk' },
  '5-4': { word: '이름',     meaning: 'name' },
};

const TOTAL_COMBOS = CHO.length * JUNG.length; // 36
// Muted to match the mesh the burst now fires over — at full strength these
// read as confetti rather than as part of the panel.
const PARTICLE_COLORS = ['#C9A98F', '#A8761F', '#5C9E88', '#5C86B4', '#A3708A'];

const compose = (choI: number, jungI: number) =>
  String.fromCharCode(0xac00 + CHO[choI].idx * 588 + JUNG[jungI].idx * 28);

interface Burst { id: number; parts: { tx: number; ty: number; color: string }[]; }

export default function HangulMixer() {
  const [choIndex, setChoIndex] = useState<number | null>(null);
  const [jungIndex, setJungIndex] = useState<number | null>(null);
  const [tried, setTried] = useState<Set<string>>(new Set());
  const [found, setFound] = useState<Set<string>>(new Set());
  const [burst, setBurst] = useState<Burst | null>(null);
  const [toast, setToast] = useState<{ syllable: string; meaning: string } | null>(null);

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
      // The toast celebrates DISCOVERY, so it only fires the first time. The
      // panel keeps showing the meaning afterwards.
      setFound(prev => {
        if (prev.has(key)) return prev;
        const entry = { syllable: compose(c, j), meaning: hit };
        setToast(entry);
        timers.current.push(setTimeout(() => setToast(t => (t === entry ? null : t)), 1600));
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
  const romanization = hasResult ? `${CHO[choIndex!].rom}${JUNG[jungIndex!].rom}` : '';
  const comboKey = `${choIndex}-${jungIndex}`;
  const meaning = hasResult ? WORDS[comboKey] : undefined;
  const opens = hasResult ? STARTS[comboKey] : undefined;

  // The word this block opens, offered as a second fact rather than as a claim
  // about what was built. 사 is four; 사랑 is what four's block begins.
  const opensLine = opens && (
    <>
      {' '}It begins{' '}
      <b className="font-black text-white/80" style={{ fontFamily: 'Pretendard Variable, sans-serif' }}>
        {opens.word}
      </b>
      {' '}— {opens.meaning}.
    </>
  );

  // Three states, and the middle one is the reason this exists. Before, a
  // combination with no word behind it produced a burst of confetti and no
  // words at all — a dead end dressed as a reward. Saying "still legal Hangul"
  // turns it into the actual lesson: every one of these 36 is a real block.
  const readout = !hasResult
    ? {
        eyebrow: 'TRY IT',
        eyebrowColor: 'rgba(255,255,255,0.45)',
        title: 'Pick one of each',
        titleColor: 'rgba(255,255,255,0.9)',
        sub: <>One consonant and one vowel stack into a single readable block.</>,
      }
    : meaning
    ? {
        eyebrow: 'REAL WORD',
        eyebrowColor: '#8FD3B8',
        title: meaning,
        titleColor: '#FFFFFF',
        sub: <>You just read a Korean word.{opensLine}</>,
      }
    : {
        eyebrow: 'VALID SYLLABLE',
        eyebrowColor: '#C9A98F',
        title: 'No meaning on its own',
        titleColor: 'rgba(255,255,255,0.62)',
        sub: opens
          ? <>Still legal Hangul, and it is where words start.{opensLine}</>
          : <>Still legal Hangul — every pairing here is a block you could write. Try another vowel.</>,
      };

  // The blocks found so far, in the order they were discovered.
  const foundSyllables = Array.from(found).map(k => {
    const [c, j] = k.split('-').map(Number);
    return compose(c, j);
  });

  // Chips arc outward from the centre — a small touch that makes the two
  // columns feel like they're feeding the wheel between them.
  const arc = (i: number, len: number) => Math.sin((i / (len - 1)) * Math.PI) * 10;

  // 38px rather than 44. Six chips a column, twice over, is what sets this
  // panel's height, so the chip is the single biggest lever on it — this and
  // the smaller wheel take about 90px out of the block.
  // min-h/min-w are set explicitly to beat the global `button { min-height:
  // 44px }` in index.css, which otherwise snaps these back to 44 below 640px —
  // and since twelve chips in two columns of six are what set this panel's
  // height, the mobile block would not have shrunk at all.
  //
  // 38px is a deliberate trade, not an oversight: WCAG 2.2 AA asks for 24px and
  // this clears it comfortably. These are six adjacent chips in a picker where
  // a mis-tap costs one more tap, which is not the same risk as a 38px Delete.
  const chipBase =
    'w-[38px] h-[38px] min-w-[38px] min-h-[38px] rounded-full flex items-center justify-center ' +
    'text-[17px] font-black text-white ' +
    'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70';

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8FD3B8] animate-pulse-gentle" />
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
      <p className="mb-4 text-[12.5px] font-medium text-white/60">
        Combine a consonant + a vowel — watch real Hangul assemble instantly
      </p>

      {/* Consonants · wheel · vowels */}
      <div className="flex items-center justify-between gap-2">
        {/* Consonants */}
        <div className="flex flex-col items-center gap-2">
          <span className="mb-0.5 text-[10px] font-black uppercase tracking-[0.06em] text-white/70">
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
                  // Pine, not persimmon. The panel is a mesh of muted colour
                  // now, and a hot orange chip sat on top of it rather than in
                  // it.
                  // Ink, not a brand hue. The panel behind these now runs from
                  // orange through plum to blue, so any coloured chip clashes
                  // with part of it wherever it lands — a dark chip with a white
                  // rim reads cleanly against every inch of the field.
                  background: sel ? 'rgba(18,14,20,0.82)' : 'rgba(255,255,255,.06)',
                  boxShadow: sel ? '0 0 0 3px rgba(255,255,255,.55), 0 6px 16px -6px rgba(0,0,0,.6)' : 'none',
                }}
              >
                {c.ch}
              </button>
            );
          })}
        </div>

        {/* The wheel */}
        <div className="relative flex h-[262px] w-[150px] flex-none items-center justify-center">
          <div
            className="kl-mix-ring absolute h-[142px] w-[142px] rounded-full transition-opacity duration-500"
            style={{
              opacity: hasResult ? 1 : 0.35,
              background:
                // Softened to sit on the mesh — the full-strength brand hues
                // read as a spinning toy against a surface this quiet.
                'conic-gradient(from 0deg, #B4593C, #A8761F, #3F8571, #2F5D8A, #7A4055, #B4593C)',
            }}
          />
          <div
            className="absolute h-[131px] w-[131px] rounded-full"
            style={{ background: '#16202F', boxShadow: 'inset 0 0 30px rgba(0,0,0,.45)' }}
          />

          <div className="relative flex h-[131px] w-[131px] items-center justify-center">
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
                className="kl-mix-syllable text-[52px] font-black leading-none text-white"
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
              className="kl-mix-toast absolute bottom-1 left-1/2 whitespace-nowrap rounded-full border border-[#8FD3B8]/40 bg-[#8FD3B8]/15 px-3 py-1.5 text-[12px] font-bold text-[#8FD3B8]"
              role="status"
            >
              ✨ {toast.syllable} · {toast.meaning}
            </div>
          )}
        </div>

        {/* Vowels */}
        <div className="flex flex-col items-center gap-2">
          <span className="mb-0.5 text-[10px] font-black uppercase tracking-[0.06em] text-white/70">
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
                  background: sel ? 'rgba(18,14,20,0.82)' : 'rgba(255,255,255,.06)',
                  boxShadow: sel ? '0 0 0 3px rgba(255,255,255,.55), 0 6px 16px -6px rgba(0,0,0,.6)' : 'none',
                }}
              >
                {v.ch}
              </button>
            );
          })}
        </div>
      </div>

      {/* Readout — what you just built, and whether it means anything */}
      <div
        className="mt-2 min-h-[76px] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"
        aria-live="polite"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span
            className="text-[10.5px] font-black uppercase tracking-[0.13em]"
            style={{ color: readout.eyebrowColor }}
          >
            {readout.eyebrow}
          </span>
          {romanization && (
            <span className="text-[13px] font-semibold text-white/50">{romanization}</span>
          )}
        </div>
        <div
          className="mt-1 text-[19px] font-black leading-tight"
          style={{ color: readout.titleColor }}
        >
          {readout.title}
        </div>
        <p className="mt-1 text-[12.5px] leading-snug text-white/55">{readout.sub}</p>
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
              background: 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))',
            }}
          />
        </div>

        {/* The blocks you have turned up so far — a reason to keep going */}
        <div className="mt-2 min-h-[20px] text-[15px] font-bold tracking-[0.18em] text-[#8FD3B8]">
          {foundSyllables.join(' ')}
        </div>
      </div>
    </div>
  );
}
