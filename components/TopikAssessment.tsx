import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PremiumLockBanner } from './PremiumLock';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import { saveTopikEstimate } from '../utils/topikEstimate';
import { useUpgrade } from '../hooks/useUpgrade';
import { accentFor } from '../utils/moduleAccent';
import { sampleAttempt } from '../data/topikQuestions';

const OPTION_LABELS = ['①', '②', '③', '④'];
const ACC = accentFor('topik-test');
const PINE = '#2E6B59';



// Four questions drawn from each level's pool of ten. Free covers levels 1–3
// (12 questions), Premium all six (24) — the same reach as before, but each
// attempt is a different draw rather than the whole bank in a fixed order.
const PER_LEVEL = 4;
const FREE_MAX_LEVEL = 3;

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
  const [certName, setCertName] = useState(user?.name || '');
  const [confirmExit, setConfirmExit] = useState(false);
  // Bumped on restart so a fresh attempt draws new questions.
  const [attempt, setAttempt] = useState(0);

  const maxLevel = isPremium ? 6 : FREE_MAX_LEVEL;

  // Each attempt draws PER_LEVEL questions from each level's pool of ten, then
  // shuffles the options within them. Sampling is what makes a retake a new
  // test; the option shuffle only stops "it was the second one" standing in for
  // knowing the answer.
  const activeQs = useMemo(() => sampleAttempt(PER_LEVEL, maxLevel).map(question => {
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
  }), [maxLevel, attempt]);

  // Sized from the drawn attempt, not the whole bank.
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(activeQs.length).fill(null));
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
    setAnswers(Array(activeQs.length).fill(null));
  };

  // Compute TOPIK level estimate based on cumulative accuracy
  const computeLevel = (): number => {
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
