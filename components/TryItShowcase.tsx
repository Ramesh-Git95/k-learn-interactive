import React, { useEffect, useRef, useState } from 'react';
import { trackCard, resetCard } from '../utils/cardTilt';

// "Try It Right Now" — the free-preview cards and the progress-ring dashboard,
// combined into one dark inset. Rings on the left (mirroring the hero demo on
// the right, up top), the three open sections stacked on the right.
//
// The rings preview the progress dashboard, which is real: five learning areas
// tracked with XP / streaks / SRS. The numbers are an illustrative sample — a
// logged-out visitor has none of their own yet — but every metric type exists.

interface TryItShowcaseProps {
  onNavigate: (section: 'vocabulary' | 'grammar' | 'culture') => void;
}

const RINGS = [
  { label: 'Hangul',     pct: 100, color: '#E4572E' },
  { label: 'Vocabulary', pct: 72,  color: '#3F8571' },
  { label: 'Phrases',    pct: 60,  color: '#D9A441' },
  { label: 'Grammar',    pct: 48,  color: '#2F5D8A' },
  { label: 'Culture',    pct: 40,  color: '#8E3B54' },
];

const CARDS: {
  section: 'vocabulary' | 'grammar' | 'culture';
  emoji: string; title: string; desc: string; meta: string; gradient: string; color: string;
}[] = [
  { section: 'vocabulary', emoji: '📖', title: 'Vocabulary', desc: '39 free words · tap any to hear it spoken.',        meta: '3 categories free', gradient: 'from-[#F07A55] to-[#E4572E]', color: '#E4572E' },
  { section: 'grammar',    emoji: '✏️', title: 'Grammar',    desc: 'Particles to verb endings, colour-coded.',           meta: '5 patterns free',   gradient: 'from-[#4E9B85] to-[#3F8571]', color: '#3F8571' },
  { section: 'culture',    emoji: '🎌', title: 'Culture',    desc: 'K-pop, K-drama, regions and daily Korean life.',     meta: '5 tips free',       gradient: 'from-[#E0B457] to-[#D9A441]', color: '#D9A441' },
];

const STATS = [
  { n: 800, suffix: '+', label: 'Words & Phrases' },
  { n: 40,  suffix: '',  label: 'Hangul Characters' },
  { n: 24,  suffix: '',  label: 'Culture Cards' },
  { n: 10,  suffix: '',  label: 'Learning Tools' },
];

const SIZE = 220;
const CENTER = SIZE / 2;
const STROKE = 12;

// Counts up when `run` turns true — driven by the same in-view trigger as the
// rings, so the numbers and the rings animate together.
const StatCounter: React.FC<{ target: number; suffix: string; run: boolean }> = ({ target, suffix, run }) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let frame = 0;
    const total = 45;
    const id = setInterval(() => {
      frame++;
      setV(Math.min(target, Math.floor((frame / total) * target)));
      if (frame >= total) { setV(target); clearInterval(id); }
    }, 1100 / total);
    return () => clearInterval(id);
  }, [run, target]);
  return <>{v.toLocaleString()}{suffix}</>;
};

