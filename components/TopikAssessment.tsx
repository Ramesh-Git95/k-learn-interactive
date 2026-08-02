import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PremiumLockBanner } from './PremiumLock';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import { saveTopikEstimate } from '../utils/topikEstimate';
import { useUpgrade } from '../hooks/useUpgrade';
import { accentFor } from '../utils/moduleAccent';

const OPTION_LABELS = ['①', '②', '③', '④'];
const ACC = accentFor('topik-test');
const PINE = '#2E6B59';

interface Question {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  instruction: string;
  sentence?: string;
  options: string[];
  answer: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  // ── Level 1 ── basic Hangul, survival vocabulary, subject/topic particles
  {
    id: 'l1-1', level: 1,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '제 이름( ) 김민준이에요.',
    options: ['은', '는', '이', '가'],
    answer: 0,
    explanation: '이름 ends in a consonant (ㅁ), so the topic marker 은 is used. 는 follows vowels.',
  },
  {
    id: 'l1-2', level: 1,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '저는 학생( ) 아니에요.',
    options: ['이', '가', '을', '에'],
    answer: 0,
    explanation: '학생이 아니에요 = "I am not a student." 이/가 is the subject particle; 학생 ends in a consonant so 이 is used.',
  },
  {
    id: 'l1-3', level: 1,
    instruction: '다음 중 날씨를 나타내는 단어가 아닌 것을 고르십시오.',
    options: ['맑다 (clear)', '춥다 (cold)', '배고프다 (hungry)', '덥다 (hot)'],
    answer: 2,
    explanation: '배고프다 means "hungry" — a physical state, not weather. 맑다, 춥다, 덥다 are all weather words.',
  },
  // ── Level 2 ── basic daily conversation, tense, common connectors
  {
    id: 'l2-1', level: 2,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '내일 친구( ) 같이 영화를 볼 거예요.',
    options: ['에게', '와', '에서', '로'],
    answer: 1,
    explanation: '친구와 같이 = "together with a friend." -와/과 marks accompaniment; 친구 ends in a vowel so 와 is used.',
  },
  {
    id: 'l2-2', level: 2,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '저는 매일 아침 커피( ) 마셔요.',
    options: ['이', '가', '을', '를'],
    answer: 3,
    explanation: '커피 ends in a vowel, so the object particle 를 is used. 을 follows consonants.',
  },
  {
    id: 'l2-3', level: 2,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '오늘 날씨가 좋아서 공원에 ( ).',
    options: ['갔어요', '갈 거예요', '가고 싶어요', '가서'],
    answer: 0,
    explanation: '좋아서 provides the reason for a completed action. "Because the weather was nice, I went to the park." Past tense 갔어요 fits.',
  },
  {
    id: 'l2-4', level: 2,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '어제 영화를 봤( ) 정말 재미있었어요.',
    options: ['으면', '는데', '어서', '지만'],
    answer: 1,
    explanation: 'V-는데 connects background context to a following statement. "I watched a movie yesterday, and it was really interesting."',
  },
  // ── Level 3 ── intermediate grammar patterns, -려면, -기 위해서, -지 않다
  {
    id: 'l3-1', level: 3,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '시험에 합격하( ) 열심히 공부해야 해요.',
    options: ['-아서', '-려면', '-는데', '-더라도'],
    answer: 1,
    explanation: 'V-려면 = "in order to / if you want to." "In order to pass the exam, you have to study hard."',
  },
  {
    id: 'l3-2', level: 3,
    instruction: '밑줄 친 부분과 의미가 가장 비슷한 것을 고르십시오.',
    sentence: '"그 문제는 생각보다 쉽지 않았어요."',
    options: ['어려웠어요', '간단했어요', '복잡하지 않았어요', '쉬웠어요'],
    answer: 0,
    explanation: '쉽지 않았어요 = "was not easy" ≈ 어려웠어요 (was difficult). The meaning is equivalent.',
  },
  {
    id: 'l3-3', level: 3,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '한국어를 잘 하( ) 위해서 매일 연습해요.',
    options: ['기', '는', '을', '면'],
    answer: 0,
    explanation: 'V-기 위해서 = "in order to do." 잘 하기 위해서 = "in order to do well." -기 nominalises the verb before 위해서.',
  },
  // ── Level 4 ── upper-intermediate: formal vocabulary, complex connectors
  {
    id: 'l4-1', level: 4,
    instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
    sentence: '경제 성장과 환경 보호는 서로 ( ) 관계에 있다.',
    options: ['대립적인', '유사한', '종속적인', '동등한'],
    answer: 0,
    explanation: '대립적 = contradictory/opposing. Economic growth and environmental protection are often in tension. 유사한=similar, 종속적=subordinate, 동등한=equal.',
  },
  {
    id: 'l4-2', level: 4,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '아무리 바쁘( ) 건강은 챙겨야 한다.',
    options: ['-더라도', '-지만', '-아서', '-으면'],
    answer: 0,
    explanation: '아무리 -더라도 = "no matter how." "No matter how busy you are, you must take care of your health."',
  },
  {
    id: 'l4-3', level: 4,
    instruction: '다음 밑줄 친 단어와 바꿔 쓸 수 없는 것을 고르십시오.',
    sentence: '"현대인들은 스마트폰 없이는 생활하기 어렵다."',
    options: ['힘들다', '곤란하다', '불가능하다', '쉽지 않다'],
    answer: 2,
    explanation: '어렵다 = difficult (not impossible). 불가능하다 = impossible — too extreme, changes the meaning. 힘들다, 곤란하다, 쉽지 않다 all mean "difficult."',
  },
  {
    id: 'l4-4', level: 4,
    instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
    sentence: '그는 여러 가지 일을 동시에 처리하는 ( )이/가 뛰어나다.',
    options: ['능력', '노력', '방식', '결과'],
    answer: 0,
    explanation: '능력이 뛰어나다 = to have outstanding ability. "He has outstanding ability to handle multiple things simultaneously."',
  },
  // ── Level 5 ── advanced: formal register, abstract vocabulary, reading
  {
    id: 'l5-1', level: 5,
    instruction: '다음 글의 ( )에 알맞은 것을 고르십시오.',
    sentence: '최근 연구에 따르면, 규칙적인 운동이 정신 건강에 ( ) 영향을 미친다는 사실이 밝혀졌다.',
    options: ['긍정적인', '부정적인', '미미한', '일시적인'],
    answer: 0,
    explanation: '규칙적인 운동이 정신 건강에 긍정적인 영향을 미친다 = regular exercise has a positive effect on mental health — the established finding.',
  },
  {
    id: 'l5-2', level: 5,
    instruction: '다음 ( )에 문맥상 가장 알맞은 것을 고르십시오.',
    sentence: '그 기업은 수익성보다 사회적 ( )을 우선시하는 경영 철학으로 유명하다.',
    options: ['책임', '이익', '경쟁', '성장'],
    answer: 0,
    explanation: '사회적 책임 (social responsibility / CSR) is the key concept — prioritising it over profitability is a well-known business philosophy.',
  },
  {
    id: 'l5-3', level: 5,
    instruction: '다음 문장에서 어색한 것을 고르십시오.',
    options: [
      '일찍 일어났기 때문에 피곤해요.',
      '열심히 공부해서 성적이 올랐어요.',
      '비가 오는데도 불구하고 나갔어요.',
      '그는 적극적으로 자신의 의견을 피력했다.',
    ],
    answer: 2,
    explanation: '비가 오는데도 불구하고 — "불구하고" requires a noun or nominalised form: 비가 옴에도 불구하고 or simply 비가 오는데도. ③ is unnatural.',
  },
  // ── Level 6 ── near-mastery: idioms, discourse, subtle grammar
  {
    id: 'l6-1', level: 6,
    instruction: '밑줄 친 표현의 의미로 가장 적절한 것을 고르십시오.',
    sentence: '"그는 말은 앞서지만 행동은 뒤처지는 편이다."',
    options: [
      '언행이 일치하지 않는다',
      '말을 못 하지만 행동은 잘한다',
      '말과 행동이 모두 빠르다',
      '행동보다 말이 느리다',
    ],
    answer: 0,
    explanation: '말은 앞서지만 행동은 뒤처진다 = words go ahead but actions fall behind → 언행불일치 (words and actions don\'t match). A Korean idiomatic expression.',
  },
  {
    id: 'l6-2', level: 6,
    instruction: '다음 글의 주제로 가장 알맞은 것을 고르십시오.',
    sentence: '"고령화 사회에서는 노인 인구의 증가로 인해 의료비 부담이 커지고 사회 복지 재원이 부족해지는 문제가 발생한다. 이를 해결하기 위해서는 세대 간 연대를 강화하고 지속 가능한 사회 보장 제도를 마련하는 것이 필요하다."',
    options: [
      '고령화 사회의 문제와 해결 방안',
      '노인 복지 정책의 역사',
      '의료비 절감 방법',
      '세대 간 갈등의 원인',
    ],
    answer: 0,
    explanation: 'The passage addresses both problems (medical costs, funding gaps) and solutions (generational solidarity, sustainable systems) in an aging society.',
  },
  {
    id: 'l6-3', level: 6,
    instruction: '다음 ( )에 들어갈 가장 알맞은 연결 표현을 고르십시오.',
    sentence: '개인의 자유는 존중받아야 한다. ( ), 그 자유가 타인에게 해를 끼쳐서는 안 된다.',
    options: ['그러나', '따라서', '그러므로', '왜냐하면'],
    answer: 0,
    explanation: '그러나 (however/but) introduces a contrast: freedom should be respected, BUT it shouldn\'t harm others. 따라서/그러므로 = therefore; 왜냐하면 = because.',
  },
];

