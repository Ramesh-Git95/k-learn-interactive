import React, { useState } from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PremiumLockBanner } from './PremiumLock';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';

// Free users get 3 sample questions: TOPIK I vocab[0], TOPIK I grammar[0], TOPIK II vocab[0]
const FREE_QUESTION_LIMIT = 3;

interface TopikQuestion {
  instruction: string;
  sentence: string;
  options: string[];
  answer: number;
  explanation: string;
}

const QUESTIONS: Record<'I' | 'II', Record<'vocabulary' | 'grammar', TopikQuestion[]>> = {
  I: {
    vocabulary: [
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '저는 학교에서 한국어를 ( ).',
        options: ['먹어요', '배워요', '자요', '가요'],
        answer: 1,
        explanation: '배우다 means "to learn". The sentence says "I learn Korean at school." 먹다=eat, 자다=sleep, 가다=go.',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '날씨가 ( ) 코트를 입었어요.',
        options: ['더워서', '추워서', '좋아서', '나빠서'],
        answer: 1,
        explanation: '춥다 → 추워서 = "because it\'s cold". You wear a coat when cold, not when warm or bad.',
      },
      {
        instruction: '다음 중 과일이 아닌 것을 고르십시오.',
        sentence: '',
        options: ['사과 (apple)', '바나나 (banana)', '딸기 (strawberry)', '당근 (carrot)'],
        answer: 3,
        explanation: '사과, 바나나, 딸기 are all fruits (과일). 당근 is a vegetable (채소), so it does not belong.',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '저는 배가 ( ) 밥을 많이 먹었어요.',
        options: ['고파서', '불러서', '아파서', '좋아서'],
        answer: 0,
        explanation: '배가 고프다 = to be hungry. 고파서 = because I was hungry. The sentence means "Because I was hungry, I ate a lot."',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '지금 몇 ( )이에요?',
        options: ['날', '시', '달', '해'],
        answer: 1,
        explanation: '몇 시 = "what time". 몇 날 = which day, 몇 달 = how many months, 몇 해 = how many years. The question asks for the current time.',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '친구하고 같이 극장에 갔어요. 거기서 ( )을/를 봤어요.',
        options: ['음악', '영화', '운동', '요리'],
        answer: 1,
        explanation: '극장 (cinema/theatre) is where you watch 영화 (movies/films). The sentence says they went to the cinema together.',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '저는 매일 아침 ( )에서 양치질을 해요.',
        options: ['주방', '거실', '침실', '화장실'],
        answer: 3,
        explanation: '양치질 (brushing teeth) is done in the 화장실 (bathroom). 주방=kitchen, 거실=living room, 침실=bedroom.',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '오늘 너무 피곤해서 ( ) 싶어요.',
        options: ['먹고', '쉬고', '일하고', '공부하고'],
        answer: 1,
        explanation: 'When tired (피곤하다), you want to 쉬다 (rest). 쉬고 싶어요 = "I want to rest."',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '그 사람은 ( )이 좋아서 모든 사람이 좋아해요.',
        options: ['성격', '얼굴', '키', '나이'],
        answer: 0,
        explanation: '성격이 좋다 = to have a good personality. People like someone because of their good 성격 (personality/character).',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '비가 와서 ( )을/를 가지고 나갔어요.',
        options: ['모자', '장갑', '우산', '선글라스'],
        answer: 2,
        explanation: 'When it rains (비가 오다), you take an 우산 (umbrella). 모자=hat, 장갑=gloves, 선글라스=sunglasses.',
      },
    ],
    grammar: [
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '저는 내일 부산에 ( ).',
        options: ['갔어요', '갈 거예요', '가요', '가세요'],
        answer: 1,
        explanation: '내일 (tomorrow) signals future tense. -ㄹ/을 거예요 expresses future intention or plans. "I will go to Busan tomorrow."',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '친구( ) 같이 점심을 먹었어요.',
        options: ['를', '에', '와', '에서'],
        answer: 2,
        explanation: '-와/과 means "with/and". 친구 ends in a vowel, so 와 is used. "I ate lunch together with a friend."',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '저는 한국어를 배우( ) 싶어요.',
        options: ['면', '고', '서', '지만'],
        answer: 1,
        explanation: 'V-고 싶다 = want to do something. "I want to learn Korean." This is a fixed grammatical pattern.',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '이 음식은 맵( ) 맛있어요.',
        options: ['어서', '으면', '지만', '고'],
        answer: 2,
        explanation: '-지만 connects two contrasting clauses (but/however). "This food is spicy, but it is delicious."',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '학교( ) 집까지 걸어서 20분이에요.',
        options: ['에', '에서', '에게', '와'],
        answer: 1,
        explanation: '-에서 marks the starting point of movement or action. "From school to home is 20 minutes on foot."',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '비가 많이 ( ) 우산을 가져왔어요.',
        options: ['오면', '와서', '오지만', '오고'],
        answer: 1,
        explanation: '-아서/어서 expresses reason or cause. "Because it was raining a lot, I brought an umbrella."',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '오늘 날씨가 좋( ) 공원에 가고 싶어요.',
        options: ['으면', '으니까', '지만', '아서'],
        answer: 3,
        explanation: '-아서/어서 expresses reason. 좋다 → 좋아서 = "because the weather is nice". "Because the weather is nice today, I want to go to the park."',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '저는 음악( ) 들으면서 공부해요.',
        options: ['이', '을', '에', '가'],
        answer: 1,
        explanation: '듣다 (to listen) is a transitive verb requiring -을/를 (object particle). 음악 ends in a consonant, so 을 is used.',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '밥을 먹( ) 이를 닦았어요.',
        options: ['고', '어서', '으면', '지만'],
        answer: 1,
        explanation: '-아서/어서 can also show sequential action (after doing). "After eating, I brushed my teeth."',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '저는 요즘 바쁘( ) 운동을 못 해요.',
        options: ['지만', '면', '아서', '고'],
        answer: 2,
        explanation: '바쁘다 → 바빠서 = "because I\'m busy". -아서/어서 expresses reason. "Because I\'m busy these days, I can\'t exercise."',
      },
    ],
  },
  II: {
    vocabulary: [
      {
        instruction: '다음 밑줄 친 단어와 반대 의미를 가진 것을 고르십시오.',
        sentence: '"그는 항상 친구들에게 친절하다."',
        options: ['성실하다 (diligent)', '무뚝뚝하다 (cold/curt)', '부지런하다 (hardworking)', '똑똑하다 (smart)'],
        answer: 1,
        explanation: '친절하다 (kind/friendly) is the antonym of 무뚝뚝하다 (cold, curt, unfriendly). The question asks for the opposite meaning.',
      },
      {
        instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
        sentence: '환경 오염 문제를 ( )하기 위해 정부가 새로운 법을 만들었다.',
        options: ['발전', '해결', '성장', '변화'],
        answer: 1,
        explanation: '해결하다 = to solve/resolve. "The government created a new law in order to resolve environmental pollution problems."',
      },
      {
        instruction: '다음 ( )에 알맞은 어휘를 고르십시오.',
        sentence: '한국어를 빠르게 ( )하려면 꾸준한 연습이 필요하다.',
        options: ['준비', '선택', '습득', '보호'],
        answer: 2,
        explanation: '습득하다 = to acquire/master (a skill or language). "Consistent practice is needed to acquire Korean quickly."',
      },
      {
        instruction: '다음 중 빈칸에 들어갈 수 없는 것을 고르십시오.',
        sentence: '그 사람은 정말 ( ) 사람이에요.',
        options: ['착한', '친절한', '열심히', '성실한'],
        answer: 2,
        explanation: '착하다, 친절하다, 성실하다 are adjectives that can modify 사람. 열심히 is an adverb (diligently) and cannot directly modify a noun.',
      },
      {
        instruction: '밑줄 친 것과 바꿔 쓸 수 있는 것을 고르십시오.',
        sentence: '"이 문제는 해결하기 매우 어렵다."',
        options: ['쉽다', '힘들다', '간단하다', '가능하다'],
        answer: 1,
        explanation: '어렵다 (difficult) ≈ 힘들다 (hard/tough). They can often be used interchangeably. 쉽다=easy, 간단하다=simple, 가능하다=possible.',
      },
      {
        instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
        sentence: '소비자들은 제품을 살 때 가격뿐만 아니라 품질도 ( )한다.',
        options: ['비교', '선택', '고려', '결정'],
        answer: 2,
        explanation: '고려하다 = to consider/take into account. "Consumers consider both price and quality when purchasing products."',
      },
      {
        instruction: '밑줄 친 단어의 의미로 가장 알맞은 것을 고르십시오.',
        sentence: '"그는 어떤 어려운 상황에서도 절대 포기하지 않는다."',
        options: ['시작하다', '노력하다', '그만두다', '참다'],
        answer: 2,
        explanation: '포기하다 (to give up/abandon) ≈ 그만두다 (to stop/quit). They share the meaning of ceasing an effort.',
      },
      {
        instruction: '다음 ( )에 알맞은 말을 고르십시오.',
        sentence: '현대 사회에서는 외국어 능력이 취업에 매우 큰 ( )을/를 한다.',
        options: ['노력', '결과', '목적', '역할'],
        answer: 3,
        explanation: '역할을 하다 = to play a role. "In modern society, foreign language ability plays a very important role in employment."',
      },
    ],
    grammar: [
      {
        instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
        sentence: '건강을 유지( ) 매일 규칙적으로 운동해야 한다.',
        options: ['-하더라도', '-하려면', '-하다가', '-한다면'],
        answer: 1,
        explanation: 'V-려면 = "if you want to / in order to". "If you want to maintain your health, you must exercise regularly every day."',
      },
      {
        instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
        sentence: '시간이 ( ) 더 도와드리고 싶지만 이만 가야 할 것 같아요.',
        options: ['있으면', '있어도', '있는데', '있으니까'],
        answer: 1,
        explanation: '-아도/어도 = "even if / even though" (concessive). "Even if I have time, I want to help more, but I think I should go now."',
      },
      {
        instruction: '다음 중 밑줄 친 것과 의미가 가장 비슷한 것을 고르십시오.',
        sentence: '"그 일이 어려울 것 같아서 포기했다."',
        options: ['-ㄹ 것 같지만', '-ㄹ 것 같으므로', '-ㄹ 것 같도록', '-ㄹ 것 같아야'],
        answer: 1,
        explanation: '-아서/어서 (reason) ≈ -으므로 (formal causal connector). Both express the reason for giving up.',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '학교까지 걸어서 ( ) 한 시간이 걸린다.',
        options: ['도', '만큼', '쯤', '처럼'],
        answer: 2,
        explanation: '-쯤 = "about / approximately". "It takes approximately one hour to walk to school." 처럼=like, 만큼=as much as.',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '그 식당은 맛은 ( ) 가격도 비싸다.',
        options: ['없기 때문에', '없는 반면에', '없을 뿐만 아니라', '없다면'],
        answer: 2,
        explanation: '-뿐만 아니라 = "not only ~ but also". "That restaurant is not only tasteless but also expensive."',
      },
      {
        instruction: '다음 중 어법에 맞는 문장을 고르십시오.',
        sentence: '',
        options: [
          '그는 공부하면서 아르바이트도 한다.',
          '그는 공부함에 아르바이트도 한다.',
          '그는 공부하기에 아르바이트도 한다.',
          '그는 공부하더니 아르바이트도 한다.',
        ],
        answer: 0,
        explanation: '-면서 = "while doing / simultaneously". ① "He does part-time work while also studying" is grammatically correct. -하더니 implies a change, not simultaneity.',
      },
      {
        instruction: '다음 ( )에 알맞은 것을 고르십시오.',
        sentence: '아무리 힘들( ) 끝까지 포기하지 않겠다.',
        options: ['-더라도', '-는데도', '-어서', '-으면'],
        answer: 0,
        explanation: '아무리 -더라도 = "no matter how much". "No matter how hard it is, I will not give up until the end."',
      },
      {
        instruction: '밑줄 친 부분과 바꿔 쓸 수 있는 것을 고르십시오.',
        sentence: '"내일 비가 오면 소풍을 취소할 거예요."',
        options: ['오는 경우에는', '오더라도', '왔으면', '오지 않으면'],
        answer: 0,
        explanation: '-면 (conditional: "if") ≈ -는 경우에는 ("in the case that"). "In the case that it rains tomorrow, we will cancel the picnic."',
      },
    ],
  },
};

