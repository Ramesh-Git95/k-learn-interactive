import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FREE_GRAMMAR_COUNT, TOTAL_GRAMMAR_COUNT } from '../constants';
import type { Section } from '../types';

// "Everything You Need to Master Korean" — the platform section, as a slat wall.
//
// Adopted from the owner's design: ten closed slats carrying only a numeral and
// a glyph, one opening to full width on hover. The reason that design earns its
// place here is that a closed slat costs almost nothing, so the wall can hold
// SEVENTEEN tools without becoming a wall of text. Every card-grid alternative
// falls apart past about eight.
//
// The count is the correction. This section used to claim "10 learning tools —
// 9 live, 1 on the way", and listed "K-Drama Shadowing" as in development. That
// feature is not being built, while the K-Drama section that does ship went
// unmentioned, along with Phrases, Culture, Culture Cards, Quiz, Reading, K-Pop
// and the Level Test. Seventeen tools route in App.tsx and every one is live.
//
// Each slat is labelled by the Korean word for what it teaches — 한 from 한글,
// 복 from 복습 — so the wall reads as Korean rather than as icons.
//
// Every fact line below was counted from the data, not written from memory.

interface Tool {
  n: string;
  section: Section;
  name: string;
  /** One syllable of the Korean word for this subject. */
  glyph: string;
  word: string;
  wordRom: string;
  wordMeans: string;
  /** Counted from the shipped data. */
  fact: string;
  desc: string;
  color: string;
}

const TOOLS: Tool[] = [
  { n: '01', section: 'hangul', name: 'Hangul Mastery', glyph: '한', word: '한글', wordRom: 'hangeul', wordMeans: 'the Korean alphabet',
    fact: '40 letters · audio on every one',
    desc: 'Every consonant and vowel, with the sound of each one and the words it turns up in.', color: '#E4572E' },
  { n: '02', section: 'vocabulary', name: 'Vocabulary', glyph: '단', word: '단어', wordRom: 'daneo', wordMeans: 'word',
    fact: '94 words · 10 categories',
    desc: 'Everyday words grouped by where you would use them. Tap any one to hear it spoken.', color: '#C13F22' },
  { n: '03', section: 'grammar', name: 'Grammar Patterns', glyph: '문', word: '문법', wordRom: 'munbeop', wordMeans: 'grammar',
    fact: `${TOTAL_GRAMMAR_COUNT} patterns · ${FREE_GRAMMAR_COUNT} free`,
    desc: 'Sentence structure from particles to verb endings, with the parts colour-coded.', color: '#2E6B59' },
  { n: '04', section: 'phrases', name: 'Phrases', glyph: '표', word: '표현', wordRom: 'pyohyeon', wordMeans: 'expression',
    fact: '16 phrases · by situation',
    desc: 'What to actually say in a shop, a restaurant or a first meeting — broken down word by word.', color: '#3F8571' },
  { n: '05', section: 'culture', name: 'Culture', glyph: '화', word: '문화', wordRom: 'munhwa', wordMeans: 'culture',
    fact: '12 notes · 6 regions',
    desc: 'Why age changes a verb ending, why you use two hands, and what happens where.', color: '#A8761F' },
  { n: '06', section: 'culture-cards', name: 'Culture Cards', glyph: '카', word: '카드', wordRom: 'kadeu', wordMeans: 'card',
    fact: '24 cards · flip to answer',
    desc: 'One question at a time about how Korea works, with the answer on the back.', color: '#D9A441' },
  { n: '07', section: 'quiz', name: 'Quiz', glyph: '퀴', word: '퀴즈', wordRom: 'kwijeu', wordMeans: 'quiz',
    fact: 'Built from the 94-word vocabulary',
    desc: 'Timed rounds drawn from what you have studied. Anything you miss can go straight to review.', color: '#8E3B54' },
  { n: '08', section: 'conversation', name: 'AI Conversation', glyph: '대', word: '대화', wordRom: 'daehwa', wordMeans: 'conversation',
    fact: 'Gemini · 5 free chats a day',
    desc: 'A tutor that answers in Korean at your level, remembers the thread and corrects what you write.', color: '#2F5D8A' },
  { n: '09', section: 'srs', name: 'Spaced Repetition', glyph: '복', word: '복습', wordRom: 'bokseup', wordMeans: 'review',
    fact: 'SM-2 · your own decks',
    desc: 'Every card comes back at the moment you are about to forget it, and not before.', color: '#4A7BB0' },
  { n: '10', section: 'reading', name: 'Reading', glyph: '독', word: '독해', wordRom: 'dokhae', wordMeans: 'reading',
    fact: '8 passages · glossary alongside',
    desc: 'Real passages with every defined word listed beside them, in the order you meet them.', color: '#2E6B59' },
  { n: '11', section: 'writing', name: 'Writing', glyph: '쓰', word: '쓰기', wordRom: 'sseugi', wordMeans: 'writing',
    fact: '40 letters · stroke order marked',
    desc: 'Watch a letter written, then write it yourself and have the strokes marked for shape and direction.', color: '#C13F22' },
  { n: '12', section: 'typing', name: 'Typing', glyph: '타', word: '타자', wordRom: 'taja', wordMeans: 'typing',
    fact: '두벌식, mapped in the browser',
    desc: 'Type real Korean on the standard layout with no input method installed — or race the meanings instead.', color: '#A8761F' },
  { n: '13', section: 'honorifics', name: 'Honorifics', glyph: '존', word: '존댓말', wordRom: 'jondaenmal', wordMeans: 'polite speech',
    fact: '33 phrases · 3 levels each',
    desc: 'The same thing said three ways, with one level marked as the one to start from.', color: '#8E3B54' },
  { n: '14', section: 'topik', name: 'TOPIK Prep', glyph: '시', word: '시험', wordRom: 'siheom', wordMeans: 'exam',
    fact: '36 practice questions · TOPIK I & II',
    desc: 'Exam-format vocabulary and grammar questions with the reasoning behind each answer.', color: '#2F5D8A' },
  { n: '15', section: 'topik-test', name: 'Level Test', glyph: '급', word: '급수', wordRom: 'geupsu', wordMeans: 'grade, level',
    fact: '60 questions · a different draw each time',
    desc: 'Places you across the six TOPIK levels, and remembers it so the app can skip what you know.', color: '#4A7BB0' },
  { n: '16', section: 'kdrama', name: 'K-Drama', glyph: '드', word: '드라마', wordRom: 'deurama', wordMeans: 'drama',
    fact: '5 shows · 60 words',
    desc: 'Words from shows you have seen, each in a line of dialogue, ready to save for review.', color: '#8E3B54' },
  { n: '17', section: 'kpop', name: 'K-Pop', glyph: '노', word: '노래', wordRom: 'norae', wordMeans: 'song',
    fact: '9 songs · 111 words',
    desc: 'Lyrics one line at a time, with every word tappable and the meaning underneath.', color: '#C13F22' },
];

