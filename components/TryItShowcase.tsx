import React, { useEffect, useMemo, useRef, useState } from 'react';
import { vocabulary, grammarPatterns, cultureTips } from '../data/koreanData';
import { trackCard, resetCard } from '../utils/cardTilt';

// "Try It Right Now" — the free sections, shown rather than described.
//
// Adopted from the owner's "Live specimen" option. The point of that design is
// that the three links drive a stage showing REAL content, and the version here
// takes it at its word: every specimen below is pulled from the same arrays the
// sections themselves render, so a visitor is looking at the actual free
// content, not a mock-up of it. Change the data and this changes with it.
//
// It replaces a set of progress rings that showed invented percentages — 72%,
// 60% — belonging to nobody. Real Korean in that space is both more persuasive
// and more honest, and the profile now carries a by-module chart built from
// genuine progress.

type SectionId = 'vocabulary' | 'grammar' | 'culture';

interface TryItShowcaseProps {
  onNavigate: (section: SectionId) => void;
}

interface Specimen {
  /** Korean to display large, when the section has any. */
  korean?: string;
  romanization?: string;
  /** The English meaning or, for culture, the title of the note. */
  gloss: string;
  /** A sentence of context under it. */
  note: string;
  /** Category or provenance, printed at the foot of the stage. */
  foot: string;
  /** Shown instead of Korean where the section has no single word. */
  glyph?: string;
}

// Free vocabulary is the first three categories — the same slice
// VocabularySection uses, so the count on screen cannot drift from the product.
const FREE_CATEGORY_COUNT = 3;
const freeCategories = vocabulary.slice(0, FREE_CATEGORY_COUNT);
const freeWordCount = freeCategories.reduce((a, c) => a + c.items.length, 0);
const FREE_CULTURE_TIPS = 5;

const VOCAB_SPECIMENS: Specimen[] = freeCategories.flatMap(cat =>
  cat.items.map(i => ({
    korean: i.korean,
    romanization: i.romanization,
    gloss: i.english,
    note: i.examples?.[0]
      ? `${i.examples[0].korean} — ${i.examples[0].english}`
      : 'Tap to hear it spoken.',
    foot: `${cat.name} · free`,
  })),
);

const GRAMMAR_SPECIMENS: Specimen[] = grammarPatterns.map(p => ({
  korean: p.examples[0]?.korean,
  gloss: p.examples[0]?.english ?? p.pattern,
  note: p.explanation,
  foot: `${p.pattern} · free`,
}));

const CULTURE_SPECIMENS: Specimen[] = cultureTips.slice(0, FREE_CULTURE_TIPS).map(t => ({
  glyph: t.icon,
  gloss: t.title,
  note: t.content,
  foot: 'Culture · free',
}));

// Every count here is derived from the data above rather than typed in, so the
// pills cannot drift away from what the sections actually hand out.
const ROWS: {
  id: SectionId; n: string; title: string; emoji: string; tag: string; meta: string;
  color: string; gradient: string; specimens: Specimen[];
}[] = [
  {
    id: 'vocabulary', n: '01', title: 'Vocabulary', emoji: '📖',
    tag: `${freeWordCount} free words`,
    meta: `${FREE_CATEGORY_COUNT} categories · tap any word to hear it spoken.`,
    color: '#E4572E', gradient: 'from-[#F07A55] to-[#E4572E]', specimens: VOCAB_SPECIMENS,
  },
  {
    id: 'grammar', n: '02', title: 'Grammar', emoji: '✏️',
    tag: `all ${grammarPatterns.length} free`,
    meta: 'Particles to verb endings, colour-coded.',
    color: '#3F8571', gradient: 'from-[#4E9B85] to-[#3F8571]', specimens: GRAMMAR_SPECIMENS,
  },
  {
    id: 'culture', n: '03', title: 'Culture', emoji: '🎌',
    tag: `${FREE_CULTURE_TIPS} free tips`,
    meta: `${cultureTips.length} in total · K-pop, K-drama, regions and daily life.`,
    color: '#D9A441', gradient: 'from-[#E0B457] to-[#D9A441]', specimens: CULTURE_SPECIMENS,
  },
];

// 529 Korean items ship across every section — 94 core vocabulary, 16 phrases,
// 60 K-Drama, 111 K-Pop, 248 reading glossary. "500+" is the defensible
// rounding of that; the previous "800+" was not supportable by any count.
const STATS = [
  { n: 500, suffix: '+', label: 'Words & Phrases' },
  { n: 40,  suffix: '',  label: 'Hangul Characters' },
  { n: 24,  suffix: '',  label: 'Culture Cards' },
  // Seventeen sections route in App.tsx and all of them are live. The old "10"
  // was carried over from the platform section's copy, which was itself wrong.
  { n: 17,  suffix: '',  label: 'Learning Tools' },
];

