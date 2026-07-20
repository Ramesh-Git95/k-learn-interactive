import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CELEBRATE_EVENT, type Celebration } from '../utils/celebrate';

// Renders celebrations. Mounted once, app-wide.
//
// Confetti is plain absolutely-positioned spans driven by CSS keyframes — a few
// KB of markup rather than a ~70KB animation runtime. Everything is
// pointer-events-none so a celebration can never block a tap, and the whole
// thing collapses to a quiet fade when the user asks for reduced motion.

const CONFETTI_COUNT = 28;
const VISIBLE_MS = 2400;

const COLORS = ['#E4572E', '#D9A441', '#3F8571', '#8E3B54', '#2F5D8A'];

const VARIANT_RING: Record<Celebration['variant'], string> = {
  level:   'from-[#E4572E] to-[#8E3B54]',
  streak:  'from-[#E4572E] to-[#D9A441]',
  unit:    'from-[#3F8571] to-[#2F5D8A]',
  letter:  'from-[#3F8571] to-[#D9A441]',
  perfect: 'from-[#D9A441] to-[#E4572E]',
};

interface Piece { left: number; delay: number; duration: number; color: string; size: number; rotate: number; }

export default function CelebrationHost() {
  const [active, setActive] = useState<Celebration | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    const onCelebrate = (e: Event) => {
      const detail = (e as CustomEvent<Celebration>).detail;
      if (!detail) return;
      // A newer celebration replaces the old one rather than queueing — two
      // milestones at once should read as one moment, not a backlog.
      if (timer.current) clearTimeout(timer.current);
      setActive(detail);
      timer.current = setTimeout(() => setActive(null), VISIBLE_MS);
    };

    window.addEventListener(CELEBRATE_EVENT, onCelebrate);
    return () => {
      window.removeEventListener(CELEBRATE_EVENT, onCelebrate);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Fresh confetti per celebration, so two in a row don't look identical.
  const pieces = useMemo<Piece[]>(() => {
    if (!active || reducedMotion) return [];
    return Array.from({ length: CONFETTI_COUNT }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 350,
      duration: 1500 + Math.random() * 900,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 7,
      rotate: Math.random() * 360,
    }));
  }, [active, reducedMotion]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center overflow-hidden"
      role="status"
      aria-live="polite"
    >
      {/* Confetti */}
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-[2px] kl-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            ['--kl-spin' as string]: `${p.rotate}deg`,
          }}
        />
      ))}

      {/* The badge */}
      <div className={reducedMotion ? 'animate-fade-in' : 'kl-celebrate-pop'}>
        <div className="flex flex-col items-center gap-3 px-8 py-6 rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl border border-gray-100 dark:border-gray-800">
          <div
            className={`w-20 h-20 rounded-full bg-gradient-to-br ${VARIANT_RING[active.variant]} flex items-center justify-center text-4xl shadow-lg`}
          >
            {active.emoji}
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-gray-900 dark:text-white">{active.title}</div>
            {active.subtitle && (
              <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                {active.subtitle}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