// Nine and eight. One row of seventeen leaves each slat too narrow for a
// horizontal name, which is the only thing a visitor who cannot read Korean yet
// has to go on.
const WALL_ROWS: number[][] = [
  TOOLS.slice(0, 9).map((_, i) => i),
  TOOLS.slice(9).map((_, i) => i + 9),
];

interface Props {
  onOpen?: (section: Section) => void;
}

export default function FeatureShowcase({ onOpen }: Props) {
  // null = nothing open. Hover drives it on a pointer device; tapping a closed
  // slat opens it on touch, where hover never fires.
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="kl-reveal relative overflow-hidden py-20 px-4 bg-gray-50 dark:bg-gray-900/60">
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* ── Heading ── */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3F8571]">The platform</span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black leading-[1.08] text-gray-900 dark:text-white">
              Everything you need to{' '}
              <span className="italic font-display" style={{ color: '#3F8571' }}>master Korean</span>
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="max-w-xs text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
              Seventeen tools. Sweep the wall — each opens where it stands.
            </p>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#3F8571]/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#2E6B59] dark:bg-[#5CFFB1]/15 dark:text-[#5CFFB1]">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {TOOLS.length} live · nothing pending
            </span>
          </div>
        </div>

        {/* ── The wall ──
            Two rows on the wide layout, a stacked list below it.
            Seventeen slats in ONE row gives each about 37px, which no
            horizontal name fits at any size — that is what forced the name
            sideways and made it hard to read. Nine to a row gives about 122px,
            enough to set the name flat under its glyph. */}
        <div className="flex flex-col gap-1.5 lg:gap-2.5" onMouseLeave={() => setOpen(null)}>
          {WALL_ROWS.map((row, r) => (
            <div
              key={r}
              className="kl-row flex flex-col gap-1.5 lg:h-[252px] lg:flex-row"
              // Only the row holding the open slat squeezes; the other row is
              // left alone, names and all.
              data-busy={open !== null && row.includes(open)}
            >
              {row.map(i => {
          const t = TOOLS[i];
          const isOpen = open === i;
          return (
              <div
                key={t.section}
                onMouseEnter={() => setOpen(i)}
                data-open={isOpen}
                className="kl-slat group relative overflow-hidden rounded-xl border transition-[flex-grow,background,border-color] duration-500 ease-out"
                style={{
                  // 6 against eight closed slats leaves the open panel ~470px
                  // and the rest ~80px — glyph width, which is why their names
                  // step aside rather than truncating.
                  ['--kl-grow' as string]: isOpen ? 6 : 1,
                  // Edge and wash are derived from this in index.css, where each
                  // theme can be given its own strength.
                  ['--kl-acc' as string]: t.color,
                }}
              >
                {/* Watermark glyph, only once the panel is open */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-6 -right-3 select-none text-[90px] font-black leading-none transition-opacity duration-500 lg:text-[112px]"
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    color: t.color,
                    opacity: isOpen ? 0.09 : 0,
                  }}
                >
                  {t.glyph}
                </span>

                {/* ── The spine: numeral, glyph, name.
                    Stays put as an accordion header on narrow screens; fades out
                    on the wide wall, where the open panel covers the slat. ── */}
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className={`relative z-10 flex w-full items-center gap-3 px-3 py-3.5 text-left transition-opacity duration-300 lg:h-full lg:flex-col lg:justify-center lg:gap-3.5 lg:px-0 lg:py-5 ${
                    isOpen ? 'lg:pointer-events-none lg:opacity-0' : 'opacity-100'
                  }`}
                >
                  {/* The design leaves closed slats unlabelled, with the name
                      arriving on reveal. That reads well in a design system and
                      badly here: a visitor who cannot read Korean yet would face
                      seventeen unlabelled glyphs and have to hover each one to
                      find anything. So every slat is labelled at rest, flat and
                      full size. */}
                  <span className="font-display text-[15px] font-semibold tabular-nums text-gray-400 lg:text-[16px] dark:text-gray-500">
                    {t.n}
                  </span>
                  <span
                    className="text-[26px] font-black leading-none lg:text-[42px]"
                    style={{ fontFamily: 'Pretendard Variable, sans-serif', color: t.color }}
                  >
                    {t.glyph}
                  </span>
                  <span className="kl-slat-name overflow-hidden text-[13px] font-bold text-gray-700 lg:px-2 lg:text-center lg:text-[13.5px] lg:leading-tight lg:tracking-tight lg:text-gray-800 dark:text-gray-300 lg:dark:text-gray-200">
                    {t.name}
                  </span>
                  <span className="ml-auto text-[11px] text-gray-400 lg:hidden dark:text-gray-500">{t.wordRom}</span>
                  {/* Only on the stacked list, where nothing else says these
                      rows open. The wide wall opens on hover, so a permanent
                      chevron there would be noise. */}
                  <ChevronDown
                    aria-hidden
                    className={`h-4 w-4 flex-none text-gray-400 transition-transform duration-300 lg:hidden dark:text-gray-600 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* ── The detail.
                    In normal flow below the spine on narrow screens, so the slat
                    grows to fit it; an overlay filling the slat on the wide
                    wall. Absolutely positioning it at every width was what left
                    the text piled on top of the row on a phone. ── */}
                <div
                  className={`flex-col justify-center gap-2 px-5 pb-5 lg:absolute lg:inset-0 lg:flex lg:p-8 lg:transition-opacity lg:duration-500 ${
                    isOpen ? 'flex lg:opacity-100' : 'hidden lg:flex lg:pointer-events-none lg:opacity-0'
                  }`}
                >
                  <span className="hidden items-baseline gap-3 lg:flex">
                    <span className="font-display text-[15px] font-semibold tabular-nums" style={{ color: t.color }}>
                      {t.n}
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                      {t.fact}
                    </span>
                  </span>

                  <span className="hidden text-2xl font-black text-gray-900 sm:text-3xl lg:block dark:text-white">
                    {t.name}
                  </span>

                  {/* The Korean word the slat's glyph comes from */}
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span
                      className="text-lg font-black"
                      style={{ fontFamily: 'Pretendard Variable, sans-serif', color: t.color }}
                    >
                      {t.word}
                    </span>
                    <span className="text-[13px] text-gray-400 dark:text-gray-500">{t.wordRom}</span>
                    <span className="text-[13px] text-gray-500 dark:text-gray-400">· {t.wordMeans}</span>
                  </span>

                  <span className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400 lg:hidden dark:text-gray-500">
                    {t.fact}
                  </span>

                  <span className="mt-1 block max-w-[46ch] text-[14px] leading-relaxed text-gray-600 dark:text-gray-300">
                    {t.desc}
                  </span>

                  <button
                    onClick={() => onOpen?.(t.section)}
                    tabIndex={isOpen ? 0 : -1}
                    className="mt-3 inline-flex w-fit items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13.5px] font-black text-white transition-transform hover:scale-[1.03]"
                    style={{ background: t.color }}
                  >
                    Open {t.name} <span aria-hidden>→</span>
                  </button>
                </div>
              </div>
          );
              })}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[12.5px] text-gray-400 dark:text-gray-500">
          Every one of these is built and working today. Three are open without an account.
        </p>
      </div>
    </section>
  );
}