type Level = 'I' | 'II';
type Category = 'vocabulary' | 'grammar';

const OPTION_LABELS = ['①', '②', '③', '④'];

const TopikPrepSection: React.FC = () => {
  const { subscriptionTier } = useFeatureAccess();
  const isFree = subscriptionTier === 'free';
  const { openUpgradeModal } = useUpgradeModal();
  const [level, setLevel] = useState<Level>('I');
  const [category, setCategory] = useState<Category>('vocabulary');
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);

  // Track total answered across the free session (across level/category switches)
  const [totalAnswered, setTotalAnswered] = useState(0);

  const questions = QUESTIONS[level][category];
  const q = questions[qIdx];
  const progress = (qIdx / questions.length) * 100;
  const freeLimitHit = isFree && totalAnswered >= FREE_QUESTION_LIMIT;

  const resetQuiz = (newLevel?: Level, newCategory?: Category) => {
    const l = newLevel ?? level;
    const c = newCategory ?? category;
    setLevel(l); setCategory(c);
    setQIdx(0); setChosen(null);
    setScore({ correct: 0, total: 0 }); setDone(false);
  };

  const pick = (idx: number) => {
    if (chosen !== null) return;
    setChosen(idx);
    setScore(s => ({ correct: s.correct + (idx === q.answer ? 1 : 0), total: s.total + 1 }));
    setTotalAnswered(n => n + 1);
    if (idx === q.answer) earnXP(5);
    markStudyToday();
  };

  const advance = () => {
    setChosen(null);
    if (qIdx + 1 >= questions.length) setDone(true);
    else setQIdx(i => i + 1);
  };

  // ── Completion screen ───────────────────────────────────────────────────────
  if (done) {
    const pct = Math.round((score.correct / score.total) * 100);
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '💪';
    const msg = pct >= 80 ? '합격 수준!' : pct >= 60 ? '잘 했어요!' : '계속 연습하세요!';
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden mb-6 p-6 text-center"
          style={{ background: 'var(--brand-gradient-hero-rev)' }}>
          <div className="text-5xl mb-2">{emoji}</div>
          <h2 className="text-2xl font-black text-white mb-1">{msg}</h2>
          <p className="text-white/80 text-sm">TOPIK {level} · {category === 'vocabulary' ? 'Vocabulary 어휘' : 'Grammar 문법'}</p>
          <div className="mt-4 inline-flex items-center gap-3 bg-white/20 rounded-2xl px-6 py-3">
            <span className="text-3xl font-black text-white">{score.correct}/{score.total}</span>
            <div className="text-left">
              <p className="text-white text-sm font-black">{pct}%</p>
              <p className="text-white/70 text-xs">correct</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 mb-4">
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Score guide</p>
          <div className="space-y-2">
            {[['80–100%', '🏆', 'Exam-ready for this level', 'text-green-600 dark:text-green-400'], ['60–79%', '👍', 'Good — review missed questions', 'text-yellow-600 dark:text-yellow-400'], ['0–59%', '💪', 'Keep studying — try again!', 'text-red-600 dark:text-red-400']].map(([range, em, desc, color]) => (
              <div key={range} className="flex items-center gap-3 text-sm">
                <span>{em}</span>
                <span className={`font-black ${color} w-20`}>{range}</span>
                <span className="text-gray-500 dark:text-gray-400">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => resetQuiz()}
            className="py-3 text-white text-sm font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{ background: 'var(--brand-gradient)' }}>
            🔄 Try Again
          </button>
          <button onClick={() => resetQuiz(level, category === 'vocabulary' ? 'grammar' : 'vocabulary')}
            className="py-3 text-sm font-black rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Switch Section
          </button>
        </div>
      </div>
    );
  }

  // ── Active quiz ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-6 p-5 sm:p-6"
        style={{ background: 'var(--brand-gradient-hero-rev)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {['읽기','어휘','문법','TOPIK','시험'].map((w, i) => (
            <span key={i} className="absolute text-white/10 font-black"
              style={{ fontSize: `${1.1 + (i % 2) * 0.5}rem`, top: `${(i * 37) % 85}%`, left: `${(i * 43) % 80}%` }}>{w}</span>
          ))}
        </div>
        <div className="relative z-10 text-center">
          <div className="text-4xl mb-2">📋</div>
          <h1 className="text-xl sm:text-2xl font-black text-white mb-1">TOPIK Prep 시험 준비</h1>
          <p className="text-white/80 text-xs">Practice with official-style TOPIK questions</p>
        </div>
      </div>

      {/* Level + Category selectors */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Level tabs */}
        <div className="flex rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm flex-1">
          {(['I', 'II'] as Level[]).map(l => (
            <button key={l} onClick={() => resetQuiz(l, category)}
              className={`flex-1 py-2.5 text-sm font-black transition-all ${level === l ? 'tab-brand-active' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              TOPIK {l}
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${level === l ? 'badge-brand' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                {l === 'I' ? 'Beginner' : 'Intermediate'}
              </span>
            </button>
          ))}
        </div>
        {/* Category tabs */}
        <div className="flex rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm flex-1">
          {([['vocabulary', '어휘', '📖'], ['grammar', '문법', '✏️']] as [Category, string, string][]).map(([c, ko, em]) => (
            <button key={c} onClick={() => resetQuiz(level, c)}
              className={`flex-1 py-2.5 text-sm font-black transition-all flex items-center justify-center gap-1.5 ${category === c ? 'tab-brand-active' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              {em} {ko}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'var(--brand-gradient-h)' }} />
        </div>
        <span className="text-xs font-black text-gray-400 dark:text-gray-500 flex-shrink-0">
          {qIdx + 1} / {questions.length}
        </span>
      </div>

      {/* Question card — stays visible (with feedback) even once the free limit
          is hit, so the last answered question's explanation is readable. The
          upgrade wall is shown below instead of abruptly replacing the card. */}
      {(!freeLimitHit || chosen !== null) && (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-4">
        {/* Question header */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-2 py-0.5 rounded-full badge-brand">
              {qIdx + 1}번
            </span>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
              TOPIK {level} · {category === 'vocabulary' ? '어휘' : '문법'}
            </span>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${level === 'I' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'}`}>
            {level === 'I' ? 'Beginner' : 'Intermediate'}
          </span>
        </div>

        <div className="p-5">
          {/* Instruction */}
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3">{q.instruction}</p>

          {/* Sentence */}
          {q.sentence && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-5 py-4 mb-5 border-l-4 border-l-violet-400">
              <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-relaxed">{q.sentence}</p>
            </div>
          )}

          {/* Options */}
          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              const isChosen = chosen === i;
              const showFeedback = chosen !== null;
              let cls = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-pink-300 dark:hover:border-pink-700 cursor-pointer';
              if (showFeedback) {
                if (i === q.answer) cls = 'bg-green-50 dark:bg-green-900/20 border-2 border-green-400 text-gray-900 dark:text-white cursor-default';
                else if (isChosen) cls = 'bg-red-50 dark:bg-red-900/20 border-2 border-red-400 text-gray-900 dark:text-white opacity-80 cursor-default';
                else cls = 'opacity-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 cursor-default';
              }
              return (
                <button key={i} onClick={() => pick(i)} disabled={chosen !== null}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm ${cls}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-base flex-shrink-0" style={
                      !showFeedback ? { background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } : {}
                    }>{OPTION_LABELS[i]}</span>
                    <span className="font-semibold flex-1">{opt}</span>
                    {showFeedback && i === q.answer && <span className="text-green-500 font-black">✓</span>}
                    {showFeedback && isChosen && i !== q.answer && <span className="text-red-500 font-black">✗</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {chosen !== null && (
            <div className={`mt-4 p-4 rounded-xl border-l-4 ${chosen === q.answer ? 'bg-green-50 dark:bg-green-900/10 border-l-green-400' : 'bg-red-50 dark:bg-red-900/10 border-l-red-400'}`}>
              <p className={`text-xs font-black mb-1 ${chosen === q.answer ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {chosen === q.answer ? '✓ Correct! 정답!' : `✗ Incorrect — Answer: ${OPTION_LABELS[q.answer]} ${q.options[q.answer]}`}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{q.explanation}</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Next / Finish button */}
      {!freeLimitHit && chosen !== null && (
        <button onClick={advance}
          className="w-full py-3 text-sm font-black rounded-xl btn-brand">
          {qIdx + 1 >= questions.length ? '🏁 See Results' : 'Next Question →'}
        </button>
      )}

      {/* Free limit wall — shown after the last answered question's feedback */}
      {freeLimitHit && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-4">
          <PremiumLockBanner
            title="TOPIK Prep — Premium"
            description={`You've tried all ${FREE_QUESTION_LIMIT} sample questions! Upgrade to unlock all 36 official-style questions across TOPIK I and TOPIK II.`}
          />
        </div>
      )}
      {isFree && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          {FREE_QUESTION_LIMIT - Math.min(totalAnswered, FREE_QUESTION_LIMIT)} sample question{FREE_QUESTION_LIMIT - Math.min(totalAnswered, FREE_QUESTION_LIMIT) !== 1 ? 's' : ''} remaining · <button onClick={openUpgradeModal} className="text-violet-500 font-black hover:underline">Unlock all 36 →</button>
        </p>
      )}
    </div>
  );
};

export default TopikPrepSection;