const FREE_QUESTION_COUNT = 10; // levels 1–3

const LEVEL_INFO: Record<number, { name: string; desc: string; color: string; tip: string }> = {
  1: {
    name: 'TOPIK I — Level 1',
    desc: 'You can understand basic Korean expressions, simple greetings, and fundamental sentence patterns.',
    color: '#10B981',
    tip: 'Strengthen Hangul, core vocabulary (numbers, family, food), and simple sentence endings -이에요/예요 and -아요/어요.',
  },
  2: {
    name: 'TOPIK I — Level 2',
    desc: 'You can handle everyday survival situations and basic conversations using common vocabulary.',
    color: '#24476B',
    tip: 'Practice connecting sentences with -고, -지만, -아서/어서. Expand vocabulary to ~2,000 words for TOPIK I.',
  },
  3: {
    name: 'TOPIK II — Level 3',
    desc: 'You can communicate in most daily life situations and understand basic social topics.',
    color: '#3F8571',
    tip: 'Study intermediate grammar: -려면, -기 위해서, relative clauses. Build social and news vocabulary.',
  },
  4: {
    name: 'TOPIK II — Level 4',
    desc: 'You can discuss diverse topics naturally and understand professional and academic content.',
    color: '#F59E0B',
    tip: 'Focus on formal writing, complex connectors (-는 반면에, -더라도), and topic-specific vocabulary.',
  },
  5: {
    name: 'TOPIK II — Level 5',
    desc: 'You can communicate professionally in Korean and comprehend most complex texts.',
    color: '#EF4444',
    tip: 'Read Korean newspapers and academic articles. Master stylistic register differences.',
  },
  6: {
    name: 'TOPIK II — Level 6',
    desc: 'Near-native proficiency. You can use Korean at a high professional or academic level.',
    color: '#E4572E',
    tip: 'Engage with academic writing, watch dramas without subtitles, and practise formal presentations.',
  },
};

