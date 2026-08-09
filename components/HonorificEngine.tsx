import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { accentFor } from '../utils/moduleAccent';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PeekOverlay } from './PremiumLock';
import SoundItOutModal from './SoundItOutModal';
import type { Section } from '../types';

const ACC = accentFor('honorifics');

const FREE_CATEGORY_IDS = ['greetings', 'requests'];

interface HonorificEntry {
  base: string;
  english: string;
  formal: { korean: string; romanization: string };
  polite: { korean: string; romanization: string };
  casual: { korean: string; romanization: string };
  note: string;
}

interface HonorificCategory {
  id: string;
  label: string;
  emoji: string;
  entries: HonorificEntry[];
}

const CATEGORIES: HonorificCategory[] = [
  {
    id: 'greetings',
    label: 'Greetings',
    emoji: '👋',
    entries: [
      {
        base: 'Hello',
        english: 'Hello / Hi',
        formal:  { korean: '안녕하십니까',     romanization: 'Annyeong-hashimnikka' },
        polite:  { korean: '안녕하세요',       romanization: 'Annyeong-haseyo' },
        casual:  { korean: '안녕',           romanization: 'Annyeong' },
        note: 'Formal is used in news broadcasts, official settings. Casual only with close friends or younger people.',
      },
      {
        base: 'Good morning',
        english: 'Good morning',
        formal:  { korean: '좋은 아침입니다',   romanization: 'Joeun achim-imnida' },
        polite:  { korean: '좋은 아침이에요',   romanization: 'Joeun achim-ieyo' },
        casual:  { korean: '좋은 아침',       romanization: 'Joeun achim' },
        note: 'Koreans often just say 안녕하세요 any time of day. The explicit morning greeting is less common but perfectly natural.',
      },
      {
        base: 'Welcome / Come in',
        english: 'Welcome (to a shop / home)',
        formal:  { korean: '어서 오십시오',     romanization: 'Eoseo o-sip-si-o' },
        polite:  { korean: '어서 오세요',      romanization: 'Eoseo o-seyo' },
        casual:  { korean: '어서 와',         romanization: 'Eoseo wa' },
        note: '어서 오십시오 is the classic shop greeting — you\'ll hear it everywhere in Korean stores.',
      },
      {
        base: 'Nice to meet you',
        english: 'Nice to meet you',
        formal:  { korean: '만나서 반갑습니다',  romanization: 'Mannaseo ban-gap-seum-ni-da' },
        polite:  { korean: '만나서 반가워요',   romanization: 'Mannaseo ban-ga-wo-yo' },
        casual:  { korean: '만나서 반가워',    romanization: 'Mannaseo ban-ga-wo' },
        note: 'Always use formal/polite when meeting someone for the first time, regardless of their age.',
      },
      {
        base: 'Goodbye (leaving)',
        english: 'Goodbye — said by the person leaving',
        formal:  { korean: '안녕히 계십시오',   romanization: 'Annyeonghi gye-sip-si-o' },
        polite:  { korean: '안녕히 계세요',    romanization: 'Annyeonghi gye-seyo' },
        casual:  { korean: '잘 있어',        romanization: 'Jal isseo' },
        note: 'The person leaving says this to the person staying. Korean has separate farewells for who is leaving vs. who stays.',
      },
      {
        base: 'Goodbye (staying)',
        english: 'Goodbye — said by the person staying',
        formal:  { korean: '안녕히 가십시오',   romanization: 'Annyeonghi ga-sip-si-o' },
        polite:  { korean: '안녕히 가세요',    romanization: 'Annyeonghi ga-seyo' },
        casual:  { korean: '잘 가',         romanization: 'Jal ga' },
        note: 'The person staying says this to the person leaving. One of the most culturally notable grammar points for beginners.',
      },
    ],
  },
  {
    id: 'requests',
    label: 'Requests',
    emoji: '🙏',
    entries: [
      {
        base: 'Please give me',
        english: 'Please give me / I would like',
        formal:  { korean: '주시겠습니까',     romanization: 'Ju-si-get-seum-ni-kka' },
        polite:  { korean: '주세요',          romanization: 'Ju-seyo' },
        casual:  { korean: '줘',            romanization: 'Jwo' },
        note: '주세요 is the workhorse of polite requests — ordering food, asking for the bill, requesting help in shops.',
      },
      {
        base: 'Please wait',
        english: 'Please wait a moment',
        formal:  { korean: '잠시만 기다려 주십시오', romanization: 'Jamsi-man gidaryeo ju-sip-si-o' },
        polite:  { korean: '잠깐만요',        romanization: 'Jamkkanman-yo' },
        casual:  { korean: '잠깐만',         romanization: 'Jamkkanman' },
        note: '잠깐만요 is extremely common — Koreans use it to put someone on brief hold, whether in person or on the phone.',
      },
      {
        base: 'Please do it',
        english: 'Please do / Please (imperative)',
        formal:  { korean: '해 주시겠습니까',   romanization: 'Hae ju-si-get-seum-ni-kka' },
        polite:  { korean: '해 주세요',       romanization: 'Hae ju-seyo' },
        casual:  { korean: '해 줘',         romanization: 'Hae jwo' },
        note: 'Attach this after any verb stem to make a polite request: 도와주세요 (please help), 보여주세요 (please show me).',
      },
      {
        base: 'Please speak slowly',
        english: 'Please speak more slowly',
        formal:  { korean: '천천히 말씀해 주십시오', romanization: 'Cheoncheonhi malsseum-hae ju-sip-si-o' },
        polite:  { korean: '천천히 말해 주세요',  romanization: 'Cheoncheonhi malhae ju-seyo' },
        casual:  { korean: '천천히 말해',      romanization: 'Cheoncheonhi malhae' },
        note: 'Essential for language learners! 말씀 is the honorific form of 말 (speech) — used when referring to someone else\'s words.',
      },
      {
        base: 'Please repeat',
        english: 'Please say that again',
        formal:  { korean: '다시 말씀해 주십시오', romanization: 'Dasi malsseum-hae ju-sip-si-o' },
        polite:  { korean: '다시 말해 주세요',   romanization: 'Dasi malhae ju-seyo' },
        casual:  { korean: '다시 말해',       romanization: 'Dasi malhae' },
        note: 'You can also say 뭐라고요? (polite) or 뭐? (casual) to informally ask someone to repeat.',
      },
    ],
  },
  {
    id: 'questions',
    label: 'Questions',
    emoji: '❓',
    entries: [
      {
        base: 'What is this?',
        english: 'What is this?',
        formal:  { korean: '이것이 무엇입니까',  romanization: 'I-geosi mueot-im-ni-kka' },
        polite:  { korean: '이게 뭐예요',      romanization: 'I-ge mwo-ye-yo' },
        casual:  { korean: '이게 뭐야',       romanization: 'I-ge mwo-ya' },
        note: 'In formal speech, 이것이 (this + subject marker) is used. Polite speech contracts it to 이게 naturally.',
      },
      {
        base: 'How much?',
        english: 'How much is it?',
        formal:  { korean: '얼마입니까',       romanization: 'Eolma-im-ni-kka' },
        polite:  { korean: '얼마예요',        romanization: 'Eolma-ye-yo' },
        casual:  { korean: '얼마야',         romanization: 'Eolma-ya' },
        note: 'Most essential shopping phrase. Sellers will always understand 얼마예요, even in traditional markets.',
      },
      {
        base: 'Where is it?',
        english: 'Where is [place]?',
        formal:  { korean: '어디에 있습니까',   romanization: 'Eodie it-seum-ni-kka' },
        polite:  { korean: '어디에 있어요',    romanization: 'Eodie isseoyo' },
        casual:  { korean: '어디 있어',      romanization: 'Eodie isseo' },
        note: 'Put the location before this: 화장실이 어디에 있어요? (Where is the bathroom?) — critical for travel.',
      },
      {
        base: 'Can you do it?',
        english: 'Can you do it? / Is it possible?',
        formal:  { korean: '가능합니까',       romanization: 'Ganeung-ham-ni-kka' },
        polite:  { korean: '가능해요',        romanization: 'Ganeung-haeyo' },
        casual:  { korean: '가능해',         romanization: 'Ganeung-hae' },
        note: '돼요? is an even more common polite alternative meaning "Does it work?" or "Is it okay?"',
      },
      {
        base: 'Do you understand?',
        english: 'Do you understand?',
        formal:  { korean: '이해하십니까',      romanization: 'Ihae-ha-sim-ni-kka' },
        polite:  { korean: '이해해요',        romanization: 'Ihae-haeyo' },
        casual:  { korean: '이해해',         romanization: 'Ihae-hae' },
        note: '알겠어요? (formal: 알겠습니까) — "Do you understand / Got it?" — is extremely common in work and school contexts.',
      },
      {
        base: 'What did you say?',
        english: 'What did you say? / Pardon?',
        formal:  { korean: '뭐라고 하셨습니까',  romanization: 'Mworago ha-syeot-seum-ni-kka' },
        polite:  { korean: '뭐라고요',        romanization: 'Mworago-yo' },
        casual:  { korean: '뭐라고',         romanization: 'Mworago' },
        note: 'The polite 뭐라고요 with rising intonation is perfect for everyday "pardon?" situations — not rude at all.',
      },
    ],
  },
  {
    id: 'responses',
    label: 'Responses',
    emoji: '💬',
    entries: [
      {
        base: 'Yes',
        english: 'Yes',
        formal:  { korean: '네, 그렇습니다',    romanization: 'Ne, geureot-seum-ni-da' },
        polite:  { korean: '네',            romanization: 'Ne' },
        casual:  { korean: '응 / 어',       romanization: 'Eung / Eo' },
        note: '네 is the safe polite yes. 응 and 어 are only for friends — using them with a superior is rude.',
      },
      {
        base: 'No',
        english: 'No',
        formal:  { korean: '아닙니다',        romanization: 'A-nim-ni-da' },
        polite:  { korean: '아니에요',        romanization: 'A-ni-e-yo' },
        casual:  { korean: '아니',          romanization: 'A-ni' },
        note: 'Koreans often soften "no" with 좀... (well...) first, as direct refusal can feel abrupt.',
      },
      {
        base: 'I understand',
        english: 'I understand / Got it',
        formal:  { korean: '알겠습니다',       romanization: 'Al-get-seum-ni-da' },
        polite:  { korean: '알겠어요',        romanization: 'Al-gesseoyo' },
        casual:  { korean: '알겠어',         romanization: 'Al-gesseo' },
        note: '알겠습니다 is the standard professional acknowledgment — used constantly in Korean workplaces.',
      },
      {
        base: "I don't know",
        english: "I don't know",
        formal:  { korean: '모르겠습니다',      romanization: 'Moreuget-seum-ni-da' },
        polite:  { korean: '모르겠어요',       romanization: 'Moreugeseoyo' },
        casual:  { korean: '몰라',          romanization: 'Molla' },
        note: '모르겠어요 (I\'m not sure) is softer than 몰라요 (I don\'t know) — the former implies uncertainty, the latter ignorance.',
      },
      {
        base: 'That is correct',
        english: 'That is correct / Right',
        formal:  { korean: '맞습니다',        romanization: 'Mat-seum-ni-da' },
        polite:  { korean: '맞아요',         romanization: 'Maja-yo' },
        casual:  { korean: '맞아',          romanization: 'Maja' },
        note: '맞아요! is enthusiastic agreement — the go-to response when someone gets something right.',
      },
    ],
  },
  {
    id: 'thanks',
    label: 'Thanks & Apologies',
    emoji: '🙌',
    entries: [
      {
        base: 'Thank you',
        english: 'Thank you',
        formal:  { korean: '감사합니다',       romanization: 'Gam-sa-ham-ni-da' },
        polite:  { korean: '고마워요',        romanization: 'Go-ma-wo-yo' },
        casual:  { korean: '고마워',         romanization: 'Go-ma-wo' },
        note: '감사합니다 is highly versatile — appropriate for strangers, elders, customer service, and any formal context.',
      },
      {
        base: "You're welcome",
        english: "You're welcome",
        formal:  { korean: '천만에요',        romanization: 'Cheon-mane-yo' },
        polite:  { korean: '별말씀을요',       romanization: 'Byeol-mal-sseumeul-yo' },
        casual:  { korean: '아니야',         romanization: 'A-ni-ya' },
        note: 'Koreans often respond to thanks with 아니에요 (it\'s nothing) rather than 천만에요, which can sound overly formal.',
      },
      {
        base: 'I am sorry',
        english: 'I am sorry (apology)',
        formal:  { korean: '죄송합니다',       romanization: 'Jwe-song-ham-ni-da' },
        polite:  { korean: '미안해요',        romanization: 'Mi-an-hae-yo' },
        casual:  { korean: '미안',          romanization: 'Mi-an' },
        note: '죄송합니다 expresses deep, sincere remorse — 미안해요 is for everyday apologies. Mixing them up can seem disproportionate.',
      },
      {
        base: 'Excuse me',
        english: 'Excuse me (to get attention)',
        formal:  { korean: '실례합니다',       romanization: 'Sil-lye-ham-ni-da' },
        polite:  { korean: '저기요',         romanization: 'Jeo-gi-yo' },
        casual:  { korean: '야',           romanization: 'Ya' },
        note: '저기요 is by far the most practical — it\'s how you hail a waiter, stop a passerby, or get any stranger\'s attention.',
      },
      {
        base: 'It was delicious',
        english: 'It was delicious / Thank you for the food',
        formal:  { korean: '잘 먹었습니다',     romanization: 'Jal meogeot-seum-ni-da' },
        polite:  { korean: '잘 먹었어요',      romanization: 'Jal meogeosseoyo' },
        casual:  { korean: '잘 먹었어',       romanization: 'Jal meogeosseo' },
        note: 'Said after finishing a meal to the host or cook. Highly important culturally — skipping it can seem rude.',
      },
    ],
  },
  {
    id: 'statements',
    label: 'Statements',
    emoji: '📢',
    entries: [
      {
        base: 'I like it',
        english: 'I like it',
        formal:  { korean: '좋아합니다',       romanization: 'Jo-a-ham-ni-da' },
        polite:  { korean: '좋아해요',        romanization: 'Jo-a-hae-yo' },
        casual:  { korean: '좋아해',         romanization: 'Jo-a-hae' },
        note: '좋아요 (it\'s good) and 좋아해요 (I like it) are different — 좋아요 describes quality, 좋아해요 describes preference.',
      },
      {
        base: "I don't have it",
        english: "I don't have it / There isn't any",
        formal:  { korean: '없습니다',        romanization: 'Eop-seum-ni-da' },
        polite:  { korean: '없어요',         romanization: 'Eopseo-yo' },
        casual:  { korean: '없어',          romanization: 'Eopseo' },
        note: '없어요 vs 있어요 (there is / I have) — these two words cover a huge amount of everyday Korean.',
      },
      {
        base: 'I am going',
        english: 'I am going / I will go',
        formal:  { korean: '가겠습니다',       romanization: 'Ga-get-seum-ni-da' },
        polite:  { korean: '갈게요',         romanization: 'Gal-ge-yo' },
        casual:  { korean: '갈게',          romanization: 'Gal-ge' },
        note: '갈게요 signals you\'re leaving or committing to go somewhere — -ㄹ게요 ending expresses volitional future.',
      },
      {
        base: 'I am done',
        english: 'I am finished / Done',
        formal:  { korean: '다 됐습니다',      romanization: 'Da dwaet-seum-ni-da' },
        polite:  { korean: '다 됐어요',       romanization: 'Da dwaesseoyo' },
        casual:  { korean: '다 됐어',        romanization: 'Da dwaesseo' },
        note: '다 means "all / completely" — 다 먹었어요 (finished eating), 다 했어요 (did it all). Extremely versatile word.',
      },
      {
        base: 'It is delicious',
        english: 'It is delicious / Tasty',
        formal:  { korean: '맛있습니다',       romanization: 'Mas-it-seum-ni-da' },
        polite:  { korean: '맛있어요',        romanization: 'Mas-isseoyo' },
        casual:  { korean: '맛있어',         romanization: 'Mas-isseo' },
        note: '맛있다! is the word you\'ll use most in Korea. Its opposite 맛없다 (tasteless) is used but sparingly in social settings.',
      },
      {
        base: 'I will do it',
        english: 'I will do it / I\'ll handle it',
        formal:  { korean: '하겠습니다',       romanization: 'Ha-get-seum-ni-da' },
        polite:  { korean: '할게요',         romanization: 'Hal-ge-yo' },
        casual:  { korean: '할게',          romanization: 'Hal-ge' },
        note: '하겠습니다 is the definitive professional commitment — used by employees to superiors, students to teachers.',
      },
    ],
  },
];