export default function TryItShowcase({ onNavigate }: TryItShowcaseProps) {
  const [shown, setShown] = useState(false);
  const ringsRef = useRef<HTMLDivElement>(null);

  // Draw the rings when they reach the viewport; fill immediately under
  // reduced-motion (the percentages are content, not decoration).
  useEffect(() => {
    const el = ringsRef.current;
    if (!el) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect(); } },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="kl-reveal py-20 px-4 bg-gray-50 dark:bg-gray-900/60">
      <div className="max-w-6xl mx-auto">
        <div className="kl-tryit-card relative overflow-hidden rounded-[32px] p-8 sm:p-12 shadow-xl dark:shadow-2xl">
          {/* Soft brand glows — dimmer in light mode, where they read as a warm
              wash rather than the drama they add on the dark surface. */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full opacity-50 dark:opacity-100" style={{ background: 'radial-gradient(circle,rgba(228,87,46,.30),transparent 70%)', filter: 'blur(20px)' }} />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full opacity-50 dark:opacity-100" style={{ background: 'radial-gradient(circle,rgba(63,133,113,.28),transparent 70%)', filter: 'blur(20px)' }} />

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-2">
            {/* ── Rings — left on desktop ── */}
            <div ref={ringsRef} className="lg:order-first">
              <div className="mx-auto flex max-w-sm flex-col items-center">
                <div className="relative" style={{ width: SIZE, height: SIZE }}>
                  <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full">
                    {RINGS.map((r, i) => {
                      const radius = CENTER - STROKE / 2 - 6 - i * (STROKE + 6);
                      const circ = 2 * Math.PI * radius;
                      const offset = shown ? circ * (1 - r.pct / 100) : circ;
                      return (
                        <g key={r.label}>
                          <circle cx={CENTER} cy={CENTER} r={radius} fill="none" stroke="var(--kl-ring-track)" strokeWidth={STROKE} />
                          <circle
                            cx={CENTER} cy={CENTER} r={radius} fill="none" stroke={r.color}
                            strokeWidth={STROKE} strokeLinecap="round"
                            strokeDasharray={circ} strokeDashoffset={offset}
                            transform={`rotate(-90 ${CENTER} ${CENTER})`}
                            style={{ transition: `stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1) ${i * 130}ms`, filter: `drop-shadow(0 0 5px ${r.color}88)` }}
                          />
                        </g>
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Pretendard Variable, sans-serif' }}>한</span>
                    <span className="mt-0.5 text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-white/80">Your progress</span>
                  </div>
                </div>

                <div className="mt-6 grid w-full grid-cols-2 gap-x-6 gap-y-2 sm:px-4">
                  {RINGS.map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-white/80">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                        {r.label}
                      </span>
                      <span className="text-xs font-black tabular-nums" style={{ color: r.color }}>{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Heading + the three open sections, stacked ── */}
            <div>
              <span className="inline-block rounded-full bg-[#3F8571]/12 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#2E6B59] dark:bg-[#5CFFB1]/15 dark:text-[#5CFFB1]">
                No signup required
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-black leading-[1.1] text-gray-900 dark:text-white">
                Try It <span className="italic font-display text-[#E4572E] dark:text-[#F8996E]">Right Now</span>
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500 dark:text-white/60">
                Three full sections open to everyone — no account, no credit card.
              </p>

              <div className="mt-6 space-y-3">
                {CARDS.map(c => (
                  <button
                    key={c.section}
                    onClick={() => onNavigate(c.section)}
                    onMouseMove={trackCard}
                    onMouseLeave={resetCard}
                    className="kl-tilt flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:shadow-md dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none dark:hover:bg-white/[0.1]"
                  >
                    <span
                      className={`kl-tilt-pop flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} text-xl shadow-lg`}
                    >
                      {c.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-gray-900 dark:text-white">{c.title}</span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                          style={{ color: c.color, background: `${c.color}22` }}
                        >
                          {c.meta}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-gray-500 dark:text-white/55">{c.desc}</span>
                    </span>
                    <span className="flex-shrink-0 text-lg font-black" style={{ color: c.color }}>→</span>
                  </button>
                ))}
              </div>

              <p className="mt-4 text-[11px] text-gray-400 dark:text-white/40">
                The rings preview your dashboard — real progress, once you start.
              </p>
            </div>
          </div>

          {/* Stats strip — full width along the bottom, so the section reads as
              one complete block at hero width rather than a floating bar. */}
          <div className="relative z-10 mt-10 grid grid-cols-2 gap-6 border-t border-gray-200/70 pt-8 text-center dark:border-white/10 sm:grid-cols-4">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="kl-stat-num text-3xl sm:text-4xl font-black">
                  <StatCounter target={s.n} suffix={s.suffix} run={shown} />
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/45">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
