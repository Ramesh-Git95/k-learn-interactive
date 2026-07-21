import React from 'react';
import { trackCard, resetCard } from '../utils/cardTilt';

// "Everything You Need to Master Korean" — the platform section.
//
// From a Figma mockup, rebuilt in this project's Hanji/Dancheong palette and
// corrected against what the app actually ships.
//
// The six flagship tools are a 2-column grid of 3D tilt cards. Each preview box
// shows a colour teaser at rest — a glow in the feature's colour behind its
// glyph — and crossfades to a real mini-preview of the thing (가나다, chat
// bubbles, the honorific levels…) on hover, while the card leans toward the
// pointer and its contents lift in 3D. The reveal falls back to always-on for
// touch (see .kl-feat-* in index.css).

interface Feature {
  n: string;
  emoji: string;
  title: string;
  desc: string;
  meta: string;
  color: string;
  preview: React.ReactNode;
}

// Preview content now sits directly on the reveal surface, so it carries layout
// only — the surrounding box supplies the border and background.
const KO = { fontFamily: 'Pretendard Variable, sans-serif' };

const FLAGSHIP: Feature[] = [
  {
    n: '01', emoji: '가', title: 'Hangul Mastery',
    desc: 'Every consonant, vowel and syllable block — interactive drills with pronunciation audio.',
    meta: '19 consonants · 21 vowels · audio', color: '#E4572E',
    preview: (
      <div className="flex items-center justify-center gap-4">
        <span className="text-4xl font-black text-[#E4572E]" style={KO}>가</span>
        <span className="text-3xl font-black text-[#3F8571]" style={KO}>나</span>
        <span className="text-2xl font-black text-[#D9A441]" style={KO}>다</span>
      </div>
    ),
  },
  {
    n: '02', emoji: '📖', title: 'Vocabulary Builder',
    desc: 'Essential words across 10 everyday categories. Tap any word to hear it spoken.',
    meta: '94 words · 10 categories · audio', color: '#3F8571',
    preview: (
      <div className="w-full space-y-2 px-2">
        {[['감사합니다', 'Thank you'], ['어디예요?', 'Where is it?'], ['맛있어요', 'Delicious']].map(([ko, en]) => (
          <div key={ko} className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-bold text-gray-900 dark:text-white" style={KO}>{ko}</span>
            <span className="text-xs text-gray-400">{en}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    n: '03', emoji: '✏️', title: 'Grammar Patterns',
    desc: 'Sentence structure from particles to verb endings — colour-coded and explained visually.',
    meta: '7 patterns · particles → verb endings', color: '#D9A441',
    preview: (
      <div className="text-center">
        <span className="text-lg font-bold" style={KO}>
          <span className="text-[#2F5D8A]">저는</span>{' '}
          <span className="text-gray-900 dark:text-white">학교에</span>{' '}
          <span className="text-[#E4572E]">가요</span>
        </span>
        <div className="mt-2 text-[11px] text-gray-400">topic · place · verb</div>
      </div>
    ),
  },
  {
    n: '04', emoji: '🧠', title: 'Spaced Repetition',
    desc: 'The SM-2 algorithm schedules every card at exactly the right moment. Build decks in seconds with Quick Import.',
    meta: 'SM-2 · Quick Import · custom decks', color: '#2F5D8A',
    preview: (
      <div className="flex h-[70px] items-end justify-center gap-2">
        {[38, 55, 30, 76, 46, 22].map((h, i) => (
          <span key={i} className="w-4 rounded-t-md" style={{ height: `${h}%`, background: i === 3 ? '#2F5D8A' : 'rgba(47,93,138,.28)' }} />
        ))}
      </div>
    ),
  },
  {
    n: '05', emoji: '🤖', title: 'AI Conversation',
    desc: 'Chat with a Gemini-powered tutor that adapts to your level and corrects your Korean naturally.',
    meta: 'Gemini-powered · adaptive · 5 free chats a day', color: '#8E3B54',
    preview: (
      <div className="w-full space-y-2 px-2">
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200" style={KO}>안녕하세요! 오늘 뭐 배울까요?</div>
        <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm px-3 py-1.5 text-xs text-white" style={{ ...KO, background: '#3F8571' }}>카페 가고 싶어요</div>
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200" style={KO}>완벽해요 ✓</div>
      </div>
    ),
  },
  {
    n: '06', emoji: '🎭', title: 'Honorific Engine',
    desc: 'Master 존댓말 versus 반말 — formal, polite and casual forms side by side with cultural notes.',
    meta: '3 speech levels · 6 categories · cultural notes', color: '#B8402F',
    preview: (
      <div className="w-full space-y-1.5 px-2">
        {[['합쇼체', '안녕하십니까?', '#8E3B54'], ['해요체', '안녕하세요?', '#E4572E'], ['해체', '안녕?', '#D9A441']].map(([level, phrase, c]) => (
          <div key={level} className="flex items-baseline gap-3">
            <span className="w-11 flex-shrink-0 text-[10px] font-black" style={{ color: c }}>{level}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white" style={KO}>{phrase}</span>
          </div>
        ))}
      </div>
    ),
  },
];

const ALSO_LIVE = [
  { n: '07', emoji: '⌨️', title: 'Typing Dojo',   desc: 'Build Korean keyboard fluency in a 60-second vocabulary race.' },
  { n: '08', emoji: '📋', title: 'TOPIK Prep',    desc: 'Official TOPIK I & II practice questions with score tracking.' },
  { n: '09', emoji: '✍️', title: 'Stroke Canvas', desc: 'Watch each letter written, then draw it and get instant stroke-order feedback.' },
];

const COMING_SOON = [
  { n: '10', emoji: '🎬', title: 'K-Drama Shadowing', desc: 'Shadow native speech from real drama clips with AI pronunciation feedback.' },
];

export default function FeatureShowcase() {
  return (
    <section className="kl-reveal py-20 px-4 bg-gray-50 dark:bg-gray-900/60">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3F8571]">The Full Platform</span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-[1.08]">
            Everything You Need to{' '}
            <span className="italic font-display" style={{ color: '#3F8571' }}>Master Korean</span>
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">
            10 learning tools in one platform — 9 live now, 1 on the way.
          </p>
        </div>

        {/* Flagship six — 3D tilt cards with hover-reveal previews */}
        <div className="grid gap-5 sm:grid-cols-2">
          {FLAGSHIP.map((f, i) => (
            <div
              key={f.n}
              onMouseMove={trackCard}
              onMouseLeave={resetCard}
              className="kl-feat-card kl-tilt kl-spotlight kl-reveal group relative flex h-full flex-col rounded-3xl border bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl dark:bg-gray-900"
              style={{
                borderColor: `${f.color}2E`,
                ['--kl-spot-color' as string]: `${f.color}1F`,
                ['--kl-spot-color-dark' as string]: `${f.color}3A`,
                transitionDelay: `${i * 70}ms`,
              }}
            >
              {/* Big ghosted index number */}
              <span
                className="pointer-events-none absolute right-4 top-3 select-none text-6xl font-black tabular-nums"
                style={{ color: f.color, opacity: 0.1 }}
                aria-hidden
              >
                {f.n}
              </span>

              {/* Copy — lifts toward the viewer as the card tilts */}
              <div className="kl-tilt-pop relative z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl" style={KO}>{f.emoji}</span>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">{f.title}</h3>
                  <span className="rounded-full bg-[#3F8571]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#3F8571]">Live</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{f.desc}</p>
                <p className="mt-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500">{f.meta}</p>
              </div>

              {/* Preview box — teaser at rest, real content on hover */}
              <div className="kl-tilt-pop relative z-10 mt-auto pt-5">
                <div className="relative h-[132px] overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-950/40">
                  {/* Resting colour teaser */}
                  <div
                    className="kl-feat-rest absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                    style={{ background: `radial-gradient(circle at 50% 42%, ${f.color}24, transparent 68%)` }}
                  >
                    <span className="text-5xl" style={{ ...KO, opacity: 0.9 }}>{f.emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: f.color }}>Hover to preview →</span>
                  </div>
                  {/* Revealed content */}
                  <div className="kl-feat-reveal absolute inset-0 flex items-center justify-center p-4">
                    {f.preview}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Also included */}
        <p className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mt-12 mb-5">Also included</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {ALSO_LIVE.map((f, i) => (
            <div
              key={f.n}
              onMouseMove={trackCard}
              onMouseLeave={resetCard}
              className="kl-tilt kl-spotlight kl-reveal rounded-2xl border border-gray-300 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
              style={{
                ['--kl-spot-color' as string]: 'rgba(63,133,113,.22)',
                ['--kl-spot-color-dark' as string]: 'rgba(63,133,113,.34)',
                transitionDelay: `${i * 70}ms`,
              }}
            >
              <div className="kl-tilt-pop">
                <div className="flex items-center justify-between">
                  <span className="text-lg">{f.emoji}</span>
                  <span className="text-[10px] font-black text-gray-300 dark:text-gray-700 tabular-nums">{f.n}</span>
                </div>
                <h4 className="mt-2 text-sm font-black text-gray-900 dark:text-white">{f.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{f.desc}</p>
                <span className="mt-3 inline-block text-[10px] font-black uppercase tracking-wider text-[#3F8571]">Live</span>
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon */}
        <p className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mt-10 mb-5">Coming soon</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {COMING_SOON.map(f => (
            <div key={f.n} className="kl-reveal sm:col-start-2 rounded-2xl border border-dashed border-gray-400 dark:border-gray-600 bg-transparent p-5">
              <div className="flex items-center justify-between">
                <span className="text-lg opacity-70">{f.emoji}</span>
                <span className="text-[10px] font-black text-gray-300 dark:text-gray-700 tabular-nums">{f.n}</span>
              </div>
              <h4 className="mt-2 text-sm font-black text-gray-600 dark:text-gray-300">{f.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-gray-500">{f.desc}</p>
              <span className="mt-3 inline-block text-[10px] font-black uppercase tracking-wider text-[#D9A441]">In development</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
