import React, { useState } from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PremiumLockBanner } from './PremiumLock';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';
import { accentFor } from '../utils/moduleAccent';

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
const ACC = accentFor('topik');
const PINE = '#2E6B59';
const OCHRE = '#A8761F';

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
  // Per-question outcome, so the palette in the rail can say WHICH ones went
  // wrong rather than only how many.
  const [results, setResults] = useState<(boolean | null)[]>([]);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  // Track total answered across the free session (across level/category switches)
  const [totalAnswered, setTotalAnswered] = useState(0);

  const questions = QUESTIONS[level][category];
  const q = questions[qIdx];
  const freeLimitHit = isFree && totalAnswered >= FREE_QUESTION_LIMIT;

  const resetQuiz = (newLevel?: Level, newCategory?: Category) => {
    const l = newLevel ?? level;
    const c = newCategory ?? category;
    setLevel(l); setCategory(c);
    setQIdx(0); setChosen(null);
    setScore({ correct: 0, total: 0 }); setDone(false);
    setResults(new Array(QUESTIONS[l][c].length).fill(null));
    setFlagged(new Set());
  };

  const pick = (idx: number) => {
    if (chosen !== null) return;
    const right = idx === q.answer;
    setChosen(idx);
    setScore(s => ({ correct: s.correct + (right ? 1 : 0), total: s.total + 1 }));
    setResults(r => {
      const next = r.length ? [...r] : new Array(questions.length).fill(null);
      next[qIdx] = right;
      return next;
    });
    setTotalAnswered(n => n + 1);
    if (right) earnXP(5);
    markStudyToday();
  };

  const advance = () => {
    setChosen(null);
    if (qIdx + 1 >= questions.length) setDone(true);
    else setQIdx(i => i + 1);
  };

  // Set it aside without answering — it stays unanswered and the palette marks it.
  const flagAndSkip = () => {
    setFlagged(f => new Set(f).add(qIdx));
    setChosen(null);
    if (qIdx + 1 >= questions.length) setDone(true);
    else setQIdx(i => i + 1);
  };

  const goTo = (i: number) => {
    if (i === qIdx) return;
    setQIdx(i);
    setChosen(null);
  };

  const answeredCount = results.filter(r => r !== null).length;
  const railCard = 'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';
  const catLabel = category === 'vocabulary' ? 'Vocabulary 어휘' : 'Grammar 문법';

  // ── Completion screen ───────────────────────────────────────────────────────
  if (done) {
    const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0;
    const msg = pct >= 80 ? '합격 수준 — exam-ready for this level'
      : pct >= 60 ? '잘 했어요 — worth reviewing the misses'
      : '계속 연습하세요 — keep going';
    const missed = questions.filter((_, i) => results[i] === false);

    return (
      <div className="mx-auto max-w-3xl">
        <div className="kl-card mb-4 flex flex-wrap items-center gap-5 p-6">
          <div
            className="flex h-[76px] w-[76px] flex-none flex-col items-center justify-center rounded-[14px]"
            style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D` }}
          >
            <span className="text-[26px] font-bold leading-none" style={{ color: ACC.light }}>{score.correct}</span>
            <span className="mt-1 text-[11.5px] font-medium" style={{ color: ACC.light }}>of {score.total}</span>
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="mb-1 text-[12.5px] font-semibold" style={{ color: ACC.light }}>
              TOPIK {level} · {catLabel.toUpperCase()}
            </div>
            <h2 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
              {msg}
            </h2>
            <p className="mt-1.5 text-[13.5px] text-[#3E4A5A] dark:text-gray-400">
              {pct}% on this set{flagged.size > 0 && ` · ${flagged.size} flagged for another look`}
            </p>
          </div>
        </div>

        {missed.length > 0 && (
          <div className="kl-card mb-4 p-5 sm:p-6">
            <div className="mb-3.5 text-[14px] font-semibold text-[#16202F] dark:text-white">
              The {missed.length} you missed
            </div>
            <div className="flex flex-col gap-3">
              {missed.map((mq, i) => (
                <div key={i} className="kl-well rounded-xl p-4">
                  {mq.sentence && (
                    <p className="font-korean text-[16px] font-semibold text-[#16202F] dark:text-white">{mq.sentence}</p>
                  )}
                  <p className="mt-1.5 text-[13.5px]" style={{ color: PINE }}>
                    {OPTION_LABELS[mq.answer]} {mq.options[mq.answer]}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#3E4A5A] dark:text-gray-300">{mq.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => resetQuiz()}
            className="flex h-12 items-center rounded-[10px] px-5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
          >
            Try this set again →
          </button>
          <button
            onClick={() => resetQuiz(level, category === 'vocabulary' ? 'grammar' : 'vocabulary')}
            className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
          >
            Switch to {category === 'vocabulary' ? 'Grammar' : 'Vocabulary'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
          TOPIK {level}
          <span className="text-[#4A5566] dark:text-gray-500">
            {' · '}{category === 'vocabulary' ? 'Vocabulary' : 'Grammar'} · question {qIdx + 1} of {questions.length}
          </span>
        </h1>
        <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">
          {score.correct} right of {score.total} answered
        </span>
      </div>

      {/* ── Level and section ──
             Labelled in English with the Korean beside it: these are navigation,
             and the design rule is that chrome is English while Korean is kept
             for where it is actually the content. 어휘 alone told a beginner
             nothing about what the button did. */}
      <div className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-3">
        <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">Level:</span>
        {(['I', 'II'] as Level[]).map(l => (
          <button
            key={l}
            onClick={() => resetQuiz(l, category)}
            className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-[9px] px-3.5 text-[12.5px] font-semibold leading-none transition-colors ${
              level === l ? 'text-white'
                : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
            }`}
            style={level === l ? { background: ACC.light } : undefined}
          >
            TOPIK {l}
            <span className={level === l ? 'text-white/70' : 'text-[#4A5566] dark:text-gray-500'}>
              {l === 'I' ? 'beginner' : 'intermediate'}
            </span>
          </button>
        ))}

        <span className="ml-3 text-[12.5px] text-[#4A5566] dark:text-gray-500">Section:</span>
        {([['vocabulary', 'Vocabulary', '어휘'], ['grammar', 'Grammar', '문법']] as [Category, string, string][]).map(([c, en, ko]) => (
          <button
            key={c}
            onClick={() => resetQuiz(level, c)}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] px-3.5 text-[12.5px] font-semibold leading-none transition-colors ${
              category === c ? 'text-white'
                : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
            }`}
            style={category === c ? { background: ACC.light } : undefined}
            title={c === 'vocabulary' ? 'Word-meaning questions' : 'Grammar and particle questions'}
          >
            {en}
            <span className={`font-korean ${category === c ? 'text-white/70' : 'text-[#4A5566] dark:text-gray-500'}`}>{ko}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        {/* ── The question ── */}
        <div className="order-1 w-full min-w-0 flex-1">
          {(!freeLimitHit || chosen !== null) && (
            <div className="rounded-[14px] border border-[rgba(20,32,47,0.16)] bg-[#FFFCF4] p-6 sm:p-8 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 text-[12.5px] font-semibold text-[#4A5566] dark:text-gray-400">
                {q.instruction}
              </div>

              {q.sentence && (
                <p className="max-w-[60ch] font-korean text-[20px] leading-[1.75] text-[#16202F] sm:text-[24px] dark:text-white">
                  {q.sentence}
                </p>
              )}

              {/* Options, numbered as the exam numbers them */}
              <div className="mt-6 flex max-w-[640px] flex-col gap-2.5">
                {q.options.map((opt, i) => {
                  const isChosen = chosen === i;
                  const answered = chosen !== null;
                  const right = answered && i === q.answer;
                  const wrong = answered && isChosen && i !== q.answer;
                  const dim = answered && !right && !isChosen;
                  return (
                    <button
                      key={i}
                      onClick={() => pick(i)}
                      disabled={answered}
                      className={`flex min-h-[56px] items-center gap-3.5 rounded-[10px] border-[1.5px] px-4 py-3 text-left transition-all disabled:cursor-default ${
                        right || wrong ? '' : dim
                          ? 'border-[rgba(20,32,47,0.12)] opacity-45 dark:border-gray-800'
                          : 'border-[rgba(20,32,47,0.18)] hover:border-[rgba(20,32,47,0.34)] dark:border-gray-700 dark:hover:border-gray-500'
                      }`}
                      style={
                        right ? { borderColor: PINE, background: 'rgba(46,107,89,0.08)' }
                        : wrong ? { borderColor: '#C13F22', background: 'rgba(193,63,34,0.07)' }
                        : undefined
                      }
                    >
                      <span
                        className="flex h-7 w-7 flex-none items-center justify-center rounded-full border-[1.5px] text-[13px] font-semibold"
                        style={
                          right ? { borderColor: PINE, background: PINE, color: '#fff' }
                          : wrong ? { borderColor: '#C13F22', background: '#C13F22', color: '#fff' }
                          : { borderColor: 'rgba(20,32,47,0.3)', color: '#16202F' }
                        }
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 font-korean text-[17px] font-medium text-[#16202F] sm:text-[19px] dark:text-white">
                        {opt}
                      </span>
                      {right && <span className="flex-none text-[13.5px] font-semibold" style={{ color: PINE }}>correct</span>}
                    </button>
                  );
                })}
              </div>

              {/* Why */}
              {chosen !== null && (
                <div
                  className="mt-5 rounded-r-lg border-l-[3px] px-4 py-3.5"
                  style={chosen === q.answer
                    ? { borderColor: PINE, background: 'rgba(46,107,89,0.08)' }
                    : { borderColor: '#C13F22', background: 'rgba(193,63,34,0.07)' }}
                >
                  <p className="text-[13.5px] font-semibold text-[#16202F] dark:text-gray-200">
                    {chosen === q.answer
                      ? '정답 — correct'
                      : `The answer is ${OPTION_LABELS[q.answer]} ${q.options[q.answer]}`}
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#3E4A5A] dark:text-gray-300">
                    {q.explanation}
                  </p>
                </div>
              )}

              {/* Move on */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(20,32,47,0.12)] pt-5 dark:border-gray-800">
                <button
                  onClick={flagAndSkip}
                  disabled={freeLimitHit}
                  className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
                >
                  Flag and skip
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">
                    {answeredCount} answered{flagged.size > 0 && ` · ${flagged.size} flagged`}
                  </span>
                  {chosen !== null && !freeLimitHit && (
                    <button
                      onClick={advance}
                      className="flex h-12 items-center rounded-[10px] px-5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
                      style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
                    >
                      {qIdx + 1 >= questions.length ? 'See how you did →' : 'Next →'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {freeLimitHit && (
            <div className="mt-4">
              <PremiumLockBanner
                title="TOPIK prep — Premium"
                description={`That is all ${FREE_QUESTION_LIMIT} sample questions. Premium opens every official-style question across TOPIK I and TOPIK II.`}
              />
            </div>
          )}
        </div>

        {/* ── Rail ── */}
        <div className="order-2 w-full flex-none lg:w-[290px]">
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Questions</div>
            <div className="grid grid-cols-8 gap-1.5">
              {questions.map((_, i) => {
                const r = results[i];
                const now = i === qIdx;
                const isFlagged = flagged.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="flex h-7 items-center justify-center rounded-md text-[11.5px] font-semibold transition-transform hover:scale-105"
                    style={
                      now ? { border: `1.5px solid ${ACC.light}`, background: `${ACC.light}24`, color: '#16202F' }
                      : isFlagged ? { background: OCHRE, color: '#fff' }
                      : r === true ? { background: PINE, color: '#fff' }
                      : r === false ? { background: '#C13F22', color: '#fff' }
                      : { background: 'rgba(20,32,47,0.05)', color: '#16202F' }
                    }
                    title={
                      r === true ? 'Right' : r === false ? 'Wrong'
                      : isFlagged ? 'Flagged' : now ? 'Current' : 'Not answered'
                    }
                  >
                    <span className={now || r === null && !isFlagged ? 'dark:text-gray-300' : ''}>{i + 1}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[12.5px] text-[#4A5566] dark:text-gray-500">
              <span style={{ color: PINE }}>right</span>
              <span style={{ color: '#C13F22' }}>wrong</span>
              <span style={{ color: OCHRE }}>flagged</span>
              <span>left</span>
            </div>
          </div>

          <div className={`${railCard} mb-3.5`}>
            <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">This set</div>
            <div className="flex gap-5 text-[13.5px] text-[#4A5566] dark:text-gray-400">
              <span><strong className="font-semibold text-[#16202F] dark:text-white">{score.correct}</strong> right</span>
              <span><strong className="font-semibold text-[#16202F] dark:text-white">{score.total - score.correct}</strong> wrong</span>
              <span><strong className="font-semibold text-[#16202F] dark:text-white">{questions.length - answeredCount}</strong> left</span>
            </div>
          </div>

          <div className={railCard}>
            <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">How this differs from the exam</div>
            <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
              These are practice questions in the official style, answered one at a time with the
              reasoning shown. There is no clock here — the real TOPIK is timed, so work quickly
              when you sit it.
            </p>
            {isFree && (
              <p className="mt-3 text-[12.5px] text-[#4A5566] dark:text-gray-500">
                {Math.max(0, FREE_QUESTION_LIMIT - totalAnswered)} sample{' '}
                {FREE_QUESTION_LIMIT - totalAnswered === 1 ? 'question' : 'questions'} left ·{' '}
                <button onClick={openUpgradeModal} className="font-semibold hover:underline" style={{ color: ACC.light }}>
                  unlock all
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopikPrepSection;
