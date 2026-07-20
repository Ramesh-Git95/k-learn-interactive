import React from 'react';

// "Everything You Need to Master Korean" — the platform section.
//
// From a Figma mockup, rebuilt in this project's Hanji/Dancheong palette (the
// mock's teal is mapped onto celadon) and with the copy corrected against what
// the app actually ships.
//
// The shape is the good idea in the mockup: instead of a flat grid of equal
// cards, the flagship features alternate side to side with a ghosted index
// number and a small LIVE PREVIEW of the thing itself. A learner can see what
// Hangul drilling or the honorific engine actually looks like without scrolling
// past ten identical boxes.

interface Feature {
  n: string;
  emoji: string;
  title: string;
  desc: string;
  meta: string;
  color: string;
  preview: React.ReactNode;
}

const PREVIEW_CARD =
  'rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/70 shadow-sm px-5 py-4 w-full';

const KO = { fontFamily: 'Pretendard Variable, sans-serif' };

// ── Flagship six — each with a preview built from real app content ──────────
const FLAGSHIP: Feature[] = [
  {
    n: '01',
    emoji: '가',
    title: 'Hangul Mastery',
    desc: 'Every consonant, vowel and syllable block — interactive drills with pronunciation audio.',
    meta: '19 consonants · 21 vowels · audio',
    color: '#E4572E',
    preview: (
      <div className={`${PREVIEW_CARD} flex items-center justify-center gap-4 py-6`}>
        <span className="text-4xl font-black text-[#E4572E]" style={KO}>가</span>
        <span className="text-3xl font-black text-[#3F8571]" style={KO}>나</span>
        <span className="text-2xl font-black text-[#D9A441]" style={KO}>다</span>
      </div>
    ),
  },
  {
    n: '02',
    emoji: '📖',
    title: 'Vocabulary Builder',
    desc: 'Essential words across 10 everyday categories. Tap any word to hear it spoken.',
    meta: '94 words · 10 categories · audio',
    color: '#3F8571',
    preview: (
      <div className={`${PREVIEW_CARD} space-y-2`}>
        {[
          ['감사합니다', 'Thank you'],
          ['어디예요?', 'Where is it?'],
          ['맛있어요', 'Delicious'],
        ].map(([ko, en]) => (
          <div key={ko} className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-bold text-gray-900 dark:text-white" style={KO}>{ko}</span>
            <span className="text-xs text-gray-400">{en}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    n: '03',
    emoji: '✏️',
    title: 'Grammar Patterns',
    desc: 'Sentence structure from particles to verb endings — colour-coded and explained visually.',
    meta: '7 patterns · particles → verb endings',
    color: '#D9A441',
    preview: (
      <div className={`${PREVIEW_CARD} text-center py-6`}>
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
    n: '04',
    emoji: '🧠',
    title: 'Spaced Repetition',
    desc: 'The SM-2 algorithm schedules every card at exactly the right moment. Build decks in seconds with Quick Import.',
    meta: 'SM-2 · Quick Import · custom decks',
    color: '#2F5D8A',
    preview: (
      <div className={`${PREVIEW_CARD} flex items-end justify-center gap-2 h-[92px]`}>
        {[38, 55, 30, 76, 46, 22].map((h, i) => (
          <span
            key={i}
            className="w-4 rounded-t-md transition-colors"
            style={{ height: `${h}%`, background: i === 3 ? '#2F5D8A' : 'rgba(47,93,138,.22)' }}
          />
        ))}
      </div>
    ),
  },
  {
    n: '05',
    emoji: '🤖',
    title: 'AI Conversation',
    desc: 'Chat with a Gemini-powered tutor that adapts to your level and corrects your Korean naturally.',
    meta: 'Gemini-powered · adaptive · 5 free chats a day',
    color: '#8E3B54',
    preview: (
      <div className={`${PREVIEW_CARD} space-y-2`}>
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200" style={KO}>
          안녕하세요! 오늘 뭐 배울까요?
        </div>
        <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm px-3 py-1.5 text-xs text-white" style={{ ...KO, background: '#3F8571' }}>
          카페 가고 싶어요
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200" style={KO}>
          완벽해요 ✓
        </div>
      </div>
    ),
  },
  {
    n: '06',
    emoji: '🎭',
    title: 'Honorific Engine',
    desc: 'Master 존댓말 versus 반말 — formal, polite and casual forms side by side with cultural notes.',
    meta: '3 speech levels · 6 categories · cultural notes',
    color: '#B8402F',
    preview: (
      <div className={`${PREVIEW_CARD} space-y-1.5`}>
        {[
          ['합쇼체', '안녕하십니까?', '#8E3B54'],
          ['해요체', '안녕하세요?', '#E4572E'],
          ['해체', '안녕?', '#D9A441'],
        ].map(([level, phrase, c]) => (
          <div key={level} className="flex items-baseline gap-3">
            <span className="text-[10px] font-black w-11 flex-shrink-0" style={{ color: c }}>{level}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white" style={KO}>{phrase}</span>
          </div>
        ))}
      </div>
    ),
  },
];

// ── The rest, kept compact ─────────────────────────────────────────────────
const ALSO_LIVE = [
  { n: '07', emoji: '⌨️', title: 'Typing Dojo',   desc: 'Build Korean keyboard fluency in a 60-second vocabulary race.' },
  { n: '08', emoji: '📋', title: 'TOPIK Prep',    desc: 'Official TOPIK I & II practice questions with score tracking.' },
  { n: '09', emoji: '✍️', title: 'Stroke Canvas', desc: 'Watch each letter written, then draw it and get instant stroke-order feedback.' },
];

const COMING_SOON = [
  { n: '10', emoji: '🎬', title: 'K-Drama Shadowing', desc: 'Shadow native speech from real drama clips with AI pronunciation feedback.' },
];

/** Moves the spotlight to follow the pointer. Cheap: two custom properties. */
const trackSpotlight = (e: React.MouseEvent<HTMLElement>) => {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--kl-spot-x', `${e.clientX - rect.left}px`);
  el.style.setProperty('--kl-spot-y', `${e.clientY - rect.top}px`);
};

const tint = (hex: string, alpha: string) => `${hex}${alpha}`;

export default function FeatureShowcase() {
  return (
    <section className="kl-reveal py-20 px-4 bg-gray-50 dark:bg-gray-900/60">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-14">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3F8571]">
            The Full Platform
          </span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-[1.08]">
            Everything You Need to{' '}
            {/* The mock set this in an italic serif. Rather than load a fourth
                typeface, the emphasis comes from the existing display face in
                italic celadon — same two-tone idea, no extra font request. */}
            <span className="italic font-display" style={{ color: '#3F8571' }}>Master Korean</span>
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">
            10 learning tools in one platform — 9 live now, 1 on the way.
          </p>
        </div>

        {/* Flagship features, alternating.
            Each row carries kl-reveal, so useScrollReveal() on the landing page
            picks them up individually and they arrive one after another as you
            scroll rather than the whole block appearing at once. The small
            stagger only matters when several rows are already on screen — a tall
            viewport, or a fast scroll — where without it they would all fire
            together. */}
        <div className="border-t border-gray-300 dark:border-gray-700">
          {FLAGSHIP.map((f, i) => {
            const flip = i % 2 === 1; // even rows lead with the number, odd with the copy
            return (
              <div
                key={f.n}
                onMouseMove={trackSpotlight}
                className="kl-spotlight kl-reveal border-b border-gray-300 dark:border-gray-700 py-9 rounded-2xl"
                style={{
                  ['--kl-spot-color' as string]: tint(f.color, '2E'),
                  ['--kl-spot-color-dark' as string]: tint(f.color, '45'),
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                <div className={`relative z-10 flex flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:gap-8 ${flip ? 'md:flex-row-reverse' : ''}`}>
                  {/* Ghosted index */}
                  <span
                    className="hidden md:block flex-none text-[64px] leading-none font-black select-none tabular-nums"
                    style={{ color: f.color, opacity: 0.13 }}
                    aria-hidden
                  >
                    {f.n}
                  </span>

                  {/* Copy */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl" style={KO}>{f.emoji}</span>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{f.title}</h3>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-[#3F8571] bg-[#3F8571]/10">
                        Live
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300 max-w-md">
                      {f.desc}
                    </p>
                    <p className="mt-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500">{f.meta}</p>
                  </div>

                  {/* Live preview */}
                  <div className="w-full md:w-[266px] flex-none">{f.preview}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Also included */}
        <p className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mt-12 mb-5">
          Also included
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {ALSO_LIVE.map((f, i) => (
            <div
              key={f.n}
              onMouseMove={trackSpotlight}
              className="kl-spotlight kl-reveal rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-5"
              style={{
                ['--kl-spot-color' as string]: 'rgba(63,133,113,.22)',
                ['--kl-spot-color-dark' as string]: 'rgba(63,133,113,.34)',
                transitionDelay: `${i * 80}ms`,
              }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-lg">{f.emoji}</span>
                  <span className="text-[10px] font-black text-gray-300 dark:text-gray-700 tabular-nums">{f.n}</span>
                </div>
                <h4 className="mt-2 text-sm font-black text-gray-900 dark:text-white">{f.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{f.desc}</p>
                <span className="mt-3 inline-block text-[10px] font-black uppercase tracking-wider text-[#3F8571]">
                  Live
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon */}
        <p className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mt-10 mb-5">
          Coming soon
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {COMING_SOON.map(f => (
            <div
              key={f.n}
              className="kl-reveal sm:col-start-2 rounded-2xl border border-dashed border-gray-400 dark:border-gray-600 bg-transparent p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg opacity-70">{f.emoji}</span>
                <span className="text-[10px] font-black text-gray-300 dark:text-gray-700 tabular-nums">{f.n}</span>
              </div>
              <h4 className="mt-2 text-sm font-black text-gray-600 dark:text-gray-300">{f.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-gray-500">{f.desc}</p>
              <span className="mt-3 inline-block text-[10px] font-black uppercase tracking-wider text-[#D9A441]">
                In development
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
