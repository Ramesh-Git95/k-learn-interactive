import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { X, Lock } from 'lucide-react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

import { useUpgradeModal } from '../contexts/UpgradeModalContext';
import type { Section } from '../types';
import { accentFor } from '../utils/moduleAccent';

const FREE_CATEGORY = 'Social';

interface CultureCard {
  id: string;
  korean: string;
  romanization: string;
  english: string;
  category: string;
  emoji: string;
  summary: string;
  explanation: string;
  examples: string[];
  tip: string;
}

const CARDS: CultureCard[] = [
  // --- Social Concepts ---
  {
    id: 'nunchi', korean: '눈치', romanization: 'Nunchi', english: 'Social Awareness',
    category: 'Social', emoji: '👁️',
    summary: 'The subtle art of reading the room and responding accordingly.',
    explanation: '눈치 literally means "eye measure" — your ability to gauge others\' moods, feelings, and the unspoken atmosphere of a situation. Koreans highly value 눈치 and consider it a form of emotional intelligence. Someone with good 눈치 (눈치가 빠르다) adjusts their behavior before being asked.',
    examples: ['Knowing to leave a gathering without being told', 'Sensing your boss is busy before asking questions', 'Realizing a friend is upset even before they say so'],
    tip: 'The worst social sin is to be 눈치가 없다 (눈치-less) — someone who misreads situations and acts inappropriately.',
  },
  {
    id: 'jeong', korean: '정', romanization: 'Jeong', english: 'Deep Emotional Bond',
    category: 'Social', emoji: '❤️',
    summary: 'An untranslatable feeling of deep attachment that builds over shared time.',
    explanation: '정 is the strong emotional bond that forms between people (and even objects or places) through shared time and experience. It\'s deeper than friendship and more complex than love. You can develop 정 with a neighborhood, a long-time colleague, or even a difficult person — because 정 can form even with someone you dislike (미운 정).',
    examples: ['Feeling sad to leave a place you\'ve lived for years', 'Staying in touch with an old colleague for decades', 'Missing your hometown even if you had a hard life there'],
    tip: '정 든 사람 (a person you have 정 with) is one of life\'s most valuable things to Koreans.',
  },
  {
    id: 'han', korean: '한', romanization: 'Han', english: 'Collective Sorrow / Yearning',
    category: 'Social', emoji: '😢',
    summary: 'A uniquely Korean feeling of deep sorrow, grief, and longing mixed with quiet resilience.',
    explanation: '한 is often described as untranslatable — it\'s a combination of sorrow, grief, resentment, and a bittersweet longing born from historical suffering and personal hardship. It is not simple sadness; it carries a sense of resignation mixed with the will to endure. 한 appears throughout Korean music, art, and literature.',
    examples: ['The mournful quality of traditional pansori music', 'Songs about longing for a faraway hometown', 'Perseverance through colonial history or family separation'],
    tip: '한 is not something Koreans necessarily dwell on — it is more of a cultural undercurrent that shapes artistic expression.',
  },
  {
    id: 'chemyeon', korean: '체면', romanization: 'Chemyeon', english: 'Social Face / Dignity',
    category: 'Social', emoji: '🎭',
    summary: 'Saving face — protecting one\'s social reputation and dignity in front of others.',
    explanation: '체면 is the concept of social face — maintaining one\'s dignity and reputation in front of others. Preserving 체면 (체면을 세우다) and avoiding loss of face (체면을 잃다) drives many social behaviors in Korea. It explains why criticism is often indirect, why Koreans dress well in public, and why personal failures are rarely discussed openly.',
    examples: ['Paying for the entire group\'s meal even when you can\'t afford it', 'Not admitting when you don\'t know something', 'Dressing well when visiting relatives'],
    tip: 'Understanding 체면 explains why Koreans rarely say "no" directly — a refusal is often phrased as a concern to protect the other person\'s 체면.',
  },
  {
    id: 'ppalli', korean: '빨리빨리', romanization: 'Ppalli-ppalli', english: 'Hurry-hurry Culture',
    category: 'Social', emoji: '⚡',
    summary: 'Korea\'s famous urgency culture — the drive to do things fast, right now.',
    explanation: '빨리빨리 (hurry-hurry) is both a cultural attitude and a national identity. Korea\'s rapid economic development, fast internet speeds, same-day delivery, and instant response expectations all stem from this cultural DNA. While efficient, it can also create stress and impatience.',
    examples: ['Elevators with rapid door-close buttons pressed instantly', '빨리 와! (Come quickly!) as a common phrase', 'Same-day food delivery as a baseline expectation'],
    tip: 'Korea has the fastest average internet speed in the world — not a coincidence given the 빨리빨리 spirit.',
  },
  {
    id: 'nunchi-bap', korean: '눈치밥', romanization: 'Nunchi-bap', english: 'Obligatory Meal',
    category: 'Social', emoji: '🍚',
    summary: 'Rice you eat because social awareness tells you to stay, even if you\'re not hungry.',
    explanation: '눈치밥 (눈치 + 밥=rice/meal) describes the socially obligated eating that happens when you sense you should stay for a meal even if uninvited. The host hints they\'re preparing food, 눈치 tells you to stay, and you eat 눈치밥. It\'s a humorous and affectionate concept that shows how embedded social reading is in Korean dining culture.',
    examples: ['Staying for dinner when visiting relatives unannounced', 'Lingering at a friend\'s home when they start cooking', 'Sensing you\'re expected at a team meal'],
    tip: 'Koreans often joke about eating 눈치밥 — it\'s said with a knowing smile rather than resentment.',
  },

  // --- Food & Dining ---
  {
    id: 'meokbang', korean: '먹방', romanization: 'Meokbang', english: 'Eating Broadcast',
    category: 'Food', emoji: '🎥',
    summary: 'Live-streamed or recorded videos of people eating large amounts of food.',
    explanation: '먹방 (먹다=eat + 방송=broadcast) is a global cultural export from Korea. Viewers watch hosts eat enormous portions of food — often for companionship during solo meals or for vicarious satisfaction. The trend went viral internationally and spawned the English word "mukbang".',
    examples: ['YouTubers eating multiple Korean BBQ sets', 'Watching someone eat ramen at midnight', 'ASMR-style eating sounds as background comfort'],
    tip: '혼밥 (eating alone) culture drove 먹방 — people wanted the feeling of eating with company even at home alone.',
  },
  {
    id: 'hoesik', korean: '회식', romanization: 'Hoesik', english: 'Team Dining',
    category: 'Food', emoji: '🍻',
    summary: 'Mandatory team meals and drinking sessions that are central to Korean work culture.',
    explanation: '회식 is a company or team outing for food and drinks — officially optional, practically expected. It\'s a major social bonding mechanism in Korean workplaces. Multiple rounds (차) are common: 1차 (first round) = dinner, 2차 (second round) = bar, 3차 (third round) = noraebang (karaoke). Skipping without reason can damage relationships.',
    examples: ['After a big project wraps, the whole team goes to 회식', '2차에서 노래방 갑시다! (Let\'s go to karaoke for round two!)', 'A new employee bonding with senior staff over samgyeopsal'],
    tip: '회식 culture is evolving — younger Koreans increasingly push back on mandatory attendance, especially post-pandemic.',
  },
  {
    id: 'sikhye', korean: '식혜', romanization: 'Sikhye', english: 'Sweet Rice Drink',
    category: 'Food', emoji: '🥛',
    summary: 'A traditional fermented sweet rice drink served cold — Korea\'s original soft drink.',
    explanation: '식혜 is a traditional Korean sweet rice drink made by fermenting malted barley and cooked rice. It has a mild, sweet flavor with floating rice grains. It\'s served at traditional ceremonies, holidays, and is a popular comfort drink. It represents the depth of Korean food heritage often overlooked by foreigners focused on Korean BBQ.',
    examples: ['Served at Chuseok (harvest festival) gatherings', 'Found in convenience stores alongside modern drinks', 'Paired with spicy food as a palate cleanser'],
    tip: 'When offered 식혜 at a Korean home or ceremony, accepting it shows respect for tradition.',
  },

  // --- Language & Communication ---
  {
    id: 'konglish', korean: '콩글리시', romanization: 'Konglish', english: 'Korean-English Mix',
    category: 'Language', emoji: '🗣️',
    summary: 'English loanwords adapted into Korean pronunciation and usage — often different from original English.',
    explanation: '콩글리시 (Korean + English) refers to English-origin words used in Korean that have shifted in meaning, pronunciation, or usage. These are not mistakes — they are fully integrated Korean words. Learning them is essential for daily Korean life.',
    examples: ['아이쇼핑 (eye-shopping) = window shopping', '핸드폰 (hand-phone) = mobile phone', '서비스 (service) = something given free of charge at a restaurant', '커닝 (cunning) = cheating on a test'],
    tip: 'About 5-10% of everyday Korean vocabulary is Konglish. Don\'t assume an English word will be understood in English — it may be used very differently.',
  },
  {
    id: 'banmal-switch', korean: '반말 전환', romanization: 'Banmal Switch', english: 'Dropping Formality',
    category: 'Language', emoji: '🔓',
    summary: 'The socially significant moment when two people agree to speak casually to each other.',
    explanation: 'When two Koreans first meet, they always use polite speech (해요체). As friendship deepens, one person may ask 말 놓을까요? ("Shall we drop formality?") or simply start speaking casually, signaling a new level of closeness. This switch is a social milestone — it means you\'re now considered close friends.',
    examples: ['"우리 말 놓자" (Let\'s speak casually)', 'Noticing a colleague suddenly using 야 instead of 씨', 'A senior student inviting a junior to use 반말 after weeks of polite speech'],
    tip: 'Never switch to 반말 unilaterally unless you\'re clearly much older or it\'s explicitly invited. It can deeply offend.',
  },
  {
    id: 'ppayeo', korean: '빠여', romanization: 'Ppayeo', english: 'Fan of a Star',
    category: 'Language', emoji: '⭐',
    summary: 'The Korean fan culture word derived from "빠순이/빠돌이" — devoted K-pop stan culture.',
    explanation: 'Korean fan culture (팬덤 / fandom) is one of the world\'s most organized and passionate. Terms like 빠순이 (female superfan), 빠돌이 (male superfan), 덕후 (otaku-style superfan), and 최애 (one\'s favorite) form a rich vocabulary around fandom. K-pop fandoms have their own chant books, light sticks, official fan clubs, and organized voting strategies.',
    examples: ['방탄소년단 아미 (BTS ARMY) organized streaming campaigns', '최애가 누구야? (Who is your fave?)', '덕질 (stanning / fan activity) as a legitimate hobby'],
    tip: '덕질하다 means "to engage in fan activities" — it\'s used without shame in modern Korean. Being a 덕후 is a badge of honor.',
  },
  {
    id: 'eotteoke', korean: '어떡해', romanization: 'Eotteoke', english: 'What do I do?!',
    category: 'Language', emoji: '😱',
    summary: 'The quintessential Korean expression of distress, panic, or helplessness.',
    explanation: '어떡해 (contracted from 어떻게 해, "what am I to do") is used in moments of surprise, mild panic, or dramatic distress. Koreans use it far more casually than English speakers would use "what do I do!" — it\'s a reflexive emotional reaction used for everything from drama to mild inconvenience.',
    examples: ['"어떡해, 핸드폰을 잃어버렸어!" (Oh no, I lost my phone!)', 'A character in a K-drama covering their mouth and saying 어떡해', 'Reacting to unexpected good news with the same expression'],
    tip: 'In K-dramas, 어떡해 is often the most-heard non-greeting expression. Understanding it unlocks huge amounts of drama dialogue.',
  },

  // --- Society & Values ---
  {
    id: 'gapjil', korean: '갑질', romanization: 'Gapjil', english: 'Power Abuse',
    category: 'Society', emoji: '⚖️',
    summary: 'The abuse of power by those in superior social or business positions.',
    explanation: '갑 (the "A" party in contracts) and 을 (the "B"/subordinate party) create a power hierarchy. 갑질 is when the powerful 갑 abuses or mistreats the 을. Notorious examples include executives berating employees, landlords exploiting tenants, or customers verbally abusing service staff. It is widely condemned but culturally rooted in hierarchical norms.',
    examples: ['An airline executive\'s "nut rage" incident (2014)', 'Customers yelling at delivery workers', 'Employers demanding personal tasks from employees'],
    tip: 'Korea has passed 갑질 prevention laws — the term is now common in legal and media contexts as societal attitudes shift.',
  },
  {
    id: 'sohwakhaeng', korean: '소확행', romanization: 'Sohwakhaeng', english: 'Small but certain happiness',
    category: 'Society', emoji: '☕',
    summary: 'Finding joy in small, reliable everyday pleasures rather than grand achievements.',
    explanation: '소확행 (소소하지만 확실한 행복 — small but certain happiness) is a philosophy and lifestyle trend. In contrast to 빨리빨리 achievement culture, 소확행 is about intentionally savoring small pleasures: a good cup of coffee, a freshly laundered blanket, a walk in autumn leaves. It parallels the Danish hygge concept.',
    examples: ['A warm 붕어빵 (fish-shaped bread) on a cold winter walk', 'Reading a book in a quiet café', 'The first sip of an iced Americano on a hot day'],
    tip: '소확행 reflects a generational shift among Millennials and Gen Z in Korea away from traditional success metrics.',
  },
  {
    id: 'inhwa', korean: '인화', romanization: 'Inhwa', english: 'Harmony Among People',
    category: 'Society', emoji: '🤝',
    summary: 'The Confucian value of maintaining social harmony and group cohesion.',
    explanation: '인화 (人和) literally means "human harmony." Rooted in Confucian values, it emphasizes group cohesion, avoiding conflict, and maintaining smooth relationships. Korean workplaces and social groups often prize 인화 above individual expression — rocking the boat, even for good reason, is frowned upon.',
    examples: ['Reaching consensus in meetings rather than voting', 'Avoiding public disagreement with a superior', 'Celebrating a colleague\'s success even if you\'re envious'],
    tip: 'Understanding 인화 explains why Koreans often seem to agree in public but negotiate privately — 인화 requires preserving the appearance of harmony.',
  },
  {
    id: 'oegukin', korean: '외국인', romanization: 'Oegukin', english: 'Foreigner Experience',
    category: 'Society', emoji: '🌏',
    summary: 'The unique social position of being a foreigner (외국인) in Korea.',
    explanation: '외국인 (外國人, "outside-country person") describes foreigners in Korea. While Korea is increasingly multicultural, foreigners often experience a mix of genuine curiosity, warmth, and sometimes awkwardness. 외국인 may be complimented for speaking any Korean at all, may find their Korean skills underestimated, or may experience the phenomenon of Koreans switching to English immediately.',
    examples: ['"한국어 잘 하시네요!" (You speak Korean well!) after saying 감사합니다', 'Being the only non-Korean at a 회식', 'Receiving extra helpings because you\'re a guest'],
    tip: 'Making an effort with Korean, no matter how basic, earns enormous goodwill. Koreans deeply appreciate foreigners who try.',
  },

  // --- Modern Korea ---
  {
    id: 'pc-bang', korean: 'PC방', romanization: 'PC-bang', english: 'Internet Café / Gaming Room',
    category: 'Modern Korea', emoji: '🖥️',
    summary: 'Korea\'s legendary gaming café culture — high-spec PCs, snacks, and all-night gaming.',
    explanation: 'PC방 (PC room) is a cultural institution in Korea. For a small hourly fee, anyone can use a high-performance PC, order food delivered to their seat, and play for hours. StarCraft was played competitively in PC방 in the late 90s — the origin of Korea\'s global esports dominance. PC방 are open 24/7 and double as overnight shelters for young people.',
    examples: ['Playing League of Legends from midnight to dawn', 'Ordering 라면 to your gaming station', 'School friends meeting at the PC방 after school'],
    tip: 'PC방 food menus are famous for their own culture — 즉석 떡볶이 (instant tteokbokki) and ramen are staples.',
  },
  {
    id: 'norebang', korean: '노래방', romanization: 'Noraebang', english: 'Karaoke Room',
    category: 'Modern Korea', emoji: '🎤',
    summary: 'Private karaoke rooms — Korea\'s go-to post-dinner social activity.',
    explanation: '노래방 (노래=song + 방=room) is private karaoke — you rent a room with your group rather than singing in front of strangers. It\'s a cornerstone of Korean social life: after dinner (회식 1차), the group heads to 노래방 (2차). Every city block has at least one. Singing ability is secondary — enthusiasm is everything.',
    examples: ['"2차는 노래방 가자!" (Let\'s go to noraebang for round two!)', 'Choosing IU or BTS songs for the group', 'Tambourine and microphone etiquette among friends'],
    tip: 'Even if you can\'t sing, choosing upbeat crowd-pleasing songs is the social skill — the tambourine player is just as important.',
  },
  {
    id: 'hallyu', korean: '한류', romanization: 'Hallyu', english: 'Korean Wave',
    category: 'Modern Korea', emoji: '🌊',
    summary: 'The global spread of Korean popular culture — K-pop, K-dramas, K-food, and more.',
    explanation: '한류 (Korean Wave) began with Korean dramas spreading across Asia in the late 1990s and exploded globally with K-pop groups like BTS and BLACKPINK, the film Parasite, and the TV series Squid Game. It represents Korea\'s extraordinary soft-power transformation from war-devastated country to global cultural exporter in under a century.',
    examples: ['BTS achieving #1 on the Billboard Hot 100', 'Parasite winning the Academy Award for Best Picture', 'Korean skincare becoming a global industry standard'],
    tip: '한류 is now studied in universities worldwide as a case study in cultural diplomacy and soft power.',
  },
  {
    id: 'daebak', korean: '대박', romanization: 'Daebak', english: 'Jackpot / Amazing',
    category: 'Modern Korea', emoji: '💥',
    summary: 'Korea\'s most versatile exclamation — expressing amazement, big success, or jackpot.',
    explanation: '대박 originally meant a huge success or jackpot (대 = big, 박 = gourd/win). Today it\'s an all-purpose expression of amazement, admiration, or disbelief — the Korean equivalent of "wow," "no way," "awesome," or "jackpot." It can be used positively or sarcastically depending on context.',
    examples: ['"대박! 진짜야?" (No way! Really?)', '"이 치킨 대박이다" (This chicken is amazing)', '"그 영화 대박났대" (That movie was a huge hit)'],
    tip: 'You\'ll hear 대박 dozens of times per day in casual Korean conversation and throughout K-dramas — it\'s unmistakably Korean.',
  },

  // --- Traditions ---
  {
    id: 'chuseok', korean: '추석', romanization: 'Chuseok', english: 'Korean Harvest Festival',
    category: 'Traditions', emoji: '🌕',
    summary: 'Korea\'s major harvest holiday — a time for family reunions, ancestral rites, and traditional food.',
    explanation: '추석 (秋夕) falls on the 15th day of the 8th lunar month — usually September or October. It\'s one of Korea\'s two biggest holidays (alongside Seollal/Lunar New Year). Families return to their hometowns, perform 차례 (ancestral memorial rites), visit ancestral graves (성묘), and eat traditional foods like 송편 (half-moon rice cakes).',
    examples: ['Entire nation traveling to hometowns — airports and roads packed', 'Making 송편 together as a family', 'Wearing 한복 (traditional dress) for ancestral rites'],
    tip: 'During 추석 and 설날, most shops close. If you\'re in Korea, stock up on food beforehand and prepare for transportation chaos.',
  },
  {
    id: 'bowing', korean: '절', romanization: 'Jeol', english: 'Traditional Bow',
    category: 'Traditions', emoji: '🙇',
    summary: 'The deep bow — a traditional form of respect still used in ceremonies and formal greetings.',
    explanation: '절 is a full prostration bow used in ancestral rites, weddings, and Lunar New Year. The degree of bowing (절하다) signals the depth of respect. In modern life, lighter nods and bows are used for everyday greetings — the level of the bow reflects the degree of respect for the person\'s seniority.',
    examples: ['Children doing 세배 (New Year bow) to receive elders\' blessings and 세뱃돈 (money)', 'Bowing to teachers at school', 'The 90-degree bow at job interviews'],
    tip: 'When someone older bows to you deeply, reciprocating with an equal or deeper bow is proper — don\'t stay upright.',
  },
  {
    id: 'dokkaebi', korean: '도깨비', romanization: 'Dokkaebi', english: 'Korean Goblin',
    category: 'Traditions', emoji: '👹',
    summary: 'A mischievous supernatural being from Korean folklore — neither fully evil nor good.',
    explanation: '도깨비 are supernatural creatures from Korean folklore — part trickster, part protector. Unlike Western monsters, they\'re often depicted as playful, drunk, and somewhat bumbling rather than terrifying. They carry a 도깨비 방망이 (magic club) that grants wishes. The hit K-drama "도깨비" (Goblin, 2016) brought massive international interest in this mythological figure.',
    examples: ['도깨비불 (will-o\'-the-wisp) — mysterious lights in folklore', 'The K-drama "도깨비" (Guardian: The Lonely and Great God)', 'Children\'s stories featuring mischievous dokkaebi'],
    tip: '도깨비 represent the Korean mythological tradition that is distinct from Chinese and Japanese equivalents — an important cultural difference.',
  },
];

