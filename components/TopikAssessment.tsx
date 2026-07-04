import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PremiumLockBanner } from './PremiumLock';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import { useUpgrade } from '../hooks/useUpgrade';

const OPTION_LABELS = ['①', '②', '③', '④'];

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
    color: '#3B82F6',
    tip: 'Practice connecting sentences with -고, -지만, -아서/어서. Expand vocabulary to ~2,000 words for TOPIK I.',
  },
  3: {
    name: 'TOPIK II — Level 3',
    desc: 'You can communicate in most daily life situations and understand basic social topics.',
    color: '#8B5CF6',
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
    color: '#EC4899',
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

  const activeQs = isPremium ? QUESTIONS : QUESTIONS.slice(0, FREE_QUESTION_COUNT);
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

  // Per-level breakdown
  const levelBreakdown = (screen === 'results' ? [1, 2, 3, 4, 5, 6] : []).map(L => {
    const qs = activeQs.filter(q => q.level === L);
    if (qs.length === 0) return null;
    const correct = qs.filter(q => answers[activeQs.indexOf(q)] === q.answer).length;
    return { level: L, correct, total: qs.length, pct: Math.round((correct / qs.length) * 100) };
  }).filter(Boolean) as { level: number; correct: number; total: number; pct: number }[];

  const handlePrint = () => window.print();

  // ── Intro screen ────────────────────────────────────────────────────────────
  if (screen === 'intro') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <style>{`
          @media print {
            body > * { display: none !important; }
            #topik-cert { display: flex !important; position: fixed; inset: 0; align-items: center; justify-content: center; background: white; }
            #topik-cert * { display: block; }
          }
        `}</style>

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-6 p-6 sm:p-8 text-center"
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)' }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            {['읽기', '어휘', '문법', '쓰기', '듣기', 'TOPIK'].map((w, i) => (
              <span key={i} className="absolute text-white/5 font-black"
                style={{ fontSize: `${1.4 + (i % 3) * 0.4}rem`, top: `${(i * 37) % 90}%`, left: `${(i * 43) % 85}%` }}>{w}</span>
            ))}
          </div>
          <div className="relative z-10">
            <div className="text-5xl mb-3">🎓</div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">TOPIK Level Assessment</h1>
            <p className="text-white/70 text-sm mb-1">한국어 실력을 측정해 보세요</p>
            <p className="text-white/50 text-xs">Find your estimated TOPIK level (1–6)</p>
          </div>
        </div>

        {/* What you get */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { icon: '📊', title: 'Level Estimate', desc: isPremium ? 'Full TOPIK I & II (1–6)' : 'TOPIK I range (1–3)' },
            { icon: '📋', title: 'Score Breakdown', desc: 'Per-level accuracy report' },
            { icon: '🏆', title: 'Certificate', desc: isPremium ? 'Downloadable PDF' : 'Premium only' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-sm font-black text-gray-900 dark:text-white">{title}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        {/* Free vs Premium */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-black text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider mb-2">🆓 Free</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>✓ 10 questions</li>
                <li>✓ TOPIK I levels 1–3</li>
                <li>✓ Score breakdown</li>
                <li className="text-gray-300 dark:text-gray-600">✗ Certificate</li>
                <li className="text-gray-300 dark:text-gray-600">✗ Full 1–6 estimate</li>
              </ul>
            </div>
            <div>
              <p className="font-black text-xs uppercase tracking-wider mb-2" style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>⭐ Premium</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>✓ 20 questions</li>
                <li>✓ Full TOPIK I & II (1–6)</li>
                <li>✓ Score breakdown</li>
                <li>✓ Certificate (print/PDF)</li>
                <li>✓ Personalised study plan</li>
              </ul>
            </div>
          </div>
          {!isPremium && (
            <button onClick={startUpgrade}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-white text-xs font-black rounded-xl hover:opacity-90 transition-opacity"
              style={{ background: 'var(--brand-gradient)' }}>
              ⭐ Get Premium — $4/month →
            </button>
          )}
        </div>

        {/* Start */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 mb-3">
          ~{isPremium ? '15' : '8'} minutes · {totalQs} multiple-choice questions · All answered, no skipping
        </div>
        <button
          onClick={() => setScreen('quiz')}
          className="w-full py-4 text-white font-black rounded-2xl text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }}>
          Start Assessment 시작하기 →
        </button>
      </div>
    );
  }

  // ── Quiz screen ──────────────────────────────────────────────────────────────
  if (screen === 'quiz') {
    const levelColors: Record<number, string> = { 1: '#10B981', 2: '#3B82F6', 3: '#8B5CF6', 4: '#F59E0B', 5: '#EF4444', 6: '#EC4899' };
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">

        {/* Header bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #1a1a2e, #0f3460)' }} />
          </div>
          <span className="text-xs font-black text-gray-400 dark:text-gray-500 flex-shrink-0">
            {qIdx + 1} / {totalQs}
          </span>
        </div>

        {/* Question card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-4">
          {/* Card header */}
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full text-white"
              style={{ background: levelColors[q.level] }}>
              Level {q.level}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold">
              {q.level <= 2 ? 'TOPIK I' : 'TOPIK II'}
            </span>
          </div>

          <div className="p-5">
            {/* Instruction */}
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3">{q.instruction}</p>

            {/* Sentence */}
            {q.sentence && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-5 py-4 mb-5 border-l-4"
                style={{ borderLeftColor: levelColors[q.level] }}>
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-relaxed">{q.sentence}</p>
              </div>
            )}

            {/* Options */}
            <div className="space-y-2.5">
              {q.options.map((opt, i) => {
                const isChosen = chosen === i;
                const showFeedback = chosen !== null;
                let cls = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer';
                if (showFeedback) {
                  if (i === q.answer) cls = 'bg-green-50 dark:bg-green-900/20 border-2 border-green-400 text-gray-900 dark:text-white cursor-default';
                  else if (isChosen) cls = 'bg-red-50 dark:bg-red-900/20 border-2 border-red-400 text-gray-900 dark:text-white opacity-80 cursor-default';
                  else cls = 'opacity-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 cursor-default';
                }
                return (
                  <button key={i} onClick={() => pick(i)} disabled={chosen !== null}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm ${cls}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-base flex-shrink-0"
                        style={!showFeedback ? { color: levelColors[q.level] } : {}}>
                        {OPTION_LABELS[i]}
                      </span>
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

        {/* Next button */}
        {chosen !== null && (
          <button onClick={advance}
            className="w-full py-3 text-white text-sm font-black rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }}>
            {qIdx + 1 >= totalQs ? '🏁 See My Results' : 'Next Question →'}
          </button>
        )}
      </div>
    );
  }

  // ── Results screen ───────────────────────────────────────────────────────────
  const levelInfo = LEVEL_INFO[estimatedLevel];
  const scorePct = Math.round((totalCorrect / totalQs) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">

      {/* Print-only certificate styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #topik-cert { display: flex !important; position: fixed; inset: 0; align-items: center; justify-content: center; }
          #topik-cert * { display: revert !important; }
        }
      `}</style>

      {/* Result hero */}
      <div className="relative rounded-3xl overflow-hidden mb-5 p-6 text-center"
        style={{ background: `linear-gradient(135deg, ${levelInfo.color}22 0%, ${levelInfo.color}44 100%)`, border: `2px solid ${levelInfo.color}66` }}>
        <div className="text-5xl mb-3">🎓</div>
        <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Estimated Level</p>
        <h2 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: levelInfo.color }}>{levelInfo.name}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs mx-auto">{levelInfo.desc}</p>
        <div className="mt-4 inline-flex items-center gap-3 bg-white/60 dark:bg-gray-900/60 rounded-2xl px-5 py-2.5">
          <span className="text-2xl font-black text-gray-900 dark:text-white">{totalCorrect}/{totalQs}</span>
          <div className="text-left">
            <p className="text-sm font-black" style={{ color: levelInfo.color }}>{scorePct}%</p>
            <p className="text-xs text-gray-400">correct</p>
          </div>
        </div>
      </div>

      {/* Level breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
        <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Score by Level</p>
        <div className="space-y-3">
          {levelBreakdown.map(({ level, correct, total, pct }) => {
            const color = LEVEL_INFO[level].color;
            return (
              <div key={level} className="flex items-center gap-3">
                <span className="text-xs font-black w-14 flex-shrink-0" style={{ color }}>Lv {level}</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="text-xs font-black text-gray-500 dark:text-gray-400 w-16 text-right flex-shrink-0">
                  {correct}/{total} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
        {!isPremium && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>🔒</span>
              <span>Levels 4–6 hidden</span>
              <button onClick={startUpgrade}
                className="font-black text-violet-500 hover:underline">Get Premium →</button>
            </div>
          </div>
        )}
      </div>

      {/* Study tip */}
      <div className="rounded-2xl border p-4 mb-4"
        style={{ borderColor: `${levelInfo.color}44`, background: `${levelInfo.color}0d` }}>
        <p className="text-xs font-black mb-1" style={{ color: levelInfo.color }}>📚 What to study next</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{levelInfo.tip}</p>
      </div>

      {/* Certificate — premium only */}
      {isPremium ? (
        <>
          {/* Name input */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Your name for the certificate
            </label>
            <input
              value={certName}
              onChange={e => setCertName(e.target.value)}
              placeholder="Enter your name…"
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {/* Certificate card */}
          <div id="topik-cert"
            className="rounded-3xl overflow-hidden mb-4 p-6 sm:p-8 text-center relative"
            style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)', border: `3px solid ${levelInfo.color}` }}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-10">
              {['한국어', '한', '국', '어', '🇰🇷', '인증'].map((w, i) => (
                <span key={i} className="absolute font-black text-white"
                  style={{ fontSize: `${2 + (i % 3)}rem`, top: `${(i * 41) % 85}%`, left: `${(i * 53) % 80}%` }}>{w}</span>
              ))}
            </div>
            <div className="relative z-10">
              <div className="text-3xl mb-2">🎓</div>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em] mb-1">K-Learn Interactive</p>
              <p className="text-white/70 text-xs font-semibold mb-4">Certificate of Achievement</p>
              <p className="text-white/60 text-xs mb-1">This certifies that</p>
              <p className="text-xl sm:text-2xl font-black text-white mb-3"
                style={{ textShadow: `0 0 20px ${levelInfo.color}88` }}>
                {certName || 'Korean Learner'}
              </p>
              <p className="text-white/60 text-xs mb-3">has demonstrated Korean language proficiency at</p>
              <div className="inline-block px-6 py-2.5 rounded-2xl font-black text-white text-lg mb-3"
                style={{ background: levelInfo.color, boxShadow: `0 4px 20px ${levelInfo.color}66` }}>
                {levelInfo.name}
              </div>
              <div className="flex justify-center gap-6 mb-4 text-white/50 text-[10px]">
                <span>Score: {totalCorrect}/{totalQs} ({scorePct}%)</span>
                <span>·</span>
                <span>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <p className="text-white/30 text-[9px] uppercase tracking-widest">한국어 학습을 응원합니다 🇰🇷</p>
            </div>
          </div>

          <button onClick={handlePrint}
            className="w-full py-3 text-white text-sm font-black rounded-xl mb-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{ background: 'var(--brand-gradient)' }}>
            🖨 Print / Save as PDF
          </button>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
          <PremiumLockBanner
            title="Certificate — Premium"
            description="Upgrade to get a printable certificate and unlock the full TOPIK I + II assessment (levels 1–6)."
          />
        </div>
      )}

      {/* Action row */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={restart}
          className="py-3 text-sm font-black rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          🔄 Try Again
        </button>
        <button
          onClick={() => {
            const event = new CustomEvent('navigate-to-section', { detail: 'topik' });
            window.dispatchEvent(event);
          }}
          className="py-3 text-white text-sm font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }}>
          📋 Practice TOPIK →
        </button>
      </div>
    </div>
  );
};

export default TopikAssessment;