// Counts up when `run` turns true — driven by the same in-view trigger as the
// stage, so the numbers arrive with the section.
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
  const [rowIdx, setRowIdx] = useState(0);
  const [specIdx, setSpecIdx] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const row = ROWS[rowIdx];
  const spec = row.specimens[specIdx % row.specimens.length];

  useEffect(() => {
    const el = stageRef.current;
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

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // required before every speak() in this app
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  };

  const pickRow = (i: number) => {
    setRowIdx(i);
    // Start each section somewhere different, so returning to one does not
    // always show the same specimen.
    setSpecIdx(Math.floor(Math.random() * ROWS[i].specimens.length));
  };

  const another = () => setSpecIdx(i => i + 1);

  // Keyed so a new specimen re-runs the entrance rather than swapping text.
  const stageKey = useMemo(() => `${row.id}-${specIdx}`, [row.id, specIdx]);

  return (
    <section className="kl-reveal py-20 px-4 bg-gray-50 dark:bg-gray-900/60">
      <div className="max-w-6xl mx-auto">
        <div className="kl-tryit-card relative overflow-hidden rounded-[32px] p-8 sm:p-12 shadow-xl dark:shadow-2xl">
          {/* Soft brand glows, dark mode only. On the cream page they landed
              behind the specimen card as an orange stain in the corner rather
              than the warm wash they are on ink — and the card now carries its
              own lit border, so light mode has all the colour it needs. */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full opacity-0 dark:opacity-100" style={{ background: 'radial-gradient(circle,rgba(228,87,46,.30),transparent 70%)', filter: 'blur(20px)' }} />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full opacity-0 dark:opacity-100" style={{ background: 'radial-gradient(circle,rgba(63,133,113,.28),transparent 70%)', filter: 'blur(20px)' }} />

          <div className="relative z-10 grid items-stretch gap-10 lg:grid-cols-2">
            {/* ── The stage — real content from the section you picked ── */}
            <div ref={stageRef} className="lg:order-first">
              <div
                className="kl-specimen kl-specimen-ring flex h-full min-h-[340px] flex-col rounded-[24px] p-6 sm:p-8"
                style={{ ['--kl-acc' as string]: row.color }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10.5px] font-black uppercase tracking-[0.16em]"
                    style={{ color: row.color }}
                  >
                    Specimen {row.n}
                  </span>
                  <span className="rounded-full border border-[rgba(20,32,47,0.16)] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#4A5566] dark:border-white/15 dark:text-white/70">
                    Free
                  </span>
                </div>

                <div key={stageKey} className="kl-mix-syllable mt-6 flex-1">
                  {spec.korean ? (
                    <>
                      <div
                        className="text-4xl font-black leading-tight text-[#16202F] sm:text-[42px] dark:text-white"
                        style={{ fontFamily: 'Pretendard Variable, sans-serif' }}
                      >
                        {spec.korean}
                      </div>
                      {spec.romanization && (
                        <div className="mt-2 text-sm font-semibold text-[#4A5566] dark:text-white/45">
                          {spec.romanization}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-5xl leading-none">{spec.glyph}</div>
                  )}

                  <div className="mt-3 text-lg font-black text-[#16202F] dark:text-white">{spec.gloss}</div>
                  <p className="mt-2.5 max-w-[46ch] text-[13.5px] leading-relaxed text-[#3E4A5A] dark:text-white/60">
                    {spec.note}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-[rgba(20,32,47,0.12)] pt-4 dark:border-white/10">
                  {spec.korean && (
                    <button
                      onClick={() => speak(spec.korean!)}
                      className="flex h-9 items-center gap-2 rounded-lg border border-[rgba(20,32,47,0.2)] px-3 text-[12.5px] font-bold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-white/20 dark:text-white/85 dark:hover:border-white/50"
                    >
                      🔊 Hear it
                    </button>
                  )}
                  {row.specimens.length > 1 && (
                    <button
                      onClick={another}
                      className="flex h-9 items-center rounded-lg px-3 text-[12.5px] font-bold transition-opacity hover:opacity-70"
                      style={{ color: row.color }}
                    >
                      Show another →
                    </button>
                  )}
                  <span className="ml-auto text-[11px] font-semibold uppercase tracking-wider text-[#8A93A0] dark:text-white/35">
                    {spec.foot}
                  </span>
                </div>
              </div>
            </div>

            {/* ── The three sections, as ruled rows ── */}
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl sm:text-4xl font-black leading-[1.1] text-gray-900 dark:text-white">
                  Try It <span className="italic font-display text-[#E4572E] dark:text-[#F8996E]">Right Now</span>
                </h2>
                <span className="rounded-full bg-[#3F8571]/12 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#2E6B59] dark:bg-[#5CFFB1]/15 dark:text-[#5CFFB1]">
                  No signup
                </span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500 dark:text-white/60">
                Three full sections are open to everyone. Pick one to see what is actually inside —
                this is the content itself, not a description of it.
              </p>

              <div className="mt-6 space-y-3">
                {ROWS.map((r, i) => {
                  const on = i === rowIdx;
                  return (
                    <button
                      key={r.id}
                      onClick={() => pickRow(i)}
                      onMouseMove={trackCard}
                      onMouseLeave={resetCard}
                      aria-pressed={on}
                      className="kl-tilt group flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left transition-[box-shadow,background,border-color] hover:shadow-md dark:bg-white/[0.06] dark:shadow-none dark:hover:bg-white/[0.1]"
                      style={{
                        borderColor: on ? r.color : undefined,
                        boxShadow: on ? `0 10px 26px -14px ${r.color}, inset 0 0 0 1px ${r.color}55` : undefined,
                      }}
                    >
                      {/* The tile lifts toward the viewer with the tilt, and the
                          selected one keeps a slow bob so the eye knows which
                          section the stage is currently showing. */}
                      <span
                        className={`kl-tilt-pop flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gradient-to-br text-xl shadow-lg ${r.gradient} ${on ? 'kl-bob' : 'kl-icon-turn'}`}
                      >
                        {r.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-black text-gray-900 dark:text-white">{r.title}</span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                            style={{ color: r.color, background: `${r.color}22` }}
                          >
                            {r.tag}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-gray-500 dark:text-white/55">
                          {r.meta}
                        </span>
                      </span>
                      <span
                        className="flex-none text-lg font-black transition-transform duration-200 group-hover:translate-x-1"
                        style={{ color: r.color }}
                      >
                        →
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => onNavigate(row.id)}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14.5px] font-black text-white transition-transform hover:scale-[1.01]"
                style={{ background: row.color, boxShadow: `0 8px 22px -8px ${row.color}` }}
              >
                Open {row.title} →
              </button>
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