const CATEGORIES = ['All', 'Social', 'Food', 'Language', 'Society', 'Modern Korea', 'Traditions'];

const ACC = accentFor('culture-cards');

interface CultureCardsProps {
  setActiveSection?: (section: Section) => void;
}

const CultureCards: React.FC<CultureCardsProps> = ({ setActiveSection }) => {
  const { subscriptionTier } = useFeatureAccess();
  const isFree = subscriptionTier === 'free';
  const { openUpgradeModal } = useUpgradeModal();
  const [activeCategory, setActiveCategory] = useState(isFree ? FREE_CATEGORY : 'All');
  const [search, setSearch] = useState('');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [turning, setTurning] = useState(false);
  // The two faces are very different heights, so the height is animated in step
  // with the turn — otherwise the card snaps taller mid-rotation and the whole
  // motion reads as a glitch at the end.
  const faceRef = useRef<HTMLDivElement>(null);
  const [boxHeight, setBoxHeight] = useState<number | null>(null);
  // Which cards have been opened this session. Not persisted — claiming a
  // durable "answered" state we do not store would be a lie.
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const freeCards = CARDS.filter(c => c.category === FREE_CATEGORY);
  const lockedCards = CARDS.filter(c => c.category !== FREE_CATEGORY);

  const q = search.toLowerCase();
  const matchesSearch = (c: CultureCard) =>
    !q || c.korean.includes(q) || c.english.toLowerCase().includes(q) || c.romanization.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q);

  // Free users only browse the Social category, but the search box is still
  // shown to them — so it must filter their cards too, not be ignored.
  const visibleCards = isFree
    ? freeCards.filter(matchesSearch)
    : CARDS.filter(c => (activeCategory === 'All' || c.category === activeCategory) && matchesSearch(c));

  const filtered = visibleCards;
  const safeIndex = Math.min(index, Math.max(0, filtered.length - 1));
  const card = filtered[safeIndex];

  // Changing the deck (search or category) starts it from the top.
  const reset = () => { setIndex(0); setFlipped(false); };

  const goTo = (i: number) => {
    if (turning) return;
    setIndex(Math.min(filtered.length - 1, Math.max(0, i)));
    setFlipped(false);
  };

  const flip = () => {
    if (!card || turning) return;
    setSeen(prev => prev.has(card.id) ? prev : new Set(prev).add(card.id));

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setFlipped(f => !f); return; }

    // Swap the face at the halfway point, when the card is edge-on and the
    // change cannot be seen.
    setBoxHeight(faceRef.current?.offsetHeight ?? null);
    setTurning(true);
    window.setTimeout(() => setFlipped(f => !f), 230);
    window.setTimeout(() => { setTurning(false); setBoxHeight(null); }, 470);
  };

  // Space flips, arrows move. The mockup is explicit that a card should only
  // ever turn when asked — so there is no hover or whole-card click.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (e.key === ' ') { e.preventDefault(); flip(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(safeIndex + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(safeIndex - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Runs the moment the swapped face is in the DOM but before paint, so the
  // height transition starts from the locked value rather than jumping.
  useLayoutEffect(() => {
    if (!turning) return;
    const h = faceRef.current?.offsetHeight;
    if (h) setBoxHeight(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped]);

  const railCard = 'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
          Culture cards
          {filtered.length > 0 && (
            <span className="text-[#4A5566] dark:text-gray-500"> · card {safeIndex + 1} of {filtered.length}</span>
          )}
        </h1>
        <div className="flex flex-none items-center gap-3.5">
          <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">No score kept</span>
          {setActiveSection && (
            <button
              onClick={() => setActiveSection('culture')}
              className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
            >
              Back to Culture
            </button>
          )}
        </div>
      </div>

      {/* ── Deck controls ── */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5566] dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search concepts…"
            value={search}
            onChange={e => { setSearch(e.target.value); reset(); }}
            className="h-10 w-full rounded-[10px] border border-[rgba(20,32,47,0.18)] bg-[#FFFCF4] pl-10 pr-8 text-[13.5px] text-[#16202F] focus:outline-none focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            style={{ ['--tw-ring-color' as string]: `${ACC.light}55` }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); reset(); }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-500"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!isFree && CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); reset(); }}
            className={`inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-[9px] px-3.5 text-[12.5px] font-semibold leading-none transition-colors ${
              activeCategory === cat
                ? 'text-white'
                : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
            }`}
            style={activeCategory === cat ? { background: ACC.light } : undefined}
          >
            {cat}
          </button>
        ))}

        {isFree && (
          <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">
            Social concepts — free · {lockedCards.length} more with Premium
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="kl-card p-12 text-center">
          <p className="text-[15px] font-semibold text-[#16202F] dark:text-white">Nothing matches “{search}”</p>
          <button
            onClick={() => { setSearch(''); reset(); }}
            className="mt-3 text-[13.5px] font-semibold hover:underline"
            style={{ color: ACC.light }}
          >
            Clear the search
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-5 lg:flex-row">
          {/* ── The card ── */}
          <div className="order-1 w-full min-w-0 flex-1">
            <div className="mx-auto max-w-[640px]">
              <div
                className={`kl-card ${turning ? 'kl-turn overflow-hidden' : ''}`}
                style={{
                  height: boxHeight ?? undefined,
                  transition: turning ? 'height 250ms cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
                }}
              >
                <div ref={faceRef} className="p-7 sm:p-9">
                {!flipped ? (
                  <>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className="text-[13px] font-semibold" style={{ color: ACC.light }}>
                        {card.category.toUpperCase()}
                      </span>
                      <span className="text-[28px] leading-none" aria-hidden="true">{card.emoji}</span>
                    </div>
                    <div className="font-korean text-[38px] font-bold leading-none text-[#16202F] dark:text-white">
                      {card.korean}
                    </div>
                    <div className="mt-2.5 text-[14px] text-[#4A5566] dark:text-gray-500">{card.romanization}</div>
                    <div className="mt-3 font-display text-[22px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
                      {card.english}
                    </div>
                    <p className="mt-4 text-[16px] leading-[1.6] text-[#3E4A5A] dark:text-gray-300">{card.summary}</p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex items-center gap-2.5">
                      <span className="text-[22px] leading-none" aria-hidden="true">{card.emoji}</span>
                      <span className="font-korean text-[20px] font-bold text-[#16202F] dark:text-white">{card.korean}</span>
                      <span className="text-[13px] text-[#4A5566] dark:text-gray-500">{card.romanization}</span>
                    </div>

                    <p className="text-[15px] leading-[1.7] text-[#3E4A5A] dark:text-gray-300">{card.explanation}</p>

                    <div className="mt-5">
                      <div className="mb-2.5 text-[13px] font-semibold text-[#16202F] dark:text-white">You would see this when</div>
                      <ul className="flex flex-col gap-2">
                        {card.examples.map((ex, i) => (
                          <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-[#3E4A5A] dark:text-gray-300">
                            <span className="flex-none font-semibold" style={{ color: ACC.light }}>·</span>
                            <span>{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div
                      className="mt-5 rounded-r-lg border-l-[3px] px-4 py-3 text-[14px] leading-relaxed text-[#16202F] dark:text-gray-200"
                      style={{ borderColor: ACC.light, background: `${ACC.light}12` }}
                    >
                      {card.tip}
                    </div>
                  </>
                )}

                <button
                  onClick={flip}
                  className="mt-7 flex h-12 w-full items-center justify-center rounded-[10px] text-[15px] font-semibold text-white transition-transform hover:scale-[1.01]"
                  style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
                >
                  {flipped ? 'Turn it back' : 'Flip the card'}
                </button>
                <p className="mt-3 text-center text-[13px] text-[#4A5566] dark:text-gray-500">
                  Or press Space. It only turns when you ask — never on hover.
                </p>
                </div>
              </div>

              <div className="mt-3.5 flex gap-3">
                <button
                  onClick={() => goTo(safeIndex - 1)}
                  disabled={safeIndex === 0}
                  className="flex h-12 flex-1 items-center justify-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => goTo(safeIndex + 1)}
                  disabled={safeIndex >= filtered.length - 1}
                  className="flex h-12 flex-1 items-center justify-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* ── The deck ── */}
          <div className="order-2 w-full flex-none lg:w-[290px]">
            <div className={`${railCard} mb-3.5`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[13.5px] font-semibold text-[#16202F] dark:text-white">This deck</span>
                <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">{seen.size} seen</span>
              </div>
              <div className="-mx-2 flex max-h-[360px] flex-col overflow-y-auto">
                {filtered.map((c, i) => {
                  const now = i === safeIndex;
                  return (
                    <button
                      key={c.id}
                      onClick={() => goTo(i)}
                      className={`flex items-baseline gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
                        now ? '' : 'hover:bg-[rgba(20,32,47,0.05)] dark:hover:bg-white/5'
                      }`}
                      style={now ? { background: `${ACC.light}14`, boxShadow: `inset 2px 0 0 ${ACC.light}` } : undefined}
                    >
                      <span className="flex-none text-[12px] font-semibold text-[#4A5566] dark:text-gray-500">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate">
                        <span className={`font-korean text-[14.5px] ${
                          now ? 'font-bold text-[#16202F] dark:text-white' : 'font-semibold text-[#16202F] dark:text-gray-200'
                        }`}>
                          {c.korean}
                        </span>
                        <span className="ml-2 text-[12.5px] text-[#4A5566] dark:text-gray-500">{c.english}</span>
                      </span>
                      <span className="flex-none text-[12px] font-medium" style={{ color: now ? ACC.light : undefined }}>
                        {now ? 'now' : seen.has(c.id) ? <span className="text-[#4A5566] dark:text-gray-500">seen</span> : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isFree && lockedCards.length > 0 && (
              <button onClick={openUpgradeModal} className="kl-premium flex w-full items-center gap-3 rounded-xl p-3 text-left">
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-white"
                  style={{ background: 'var(--brand-gradient)' }}
                >
                  <Lock className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-[#16202F] dark:text-white">
                    {lockedCards.length} more cards
                  </span>
                  <span className="block text-[12px] text-[#4A5566] dark:text-gray-400">
                    Unlock with Premium · $4/mo
                  </span>
                </span>
                <span className="flex-none text-[13px] font-semibold text-[#C13F22] dark:text-[#F07A55]">→</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CultureCards;