type Screen = 'intro' | 'quiz' | 'results';

const TopikAssessment: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();
  const { subscriptionTier } = useFeatureAccess();
  const { startUpgrade } = useUpgrade();
  const isPremium = subscriptionTier === 'premium';

  const [screen, setScreen] = useState<Screen>('intro');
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(QUESTIONS.length).fill(null));
  const [certName, setCertName] = useState(user?.name || '');
  const [confirmExit, setConfirmExit] = useState(false);
  // Bumped on restart so the option order is re-shuffled for a fresh attempt.
  const [attempt, setAttempt] = useState(0);

  const baseQs = isPremium ? QUESTIONS : QUESTIONS.slice(0, FREE_QUESTION_COUNT);

  // Re-shuffled each attempt (attempt bumps on restart). With only 20 questions
  // a retake shows the same ones, so this stops position memory — "it was the
  // second option" — from standing in for knowing the answer. It does not make
  // the bank bigger; that needs more questions written.
  const activeQs = useMemo(() => baseQs.map(question => {
    const order = question.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return {
      ...question,
      options: order.map(i => question.options[i]),
      answer: order.indexOf(question.answer),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isPremium, attempt]);
  const q = activeQs[qIdx];
  const totalQs = activeQs.length;
  const progressPct = ((qIdx + (chosen !== null ? 1 : 0)) / totalQs) * 100;

  const pick = (idx: number) => {
    if (chosen !== null) return;
    setChosen(idx);
    const updated = [...answers];
    updated[qIdx] = idx;
    setAnswers(updated);
  };

  const advance = () => {
    setChosen(null);
    if (qIdx + 1 >= totalQs) {
      // Award XP on completion: 4 per correct answer, capped at 60 (premium) / 30 (free)
      const correct = activeQs.filter((q, i) => answers[i] === q.answer).length;
      earnXP(Math.min(correct * 4, isPremium ? 60 : 30));
      markStudyToday();
      setScreen('results');
    } else {
      setQIdx(i => i + 1);
    }
  };

  const restart = () => {
    setConfirmExit(false);
    setAttempt(a => a + 1);
    setScreen('intro');
    setQIdx(0);
    setChosen(null);
    setAnswers(Array(QUESTIONS.length).fill(null));
  };

  // Compute TOPIK level estimate based on cumulative accuracy
  const computeLevel = (): number => {
    const maxLevel = isPremium ? 6 : 3;
    for (let L = maxLevel; L >= 1; L--) {
      const indices = activeQs.reduce<number[]>((acc, q, i) => { if (q.level <= L) acc.push(i); return acc; }, []);
      const correct = indices.filter(i => answers[i] === activeQs[i].answer).length;
      if (correct / indices.length >= 0.60) return L;
    }
    return 1;
  };

  const estimatedLevel = screen === 'results' ? computeLevel() : 0;
  const totalCorrect = screen === 'results' ? activeQs.filter((q, i) => answers[i] === q.answer).length : 0;

  // Persist the estimate for placement (dashboard level card + path skipping).
  useEffect(() => {
    if (screen === 'results' && estimatedLevel >= 1) saveTopikEstimate(estimatedLevel);
  }, [screen, estimatedLevel]);

  // Per-level breakdown
  const levelBreakdown = (screen === 'results' ? [1, 2, 3, 4, 5, 6] : []).map(L => {
    const qs = activeQs.filter(q => q.level === L);
    if (qs.length === 0) return null;
    const correct = qs.filter(q => answers[activeQs.indexOf(q)] === q.answer).length;
    return { level: L, correct, total: qs.length, pct: Math.round((correct / qs.length) * 100) };
  }).filter(Boolean) as { level: number; correct: number; total: number; pct: number }[];

  const handlePrint = () => window.print();

  const railCard = 'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

  // ── Intro screen ────────────────────────────────────────────────────────────
  if (screen === 'intro') {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            Find your level
          </h1>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-[#3E4A5A] dark:text-gray-400">
            {totalQs} questions, roughly {Math.max(3, Math.round(totalQs * 0.5))} minutes. Answer what you
            can and skip nothing — getting one wrong tells us as much as getting it right.
          </p>
        </div>

        <div className="kl-card p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { n: `${totalQs}`, l: 'questions' },
              { n: isPremium ? '1–6' : '1–3', l: 'levels covered' },
              { n: 'No', l: 'time limit' },
            ].map(({ n, l }) => (
              <div key={l} className="kl-well rounded-xl px-4 py-3">
                <div className="text-[19px] font-bold leading-none text-[#16202F] dark:text-white">{n}</div>
                <div className="mt-1.5 text-[12.5px] text-[#4A5566] dark:text-gray-500">{l}</div>
              </div>
            ))}
          </div>

          <p className="mt-5 max-w-[60ch] text-[14px] leading-relaxed text-[#3E4A5A] dark:text-gray-400">
            Your result sets where the app starts you: test at level 2 or above and the learning path
            stops pointing you back at the alphabet. It is saved to your account, so it follows you
            between devices, and you can retake it whenever you like.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setScreen('quiz')}
              className="flex h-12 items-center rounded-[10px] px-6 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
            >
              Start the test →
            </button>
            {!isAuthenticated && (
              <button
                onClick={openRegister}
                className="text-[13.5px] font-semibold hover:underline"
                style={{ color: ACC.light }}
              >
                Sign in first so the result is saved
              </button>
            )}
          </div>

          {!isPremium && (
            <p className="mt-4 text-[12.5px] text-[#4A5566] dark:text-gray-500">
              The free test covers TOPIK levels 1–3.{' '}
              <button onClick={startUpgrade} className="font-semibold hover:underline" style={{ color: ACC.light }}>
                Premium adds levels 4–6
              </button>{' '}
              and a printable certificate.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Quiz screen ─────────────────────────────────────────────────────────────
  if (screen === 'quiz') {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
          <h1 className="font-display text-[24px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[26px] dark:text-white">
            Level test
            <span className="text-[#4A5566] dark:text-gray-500"> · question {qIdx + 1} of {totalQs}</span>
          </h1>
          <div className="flex flex-none items-center gap-3.5">
            <span className="hidden text-[13.5px] text-[#4A5566] sm:inline dark:text-gray-500">
              Level {q.level} · {q.level <= 2 ? 'TOPIK I' : 'TOPIK II'}
            </span>
            {/* Leaving mid-test throws the answers away, so it asks once rather
                than acting on a mis-tap. */}
            {confirmExit ? (
              <span className="flex items-center gap-2">
                <span className="text-[13px] text-[#4A5566] dark:text-gray-400">Lose your answers?</span>
                <button
                  onClick={restart}
                  className="flex h-11 items-center rounded-[10px] px-4 text-[14px] font-semibold text-white"
                  style={{ background: '#C13F22' }}
                >
                  Exit
                </button>
                <button
                  onClick={() => setConfirmExit(false)}
                  className="flex h-11 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-[14px] font-semibold text-[#16202F] dark:border-gray-700 dark:text-gray-200"
                >
                  Keep going
                </button>
              </span>
            ) : (
              <button
                onClick={() => (qIdx === 0 && chosen === null ? restart() : setConfirmExit(true))}
                className="flex h-11 items-center gap-2 rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-[14px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
              >
                ← Exit test
              </button>
            )}
          </div>
        </div>

        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
          <div className="h-full rounded-full transition-all duration-500"
               style={{ width: `${progressPct}%`, background: ACC.light }} />
        </div>

        <div className="rounded-[14px] border border-[rgba(20,32,47,0.16)] bg-[#FFFCF4] p-6 sm:p-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 text-[12.5px] font-semibold text-[#4A5566] dark:text-gray-400">{q.instruction}</div>

          {q.sentence && (
            <p className="max-w-[60ch] font-korean text-[20px] leading-[1.75] text-[#16202F] sm:text-[24px] dark:text-white">
              {q.sentence}
            </p>
          )}

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
                </button>
              );
            })}
          </div>

          {chosen !== null && (
            <>
              <div
                className="mt-5 rounded-r-lg border-l-[3px] px-4 py-3.5"
                style={chosen === q.answer
                  ? { borderColor: PINE, background: 'rgba(46,107,89,0.08)' }
                  : { borderColor: '#C13F22', background: 'rgba(193,63,34,0.07)' }}
              >
                <p className="text-[13.5px] font-semibold text-[#16202F] dark:text-gray-200">
                  {chosen === q.answer ? '정답 — correct' : `The answer is ${OPTION_LABELS[q.answer]} ${q.options[q.answer]}`}
                </p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#3E4A5A] dark:text-gray-300">{q.explanation}</p>
              </div>

              <button
                onClick={advance}
                className="mt-6 flex h-12 items-center rounded-[10px] px-5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
              >
                {qIdx + 1 >= totalQs ? 'See my level →' : 'Next question →'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  const levelInfo = LEVEL_INFO[estimatedLevel] ?? LEVEL_INFO[1];
  const scorePct = totalQs ? Math.round((totalCorrect / totalQs) * 100) : 0;

  // Progress toward the next level, from accuracy on that level's questions —
  // the same numbers computeLevel() uses, not a decorative figure.
  const nextLevel = estimatedLevel + 1;
  const nextBand = levelBreakdown.find(b => b.level === nextLevel);
  const maxLevel = isPremium ? 6 : 3;
  const ringPct = estimatedLevel >= maxLevel ? 100 : (nextBand?.pct ?? 0);

  const R = 70;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Print-only certificate styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #topik-cert { display: flex !important; position: fixed; inset: 0; align-items: center; justify-content: center; }
          #topik-cert * { display: revert !important; }
        }
      `}</style>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
          Level test result
        </h1>
        <div className="flex flex-none items-center gap-3.5">
          <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">Taken today</span>
          <button
            onClick={restart}
            className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
          >
            Take it again
          </button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="order-1 w-full min-w-0 flex-1">
          <div className="kl-card p-6 sm:p-8">
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-9">
              {/* The ring */}
              <div className="relative h-[160px] w-[160px] flex-none">
                <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="80" cy="80" r={R} fill="none" strokeWidth="12" className="stroke-[rgba(20,32,47,0.10)] dark:stroke-white/10" />
                  <circle
                    cx="80" cy="80" r={R} fill="none" strokeWidth="12" strokeLinecap="round"
                    stroke={ACC.light}
                    strokeDasharray={`${(ringPct / 100) * CIRC} ${CIRC}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-[38px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
                    {estimatedLevel}
                  </span>
                  <span className="mt-0.5 text-[12.5px] text-[#4A5566] dark:text-gray-500">
                    {estimatedLevel >= maxLevel ? 'top level here' : `${ringPct}% to level ${nextLevel}`}
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="mb-2 text-[12.5px] font-semibold" style={{ color: ACC.light }}>
                  {levelInfo.name.toUpperCase()}
                </div>
                <h2 className="font-display text-[24px] font-semibold leading-[1.2] tracking-[-0.03em] text-[#16202F] sm:text-[30px] dark:text-white">
                  {levelInfo.desc}
                </h2>
                <p className="mt-3 max-w-[60ch] text-[15px] leading-[1.6] text-[#3E4A5A] sm:text-[17px] dark:text-gray-400">
                  {levelInfo.tip}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: 'dashboard' }))}
                    className="flex h-12 items-center rounded-[10px] px-5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
                    style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
                  >
                    Start my plan
                  </button>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: 'topik' }))}
                    className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
                  >
                    Practise TOPIK questions
                  </button>
                </div>
              </div>
            </div>

            {/* Where you stand — by LEVEL, which is what was actually tested.
                The mockup shows reading / listening / speaking / writing bars, but
                this assessment only asks reading-style questions banded by level;
                inventing four skill scores would claim measurements never taken. */}
            <div className="mt-8 border-t border-[rgba(20,32,47,0.12)] pt-6 dark:border-gray-800">
              <div className="mb-4 text-[14px] font-semibold text-[#16202F] dark:text-white">
                Where you stand, level by level
              </div>
              <div className="flex flex-col gap-3.5">
                {levelBreakdown.map(({ level, correct, total, pct }) => {
                  const tone = pct >= 70 ? PINE : pct >= 40 ? ACC.light : '#C13F22';
                  const verdict = pct >= 70 ? 'solid' : pct >= 40 ? 'getting there' : 'start here';
                  return (
                    <div key={level} className="flex items-center gap-4">
                      <span className="w-[92px] flex-none text-[14.5px] text-[#16202F] dark:text-gray-200">
                        Level {level}
                      </span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[rgba(20,32,47,0.09)] dark:bg-gray-800">
                        <span className="block h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: tone }} />
                      </span>
                      <span className="w-[104px] flex-none text-right text-[13.5px]" style={{ color: tone }}>
                        {correct}/{total} · {verdict}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-[12.5px] text-[#4A5566] dark:text-gray-500">
                Scored {totalCorrect} of {totalQs} overall ({scorePct}%). A level counts as reached at 60%.
              </p>
            </div>
          </div>

          {/* Certificate */}
          {isPremium ? (
            <div className="kl-card mt-5 p-6">
              <div className="mb-3 text-[14px] font-semibold text-[#16202F] dark:text-white">Your certificate</div>
              <input
                value={certName}
                onChange={e => setCertName(e.target.value)}
                placeholder="Name for the certificate"
                className="kl-field mb-4 w-full rounded-[10px] border border-[rgba(20,32,47,0.18)] bg-[#FFFCF4] px-3.5 py-2.5 text-[14px] text-[#16202F] focus:outline-none focus:ring-2 focus:ring-[#2F5D8A]/40 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <div
                id="topik-cert"
                className="rounded-[14px] p-8 text-center"
                style={{ background: 'linear-gradient(135deg, #0D141F, #16202F 60%, #1E3A5C)' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">K-Learn Interactive</p>
                <p className="mt-1 text-[12px] text-white/70">Certificate of achievement</p>
                <p className="mt-5 text-[22px] font-semibold text-white">{certName || 'Korean Learner'}</p>
                <p className="mt-1.5 text-[12px] text-white/60">has demonstrated Korean proficiency at</p>
                <div
                  className="mt-3 inline-block rounded-xl px-5 py-2 text-[16px] font-semibold text-white"
                  style={{ background: ACC.light }}
                >
                  {levelInfo.name}
                </div>
                <div className="mt-5 flex justify-center gap-5 text-[10.5px] text-white/50">
                  <span>{totalCorrect}/{totalQs} · {scorePct}%</span>
                  <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="mt-4 flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
              >
                Print or save as PDF
              </button>
            </div>
          ) : (
            <div className="mt-5">
              <PremiumLockBanner
                title="Certificate and levels 4–6 — Premium"
                description="The free test places you within TOPIK levels 1–3. Premium runs the full range and adds a printable certificate."
              />
            </div>
          )}
        </div>

        {/* ── Rail ── */}
        <div className="order-2 w-full flex-none lg:w-[290px]">
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
              What level {estimatedLevel} means
            </div>
            <p className="text-[13.5px] leading-[1.6] text-[#3E4A5A] dark:text-gray-400">{levelInfo.desc}</p>
          </div>

          <div className={`${railCard} mb-3.5`}>
            <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Where to start</div>
            <div className="flex flex-col gap-2">
              {([
                ['grammar', 'Grammar rules'],
                ['vocabulary', 'Vocabulary sets'],
                ['phrases', 'Everyday phrases'],
              ] as [string, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: id }))}
                  className="text-left text-[14px] font-medium text-[#16202F] transition-colors hover:text-[#2F5D8A] dark:text-gray-200 dark:hover:text-[#7FB0E0]"
                >
                  {label} →
                </button>
              ))}
            </div>
          </div>

          <div className={railCard}>
            <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Retaking it</div>
            <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
              Take it again whenever you like — the newest result is the one kept, and nothing else
              resets. Your level is saved to your account, so it follows you between devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopikAssessment;
