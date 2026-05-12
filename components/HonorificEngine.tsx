import React, { useState } from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PremiumLockBanner } from './PremiumLock';

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

const speak = (text: string) => {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
};

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

const LEVEL_COLORS = {
  formal: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700',
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    label: '합쇼체',
    sublabel: 'Formal',
    dot: 'bg-blue-500',
  },
  polite: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-700',
    badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    label: '해요체',
    sublabel: 'Polite',
    dot: 'bg-violet-500',
  },
  casual: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-700',
    badge: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
    label: '반말',
    sublabel: 'Casual',
    dot: 'bg-pink-500',
  },
};

const SpeakBtn: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <button
    onClick={() => speak(text)}
    className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 ${color}`}
    title="Listen"
    aria-label="Listen to pronunciation"
  >
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
    </svg>
  </button>
);

const HonorificEngine: React.FC = () => {
  const { subscriptionTier } = useFeatureAccess();
  const isFree = subscriptionTier === 'free';
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [expanded, setExpanded] = useState<string | null>(null);

  const cat = CATEGORIES.find(c => c.id === activeCat)!;
  const isActiveLocked = isFree && !FREE_CATEGORY_IDS.includes(activeCat);

  const toggle = (key: string) => setExpanded(prev => prev === key ? null : key);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Hero */}
      <div
        className="rounded-2xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 60%, #EC4899 100%)' }}
      >
        {['존댓말', '반말', '경어', '합쇼체', '해요체'].map((w, i) => (
          <span
            key={i}
            className="absolute text-white/10 font-black select-none pointer-events-none"
            style={{ fontSize: `${1.5 + (i % 3) * 0.5}rem`, top: `${(i * 37) % 85}%`, left: `${(i * 53) % 90}%` }}
          >
            {w}
          </span>
        ))}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🎭</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">Honorific Engine</h1>
              <p className="text-white/80 text-sm">존댓말 · 반말 · 경어</p>
            </div>
          </div>
          <p className="text-white/85 text-sm sm:text-base max-w-lg">
            Korean has three distinct speech levels. Master all three to communicate naturally in any situation — from job interviews to text messages with friends.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(LEVEL_COLORS).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                <span className="text-xs font-bold">{v.sublabel} — {v.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(c => {
          const locked = isFree && !FREE_CATEGORY_IDS.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => { setActiveCat(c.id); setExpanded(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 ${
                activeCat === c.id
                  ? 'text-white shadow-md'
                  : locked
                  ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-600'
              }`}
              style={activeCat === c.id ? { background: locked ? 'linear-gradient(135deg, #9CA3AF, #6B7280)' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)' } : {}}
            >
              {c.emoji} {c.label}
              {locked && <span className="text-[9px]">⭐</span>}
            </button>
          );
        })}
      </div>

      {/* Locked category gate */}
      {isActiveLocked && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
          <PremiumLockBanner
            title={`${cat.emoji} ${cat.label} — Premium`}
            description={`Unlock all ${cat.entries.length} ${cat.label.toLowerCase()} speech level pairs with Premium. ${cat.entries[0]?.base ? `Includes "${cat.entries[0].base}" and more.` : ''}`}
          />
        </div>
      )}

      {/* Entries */}
      <div className={`space-y-3 ${isActiveLocked ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : ''}`}>
        {cat.entries.map((entry, idx) => {
          const key = `${activeCat}-${idx}`;
          const isOpen = expanded === key;

          return (
            <div key={key} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              {/* Header row — always visible */}
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => toggle(key)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg font-black text-gray-900 dark:text-white truncate">{entry.base}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 truncate hidden sm:block">{entry.english}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">{isOpen ? 'less' : 'see all forms'}</span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Three-column speech level cards */}
              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 pb-4 ${isOpen ? 'block' : 'hidden'}`}>
                {(['formal', 'polite', 'casual'] as const).map(level => {
                  const form = entry[level];
                  const col = LEVEL_COLORS[level];
                  return (
                    <div key={level} className={`${col.bg} border ${col.border} rounded-xl p-3`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${col.badge}`}>
                          {col.sublabel} · {col.label}
                        </span>
                        <SpeakBtn text={form.korean} color={col.badge} />
                      </div>
                      <p className="text-base font-black text-gray-900 dark:text-white mb-0.5">{form.korean}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{form.romanization}</p>
                    </div>
                  );
                })}

                {/* Cultural note */}
                <div className="sm:col-span-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex gap-3">
                  <span className="text-base flex-shrink-0 mt-0.5">💡</span>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{entry.note}</p>
                </div>
              </div>

              {/* Collapsed preview — show polite form only */}
              {!isOpen && (
                <div className="flex items-center gap-3 px-5 pb-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS.polite.badge}`}>
                    Polite · 해요체
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{entry.polite.korean}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{entry.polite.romanization}</span>
                  <SpeakBtn text={entry.polite.korean} color={LEVEL_COLORS.polite.badge} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer tip */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
        <h3 className="font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span>📖</span> When to use each level
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
            <span><strong className="text-blue-700 dark:text-blue-300">Formal (합쇼체)</strong> — Military, news broadcasts, formal speeches, strict corporate settings.</span>
          </div>
          <div className="flex gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1" />
            <span><strong className="text-violet-700 dark:text-violet-300">Polite (해요체)</strong> — Everyday default for strangers, elders, workplaces, shops, and service interactions.</span>
          </div>
          <div className="flex gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-1" />
            <span><strong className="text-pink-700 dark:text-pink-300">Casual (반말)</strong> — Close friends, romantic partners, children, and peers who mutually agree to drop formality.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HonorificEngine;