type Level = 'casual' | 'polite' | 'formal';

// Ordered casual → formal, so the recommended level sits in the middle of the
// scale rather than at one end of a list.
const LEVELS: { id: Level; name: string; korean: string; roman: string; when: string; recommended?: boolean }[] = [
  {
    id: 'casual', name: 'Casual', korean: '반말', roman: 'ban-mal',
    when: 'Close friends your own age. Using it too early sounds rude.',
  },
  {
    id: 'polite', name: 'Polite', korean: '해요체', roman: 'hae-yo-che', recommended: true,
    when: 'Everyone else. Safe in shops, at work, with strangers — your default.',
  },
  {
    id: 'formal', name: 'Formal', korean: '합쇼체', roman: 'hap-syo-che',
    when: 'Announcements, interviews, anyone much older. Never wrong, sometimes stiff.',
  },
];

const LEVEL_TINT: Record<Level, string> = {
  casual: '#A8761F',
  polite: '#2E6B59',
  formal: '#2F5D8A',
};

const ALL_ENTRIES = CATEGORIES.flatMap(c => c.entries);
const findEntry = (base: string) => ALL_ENTRIES.find(e => e.base === base) ?? null;

// The two examples the comparison table is built from. Looked up by name so the
// table cannot drift away from the entries below it.
const HEADLINE = [findEntry('Thank you'), findEntry('Hello')].filter(Boolean) as HonorificEntry[];

