import React, { useEffect, useRef, useState } from 'react';
import { segmentKorean, speakOnce, sleep, speechSupported, KoToken } from '../utils/pronunciation';

// Big Hangul syllable blocks that light up as they're spoken (karaoke). Two
// modes: ▶ Natural (whole word at speed) and 🐢 Slow (block-by-block at natural
// speed with gaps — comprehensible without time-stretch distortion). Tap any
// block to hear just that syllable. Reusable across every speaking surface.

const NATURAL_RATE = 0.95;
const SLOW_RATE = 0.9;
const GAP_MS = 240;               // pause between syllables in slow mode
const EST_PER_SYLLABLE_MS = 340;  // natural-mode highlight estimate

interface SyllablePlayerProps {
  text: string;
  romanization?: string;
  /** Speak the whole word once on mount. */
  autoPlay?: boolean;
}

export default function SyllablePlayer({ text, romanization, autoPlay = false }: SyllablePlayerProps) {
  const tokens: KoToken[] = segmentKorean(text);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showRoman, setShowRoman] = useState(false);

  // Monotonic token guards playback so a new action / unmount cancels the old.
  const playToken = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const stop = () => {
    playToken.current++;
    clearTimers();
    if (speechSupported()) window.speechSynthesis.cancel();
    setActiveIdx(null);
    setPlaying(false);
  };

  // Cancel any speech when the player unmounts.
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const speakableIdx = tokens.reduce<number[]>((acc, t, i) => { if (t.speak) acc.push(i); return acc; }, []);

  const playNatural = async () => {
    if (!speechSupported()) return;
    stop();
    const token = ++playToken.current;
    setPlaying(true);
    window.speechSynthesis.cancel();
    await sleep(60); // let cancel settle so the first utterance isn't dropped
    if (playToken.current !== token) return;

    // Estimated karaoke sweep (cosmetic; slow mode is the exact one).
    speakableIdx.forEach((tokenIdx, i) => {
      const t = setTimeout(() => { if (playToken.current === token) setActiveIdx(tokenIdx); }, i * EST_PER_SYLLABLE_MS);
      timers.current.push(t);
    });

    await speakOnce(text, NATURAL_RATE);
    if (playToken.current !== token) return;
    clearTimers();
    setActiveIdx(null);
    setPlaying(false);
  };

  const playSlow = async () => {
    if (!speechSupported()) return;
    stop();
    const token = ++playToken.current;
    setPlaying(true);
    window.speechSynthesis.cancel();
    await sleep(60);

    for (const tokenIdx of speakableIdx) {
      if (playToken.current !== token) return;
      setActiveIdx(tokenIdx);
      await speakOnce(tokens[tokenIdx].text, SLOW_RATE);
      if (playToken.current !== token) return;
      await sleep(GAP_MS);
    }
    if (playToken.current !== token) return;
    setActiveIdx(null);
    setPlaying(false);
  };

  const tapBlock = async (tokenIdx: number) => {
    if (!speechSupported()) return;
    stop();
    const token = ++playToken.current;
    setActiveIdx(tokenIdx);
    await speakOnce(tokens[tokenIdx].text, NATURAL_RATE);
    if (playToken.current === token) setActiveIdx(null);
  };

  useEffect(() => {
    if (autoPlay) { const t = setTimeout(() => playNatural(), 250); return () => clearTimeout(t); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Size blocks to the syllable count so they stay on ONE row for typical
  // words/phrases; very long ones scroll horizontally rather than wrapping.
  const count = speakableIdx.length;
  const box = count <= 4 ? 'w-16 h-16 text-3xl'
            : count <= 6 ? 'w-[52px] h-[52px] text-2xl'
            : count <= 9 ? 'w-11 h-11 text-xl'
            : 'w-9 h-9 text-lg';

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Syllable blocks — single row (centered; scrolls if very long) */}
      <div className="w-full overflow-x-auto">
        <div className="flex items-center gap-2 w-max mx-auto px-1 py-1">
        {tokens.map((tok, i) =>
          tok.speak ? (
            <button
              key={i}
              onClick={() => tapBlock(i)}
              aria-label={`Hear syllable ${tok.text}`}
              className={`flex-shrink-0 flex items-center justify-center rounded-2xl font-black transition-all duration-200 ${box} ${
                activeIdx === i
                  ? 'text-white scale-110 shadow-lg'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:-translate-y-0.5 hover:border-[#E4572E]/50'
              }`}
              style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                ...(activeIdx === i ? { background: 'var(--brand-gradient)' } : {}),
              }}
            >
              {tok.text}
            </button>
          ) : (
            <span key={i} className="flex-shrink-0 text-2xl text-gray-300 dark:text-gray-600 px-0.5">
              {tok.text.trim() ? tok.text : ' '}
            </span>
          ),
        )}
        </div>
      </div>

      {/* Romanization hint (secondary, toggle) */}
      {romanization && (
        <button
          onClick={() => setShowRoman(s => !s)}
          className="text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-[#E4572E] transition-colors"
        >
          {showRoman ? `🗣️ ${romanization}` : 'Show romanization'}
        </button>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={playNatural}
          className="px-5 py-2.5 rounded-xl text-sm font-black text-white btn-brand"
        >
          ▶ Play
        </button>
        <button
          onClick={playSlow}
          className="px-5 py-2.5 rounded-xl text-sm font-black border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-[#E4572E] hover:text-[#E4572E] transition-colors"
        >
          🐢 Slow · syllable by syllable
        </button>
      </div>

      <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
        {playing ? 'Listening along…' : 'Tap any block to hear just that syllable · 조금씩 배워봐요'}
      </p>
    </div>
  );
}
