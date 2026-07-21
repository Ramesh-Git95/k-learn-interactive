import React, { useEffect, useRef, useState } from 'react';

// "Zero to Conversational" as an actual journey.
//
// A path connects three milestones from 가 (a single letter — zero) to 🗣️ 회화
// (conversation). When the section scrolls into view the connecting line draws
// itself and the milestone nodes light up one after another in their stage
// colour — the same stroke-draw idea behind the Hangul animations and the
// progress rings. Horizontal on desktop, a vertical spine on mobile.
//
// Pure CSS transforms; the draw is gated behind motion-safe so reduced-motion
// users get the finished path with no animation. Stays light in light mode.

interface Stage {
  n: string;
  emoji: string;
  title: string;
  desc: string;
  color: string;
}

const STAGES: Stage[] = [
  { n: '01', emoji: '🧱', title: 'Build the Foundation', desc: 'Start with Hangul in 30 minutes, then unlock vocabulary, grammar and culture at your own pace.', color: '#E4572E' },
  { n: '02', emoji: '💬', title: 'Practice for Real',    desc: 'Chat with the AI tutor, race in Typing Dojo, study honorifics and prep for TOPIK — all in one tab.', color: '#3F8571' },
  { n: '03', emoji: '🧠', title: 'Never Forget',         desc: 'The SM-2 spaced-repetition engine reviews every card at exactly the right moment. Knowledge sticks.', color: '#2F5D8A' },
];

// When each node lights, timed to roughly when the drawing line reaches it.
const NODE_DELAY = [220, 620, 1020];
const DEST_DELAY = 1280;

const LINE_GRADIENT_H = 'linear-gradient(90deg,#E4572E,#3F8571 52%,#2F5D8A)';
const LINE_GRADIENT_V = 'linear-gradient(180deg,#E4572E,#3F8571 52%,#2F5D8A)';

function StageCard({ s }: { s: Stage }) {
  return (
    <div className="card-hover relative h-full overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}00)` }} />
      <span className="pointer-events-none absolute right-4 top-2 select-none text-5xl font-black tabular-nums" style={{ color: s.color, opacity: 0.12 }} aria-hidden>{s.n}</span>
      <div className="relative z-10 flex items-center gap-2">
        <span className="text-xl">{s.emoji}</span>
        <h3 className="text-lg font-black text-gray-900 dark:text-white">{s.title}</h3>
      </div>
      <p className="relative z-10 mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{s.desc}</p>
    </div>
  );
}

function Node({ s, lit, delay, size }: { s: Stage; lit: boolean; delay: number; size: string }) {
  return (
    <div
      className={`relative z-10 flex ${size} flex-none items-center justify-center rounded-full border-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950 motion-safe:transition-all motion-safe:duration-500`}
      style={{
        transitionDelay: `${delay}ms`,
        ...(lit
          ? { borderColor: s.color, boxShadow: `0 0 0 6px ${s.color}1F, 0 8px 22px -6px ${s.color}80`, transform: 'scale(1.06)' }
          : {}),
      }}
    >
      <span className="text-base font-black tabular-nums motion-safe:transition-colors" style={{ color: lit ? s.color : '#9ca3af', transitionDelay: `${delay}ms` }}>{s.n}</span>
    </div>
  );
}

export default function JourneyPath() {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') { setStarted(true); return; }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {/* ── Desktop: horizontal path ── */}
      <div className="hidden md:block">
        {/* Origin / destination labels frame the line ends */}
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="flex items-center gap-2 text-sm font-bold text-gray-400 dark:text-gray-500">
            <span className="text-xl font-black" style={{ fontFamily: 'Pretendard Variable, sans-serif' }}>가</span>
            Start from zero
          </span>
          <span
            className="flex items-center gap-2 text-sm font-black motion-safe:transition-colors motion-safe:duration-500"
            style={{ transitionDelay: `${DEST_DELAY}ms`, color: started ? '#3F8571' : '#9ca3af' }}
          >
            🗣️ 회화 · Conversational
          </span>
        </div>

        {/* Rail: track + drawing fill + three nodes */}
        <div className="relative h-14">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div
            className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full motion-safe:transition-[width] motion-safe:duration-[1300ms] motion-safe:ease-out"
            style={{ width: started ? '100%' : '0%', background: LINE_GRADIENT_H }}
          />
          <div className="relative grid h-full grid-cols-3">
            {STAGES.map((s, i) => (
              <div key={s.n} className="flex items-center justify-center">
                <Node s={s} lit={started} delay={NODE_DELAY[i]} size="h-14 w-14" />
              </div>
            ))}
          </div>
        </div>

        {/* Cards, aligned under the nodes */}
        <div className="mt-8 grid grid-cols-3 gap-6">
          {STAGES.map(s => <StageCard key={s.n} s={s} />)}
        </div>
      </div>

      {/* ── Mobile: vertical spine ── */}
      <div className="md:hidden">
        <div className="relative">
          {/* spine track + drawing fill (scaleY from the top) */}
          <div className="absolute bottom-0 left-[17px] top-1 w-0.5 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div
            className="absolute left-[17px] top-1 w-0.5 origin-top rounded-full motion-safe:transition-transform motion-safe:duration-[1300ms] motion-safe:ease-out"
            style={{ bottom: 0, transform: started ? 'scaleY(1)' : 'scaleY(0)', background: LINE_GRADIENT_V }}
          />
          {STAGES.map((s, i) => (
            <div key={s.n} className="relative flex gap-4 pb-6">
              <Node s={s} lit={started} delay={NODE_DELAY[i]} size="h-9 w-9" />
              <div className="flex-1"><StageCard s={s} /></div>
            </div>
          ))}
          {/* destination */}
          <div className="relative flex items-center gap-4">
            <div
              className="z-10 flex h-9 w-9 flex-none items-center justify-center rounded-full border-2 border-gray-200 bg-white text-base dark:border-gray-700 dark:bg-gray-950 motion-safe:transition-all motion-safe:duration-500"
              style={{ transitionDelay: `${DEST_DELAY}ms`, ...(started ? { borderColor: '#3F8571', boxShadow: '0 0 0 6px #3F857120' } : {}) }}
            >
              🗣️
            </div>
            <span className="text-sm font-black motion-safe:transition-colors" style={{ transitionDelay: `${DEST_DELAY}ms`, color: started ? '#3F8571' : '#9ca3af' }}>
              회화 · Conversational!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