const railCard =
  'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

interface Props {
  setActiveSection?: (s: Section) => void;
}

const HonorificEngine: React.FC<Props> = ({ setActiveSection }) => {
  const { subscriptionTier } = useFeatureAccess();
  const isFree = subscriptionTier === 'free';
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [soundOut, setSoundOut] = useState<{ korean: string; romanization: string; english: string } | null>(null);

  const cat = CATEGORIES.find(c => c.id === activeCat)!;
  const isActiveLocked = isFree && !FREE_CATEGORY_IDS.includes(activeCat);

  const toggle = (key: string) => setExpanded(prev => (prev === key ? null : key));

  const say = (korean: string, romanization: string, english: string) =>
    setSoundOut({ korean, romanization, english });

  return (
    <div className="mx-auto max-w-6xl">
      {soundOut && (
        <SoundItOutModal
          korean={soundOut.korean}
          english={soundOut.english}
          romanization={soundOut.romanization}
          onClose={() => setSoundOut(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="mb-5 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <div className="mb-2 flex items-center gap-2 text-[12.5px]">
          <span className="font-medium text-[#4A5566] dark:text-gray-400">Learn</span>
          <span className="text-[#4A5566] dark:text-gray-600">/</span>
          <span className="font-semibold" style={{ color: ACC.light }}>Honorifics</span>
        </div>
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
          Three ways to say the same thing
        </h1>
        <p className="mt-2 max-w-[64ch] text-[15px] text-[#3E4A5A] dark:text-gray-400">
          As a beginner you only need the middle one. The other two are here so you recognise them
          when you hear them.
        </p>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="order-1 w-full min-w-0 flex-1">
          {/* ── The comparison, full width, with one row recommended ── */}
          <div className="kl-card overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[620px]">
                <div
                  className="grid gap-4 border-b border-[rgba(20,32,47,0.12)] px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-[#4A5566] dark:border-gray-800 dark:text-gray-500"
                  style={{ gridTemplateColumns: `170px repeat(${HEADLINE.length}, 1fr) 1.4fr` }}
                >
                  <span>Level</span>
                  {HEADLINE.map(e => <span key={e.base}>“{e.base}”</span>)}
                  <span>When to use it</span>
                </div>

                {LEVELS.map(lv => (
                  <div
                    key={lv.id}
                    className="grid items-center gap-4 border-b border-[rgba(20,32,47,0.08)] px-5 py-4 last:border-0 dark:border-gray-800"
                    style={{
                      gridTemplateColumns: `170px repeat(${HEADLINE.length}, 1fr) 1.4fr`,
                      background: lv.recommended ? `${LEVEL_TINT.polite}0F` : undefined,
                      boxShadow: lv.recommended ? `inset 3px 0 0 ${LEVEL_TINT.polite}` : undefined,
                    }}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-semibold text-[#16202F] dark:text-white">{lv.name}</span>
                        {lv.recommended && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                            style={{ background: LEVEL_TINT.polite }}
                          >
                            Start here
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[12.5px] text-[#4A5566] dark:text-gray-500">
                        <span className="font-korean">{lv.korean}</span> {lv.roman}
                      </div>
                    </div>

                    {HEADLINE.map(e => (
                      <button
                        key={e.base}
                        onClick={() => say(e[lv.id].korean, e[lv.id].romanization, `${e.english} · ${lv.name}`)}
                        className="min-w-0 text-left transition-opacity hover:opacity-70"
                        title={`Sound out ${e[lv.id].korean}`}
                      >
                        <div className="font-korean text-[17px] font-semibold text-[#16202F] dark:text-white">
                          {e[lv.id].korean}
                        </div>
                        <div className="mt-0.5 text-[12px] text-[#4A5566] dark:text-gray-500">
                          {e[lv.id].romanization.toLowerCase()}
                        </div>
                      </button>
                    ))}

                    <div className="text-[13px] leading-[1.5] text-[#3E4A5A] dark:text-gray-400">{lv.when}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 border-t border-[rgba(20,32,47,0.12)] px-5 py-4 dark:border-gray-800">
              <button
                onClick={() => setActiveSection?.('conversation')}
                className="flex h-11 items-center rounded-[10px] px-5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
              >
                Practise the polite level →
              </button>
              <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">
                On its beginner setting the tutor is told to answer in 존댓말.
              </span>
            </div>
          </div>

          {/* ── Every pair we have ── */}
          <div className="mt-7">
            <h2 className="text-[17px] font-semibold text-[#16202F] dark:text-white">
              The same three forms, for {ALL_ENTRIES.length} everyday phrases
            </h2>
            <p className="mt-1.5 max-w-[64ch] text-[13.5px] text-[#4A5566] dark:text-gray-400">
              Read the polite column and move on. The other two are worth opening only when you
              wonder why someone said it differently.
            </p>

            <div className="mt-4 mb-4 flex flex-wrap items-center gap-2">
              {CATEGORIES.map(c => {
                const lockedCat = isFree && !FREE_CATEGORY_IDS.includes(c.id);
                const isOn = activeCat === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setActiveCat(c.id); setExpanded(null); }}
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] px-3.5 text-[12.5px] font-semibold leading-none transition-colors ${
                      isOn
                        ? 'text-white'
                        : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
                    }`}
                    style={isOn ? { background: ACC.light } : undefined}
                  >
                    {c.label}
                    <span className={isOn ? 'text-white/70' : 'text-[#8A93A0] dark:text-gray-600'}>
                      {c.entries.length}
                    </span>
                    {lockedCat && <span className={isOn ? 'text-white/70' : 'text-[#8A93A0]'}>·</span>}
                    {lockedCat && (
                      <span className={`text-[10px] ${isOn ? 'text-white/80' : 'text-[#C13F22]'}`}>premium</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* When the category is locked the real entries render blurred inside a
                capped peek window with a frosted upgrade CTA. */}
            <div className={isActiveLocked ? 'relative max-h-[440px] overflow-hidden rounded-[18px]' : ''}>
              <div
                className={`flex flex-col gap-3 ${isActiveLocked ? 'pointer-events-none select-none blur-[5px]' : ''}`}
                aria-hidden={isActiveLocked || undefined}
                inert={isActiveLocked || undefined}
              >
                {cat.entries.map((entry, idx) => {
                  const key = `${activeCat}-${idx}`;
                  const isOpen = expanded === key;

                  return (
                    <div key={key} className="kl-card overflow-hidden">
                      <button
                        onClick={() => toggle(key)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[rgba(20,32,47,0.02)] dark:hover:bg-gray-800/40"
                      >
                        <div className="min-w-0">
                          <div className="text-[15px] font-semibold text-[#16202F] dark:text-white">{entry.base}</div>
                          <div className="mt-0.5 truncate text-[12.5px] text-[#4A5566] dark:text-gray-500">
                            {entry.english}
                          </div>
                        </div>
                        <div className="flex flex-none items-center gap-3">
                          {!isOpen && (
                            <div className="hidden text-right sm:block">
                              <div className="font-korean text-[16px] font-semibold text-[#16202F] dark:text-white">
                                {entry.polite.korean}
                              </div>
                              <div className="text-[11.5px]" style={{ color: LEVEL_TINT.polite }}>polite</div>
                            </div>
                          )}
                          <ChevronDown
                            className={`h-4 w-4 text-[#4A5566] transition-transform dark:text-gray-500 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-[rgba(20,32,47,0.12)] px-5 py-4 dark:border-gray-800">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {LEVELS.map(lv => (
                              <button
                                key={lv.id}
                                onClick={() => say(entry[lv.id].korean, entry[lv.id].romanization, `${entry.english} · ${lv.name}`)}
                                className="rounded-xl border px-4 py-3 text-left transition-colors"
                                style={{
                                  borderColor: lv.recommended ? `${LEVEL_TINT.polite}59` : 'rgba(20,32,47,0.14)',
                                  background: lv.recommended ? `${LEVEL_TINT.polite}0F` : undefined,
                                }}
                                title={`Sound out ${entry[lv.id].korean}`}
                              >
                                <div className="flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: LEVEL_TINT[lv.id] }}>
                                  {lv.name}
                                  <span className="font-korean font-normal text-[#4A5566] dark:text-gray-500">{lv.korean}</span>
                                </div>
                                <div className="mt-1.5 font-korean text-[17px] font-semibold text-[#16202F] dark:text-white">
                                  {entry[lv.id].korean}
                                </div>
                                <div className="mt-0.5 text-[12px] text-[#4A5566] dark:text-gray-500">
                                  {entry[lv.id].romanization.toLowerCase()}
                                </div>
                              </button>
                            ))}
                          </div>

                          <p className="kl-well mt-3 rounded-xl px-4 py-3 text-[13px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
                            {entry.note}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {isActiveLocked && (
                <PeekOverlay
                  title={`${cat.emoji} ${cat.label} — Premium`}
                  description={`All ${cat.entries.length} ${cat.label.toLowerCase()} speech-level pairs — formal, polite & casual forms with cultural notes.`}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Rail ── */}
        <div className="order-2 w-full flex-none lg:w-[290px]">
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">When in doubt</div>
            <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
              Use the polite level. Koreans do not expect a learner to switch registers, and -요 is
              never offensive.
            </p>
          </div>

          <div className={`${railCard} mb-3.5`}>
            <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
              How to tell them apart
            </div>
            <div className="flex flex-col gap-2.5 text-[13.5px] text-[#3E4A5A] dark:text-gray-400">
              {[
                ['-요', 'polite', LEVEL_TINT.polite],
                ['-니다', 'formal', LEVEL_TINT.formal],
                ['nothing on the end', 'casual', LEVEL_TINT.casual],
              ].map(([end, level, colour]) => (
                <div key={level} className="flex items-baseline gap-2">
                  <span className="font-korean font-semibold text-[#16202F] dark:text-white">{end}</span>
                  <span className="text-[#8A93A0]">→</span>
                  <span className="font-semibold" style={{ color: colour }}>{level}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-[1.5] text-[#4A5566] dark:text-gray-500">
              A rule of thumb for the endings on this page, not a law — but it will carry you a long way.
            </p>
          </div>

          <div className={railCard}>
            <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Related</div>
            <div className="flex flex-col gap-2">
              {([
                ['culture', 'Culture — where the levels come from'],
                ['grammar', 'Grammar — the endings themselves'],
                ['phrases', 'Phrases — the polite forms in use'],
              ] as [Section, string][]).map(([s, label]) => (
                <button
                  key={s}
                  onClick={() => setActiveSection?.(s)}
                  className="text-left text-[13.5px] font-medium transition-opacity hover:opacity-70"
                  style={{ color: ACC.light }}
                >
                  {label} →
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HonorificEngine;
