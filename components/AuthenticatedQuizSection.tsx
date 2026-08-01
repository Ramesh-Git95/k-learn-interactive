import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { vocabulary } from '../data/koreanData';
import type { QuizQuestion } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { Lock, Check } from 'lucide-react';
import { PremiumLockBanner } from './PremiumLock';
import NextUpCard from './NextUpCard';
import { useDailyActivity } from '../hooks/useDailyActivity';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';
import { useSRSContext } from '../contexts/SRSContext';
import { useToastContext } from '../contexts/ToastContext';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import { celebrate } from '../utils/celebrate';
import { QuizSkeleton } from './Skeleton';
import { accentFor } from '../utils/moduleAccent';

const ACC = accentFor('quiz');
const PINE = '#2E6B59';

type QuizMode = 'korean_to_english' | 'english_to_korean' | 'romanization_to_korean' | 'mixed';

interface QuizStats {
  totalQuizzes: number;
  perfectScores: number;
  averageScore: number;
  streak: number;
  bestStreak: number;
}

const AuthenticationRequired: React.FC = () => {
  const openAuth = (mode: 'login' | 'register') => {
    window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: mode }));
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="kl-card p-8 text-center">
        <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
          Sign in to take the quiz
        </h1>
        <p className="mx-auto mt-2.5 max-w-sm text-[14.5px] leading-relaxed text-[#3E4A5A] dark:text-gray-400">
          Scores, streaks and the words you get wrong are saved to your account, so the quiz
          can follow you between devices.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => openAuth('register')}
            className="flex h-12 items-center rounded-[10px] px-5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
          >
            Create a free account →
          </button>
          <button
            onClick={() => openAuth('login')}
            className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthenticatedQuizSection: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <QuizSkeleton />;
  }

  if (!isAuthenticated) return <AuthenticationRequired />;
  return <QuizComponent />;
};

const QuizComponent: React.FC = () => {
  const { updateProgress } = useProgress();
  const { canAccess, hasReachedLimit, getLimit, subscriptionTier } = useFeatureAccess();
  const { dailyActivity, trackActivity } = useDailyActivity();
  const { openUpgradeModal } = useUpgradeModal();
  const { decks, actions: srsActions } = useSRSContext();
  const { showToast } = useToastContext();
  const allVocab = useMemo(() => vocabulary.flatMap(cat => cat.items), []);
  const [savedToDeck, setSavedToDeck] = useState(false);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizMode, setQuizMode] = useState<QuizMode>('mixed');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimedMode, setIsTimedMode] = useState(false);
  const [quizStats, setQuizStats] = useLocalStorage<QuizStats>('quiz-stats', {
    totalQuizzes: 0, perfectScores: 0, averageScore: 0, streak: 0, bestStreak: 0,
  });
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  // One entry per question: true right, false wrong, null not reached. Drives
  // the question map in the rail — the score alone could not say WHICH ones.
  const [results, setResults] = useState<(boolean | null)[]>([]);

  const currentDailyCount = dailyActivity.quizzesTaken;
  const dailyLimit = getLimit('quizzesPerDay') as number;
  const hasReachedDailyLimit = hasReachedLimit('quizzesPerDay', currentDailyCount);
  const maxQuestions = getLimit('quizQuestionsPerSession') as number;
  // Derive a stable boolean — canAccess is a new function reference on every
  // render, so referencing it directly in deps causes an infinite render loop.
  const hasAdvancedQuizModes = canAccess('advancedQuizModes');

  const buildFrom = useCallback((quizItems: typeof allVocab) => {
    const shuffledVocab = [...allVocab].sort(() => 0.5 - Math.random());

    const newQuestions: QuizQuestion[] = quizItems.map((item) => {
      let questionType: QuizQuestion['type'];
      if (quizMode === 'mixed') {
        // Free users only get the unlocked question types even in Mixed mode
        const mixedTypes: QuizQuestion['type'][] = hasAdvancedQuizModes
          ? ['korean_to_english', 'english_to_korean', 'romanization_to_korean']
          : ['korean_to_english'];
        questionType = mixedTypes[Math.floor(Math.random() * mixedTypes.length)];
      } else {
        questionType = quizMode;
      }

      const wrongItems = shuffledVocab.filter(v => v.korean !== item.korean).slice(0, 3);
      let questionData: Omit<QuizQuestion, 'item'>;

      switch (questionType) {
        case 'english_to_korean':
          questionData = {
            question: `What is "${item.english}" in Korean?`,
            options: [item.korean, ...wrongItems.map(v => v.korean)].sort(() => 0.5 - Math.random()),
            answer: item.korean,
            type: 'english_to_korean',
          };
          break;
        case 'romanization_to_korean':
          questionData = {
            question: `Which word is romanized as "${item.romanization}"?`,
            options: [item.korean, ...wrongItems.map(v => v.korean)].sort(() => 0.5 - Math.random()),
            answer: item.korean,
            type: 'romanization_to_korean',
          };
          break;
        default:
          questionData = {
            question: `What is the meaning of "${item.korean}"?`,
            options: [item.english, ...wrongItems.map(v => v.english)].sort(() => 0.5 - Math.random()),
            answer: item.english,
            type: 'korean_to_english',
          };
      }
      return { ...questionData, item };
    });

    setQuestions(newQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setTimeLeft(isTimedMode ? 30 : null);
    setShowExplanation(false);
    setQuizCompleted(false);
    setResults(new Array(newQuestions.length).fill(null));
    setSavedToDeck(false);
  }, [allVocab, quizMode, isTimedMode, hasAdvancedQuizModes]);

  const generateQuestions = useCallback(() => {
    const shuffled = [...allVocab].sort(() => 0.5 - Math.random());
    buildFrom(shuffled.slice(0, maxQuestions));
  }, [allVocab, maxQuestions, buildFrom]);

  // A short round made only of the words just missed. Turning a bad score into
  // something small and winnable beats handing the learner a long list of
  // failures and hoping they read it.
  const retryMissed = useCallback((items: typeof allVocab) => {
    if (items.length) buildFrom(items);
  }, [buildFrom]);

  // Send the missed words to spaced repetition, so they come back on their own
  // schedule instead of living only on a results screen the learner is about to
  // navigate away from. They all go to one standing deck, and words already in
  // it are skipped rather than duplicated.
  const MISSES_DECK = 'Quiz misses';
  const saveMissedToDeck = useCallback((items: typeof allVocab) => {
    if (!items.length) return;
    const existingDeck = decks.find(d => d.name === MISSES_DECK);
    const deckId = existingDeck?.id
      ?? srsActions.createDeck(MISSES_DECK, 'Words you did not get in a quiz');
    const already = new Set((existingDeck?.cards ?? []).map(c => c.content.korean));

    let added = 0;
    items.forEach(item => {
      if (already.has(item.korean)) return;
      srsActions.addCardToDeck(deckId, {
        korean: item.korean,
        english: item.english,
        romanization: item.romanization,
        type: 'vocabulary',
        category: item.category,
      });
      added++;
    });

    setSavedToDeck(true);
    const skipped = items.length - added;
    showToast(
      added === 0
        ? `All ${items.length} are already in ${MISSES_DECK}`
        : `${added} added to ${MISSES_DECK}${skipped ? ` · ${skipped} already there` : ''}`,
      'success',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decks, srsActions]);

  const handleAnswer = useCallback((option: string) => {
    if (selectedAnswer || timeLeft === 0) return;
    setSelectedAnswer(option);
    const correct = option === questions[currentQuestionIndex].answer;
    setIsCorrect(correct);
    setResults(r => { const next = [...r]; next[currentQuestionIndex] = correct; return next; });
    if (correct) setScore(s => s + 1);
  }, [selectedAnswer, timeLeft, questions, currentQuestionIndex]);

  const handleNext = useCallback(() => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
    setCurrentQuestionIndex(i => i + 1);
    setTimeLeft(isTimedMode ? 30 : null);
  }, [isTimedMode]);

  const restartQuiz = useCallback(() => { generateQuestions(); }, [generateQuestions]);

  const completeQuiz = useCallback(async () => {
    if (quizCompleted) return;
    setQuizCompleted(true);
    const finalScore = score / questions.length;
    const isPerfect = score === questions.length;

    if (subscriptionTier === 'free') trackActivity('quiz', 1);

    // +5 XP per correct answer, capped at 30 per session so spamming doesn't inflate level
    earnXP(Math.min(score * 5, 30));
    markStudyToday();

    if (isPerfect && questions.length > 0) {
      celebrate({
        variant: 'perfect',
        emoji: '💯',
        title: 'Perfect score!',
        subtitle: `${score}/${questions.length} — not a single one missed`,
      });
    }

    setQuizStats(prev => ({
      totalQuizzes: prev.totalQuizzes + 1,
      perfectScores: prev.perfectScores + (isPerfect ? 1 : 0),
      averageScore: ((prev.averageScore * prev.totalQuizzes) + finalScore) / (prev.totalQuizzes + 1),
      streak: isPerfect ? prev.streak + 1 : 0,
      bestStreak: Math.max(prev.bestStreak, isPerfect ? prev.streak + 1 : prev.streak),
    }));

    try {
      for (const question of questions) {
        await updateProgress(`quiz_${question.item.korean}`, true);
      }
      await updateProgress(`quiz_completed_${Date.now()}`, true);
    } catch (error) {
      console.error('Error saving quiz progress:', error);
    }
  }, [quizCompleted, score, questions, setQuizStats, updateProgress, subscriptionTier, trackActivity]);

  useEffect(() => { generateQuestions(); }, [generateQuestions]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || selectedAnswer) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    if (timeLeft === 1) {
      setSelectedAnswer(''); setIsCorrect(false);
      setResults(r => { const next = [...r]; next[currentQuestionIndex] = false; return next; });
    }
    return () => clearTimeout(timer);
  }, [timeLeft, selectedAnswer, currentQuestionIndex]);

  useEffect(() => {
    if (currentQuestionIndex >= questions.length && questions.length > 0 && !quizCompleted) {
      completeQuiz();
    }
  }, [currentQuestionIndex, questions.length, quizCompleted, completeQuiz]);

  // Keyboard: A–D pick an answer, Enter moves on. The screen tells the reader
  // these work, so they must.
  useEffect(() => {
    const q = questions[currentQuestionIndex];
    if (!q) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      const answered = selectedAnswer !== null || timeLeft === 0;
  const timerUrgent = isTimedMode && timeLeft !== null && timeLeft <= 10;
      if (e.key === 'Enter') {
        if (answered) { e.preventDefault(); handleNext(); }
        return;
      }
      if (answered) return;
      const i = 'abcd'.indexOf(e.key.toLowerCase());
      if (i >= 0 && i < q.options.length) { e.preventDefault(); handleAnswer(q.options[i]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [questions, currentQuestionIndex, selectedAnswer, timeLeft, handleAnswer, handleNext]);

  // Daily limit screen
  if (subscriptionTier === 'free' && hasReachedDailyLimit) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="kl-card p-8 text-center">
          <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
            That is today&apos;s {dailyLimit} {dailyLimit === 1 ? 'quiz' : 'quizzes'}
          </h2>
          <p className="mx-auto mt-2.5 max-w-sm text-[14.5px] leading-relaxed text-[#3E4A5A] dark:text-gray-400">
            It resets at midnight. Premium removes the daily cap and adds the English-to-Korean
            and romanization modes.
          </p>
        </div>
        <div className="mt-4">
          <PremiumLockBanner
            title="Unlimited quizzes with Premium"
            description="No daily cap, longer sessions, every question mode, and the full word shown when you miss one."
          />
        </div>
      </div>
    );
  }

  // Loading screen
  if (questions.length === 0) {
    return <QuizSkeleton />;
  }

  // Completion screen
  if (currentQuestionIndex >= questions.length && questions.length > 0) {
    const percentage = (score / questions.length) * 100;
    const resultMsg = percentage === 100 ? 'Every one right'
      : percentage >= 80 ? 'Strong round'
      : percentage >= 60 ? 'Solid round'
      : 'Worth another go';

    // quizStats.averageScore is stored as a 0-1 fraction; convert to 0-100 to combine with percentage
    const newAvg = ((quizStats.averageScore * 100 * quizStats.totalQuizzes + percentage) / (quizStats.totalQuizzes + 1));
    const newStreak = percentage === 100 ? quizStats.streak + 1 : 0;
    const missed = questions.filter((_, i) => results[i] === false);

    return (
      <div className="mx-auto max-w-3xl">
        <div className="kl-card mb-4 flex flex-wrap items-center gap-5 p-6">
          <div
            className="flex h-[76px] w-[76px] flex-none flex-col items-center justify-center rounded-[14px]"
            style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D` }}
          >
            <span className="text-[26px] font-bold leading-none" style={{ color: ACC.light }}>{score}</span>
            <span className="mt-1 text-[11.5px] font-medium" style={{ color: ACC.light }}>of {questions.length}</span>
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="mb-1 text-[12.5px] font-semibold" style={{ color: ACC.light }}>QUIZ COMPLETE</div>
            <h2 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
              {resultMsg}
            </h2>
            <p className="mt-1.5 text-[13.5px] text-[#3E4A5A] dark:text-gray-400">
              {percentage.toFixed(0)}% this round · {newAvg.toFixed(0)}% average over {quizStats.totalQuizzes + 1}{' '}
              {quizStats.totalQuizzes + 1 === 1 ? 'quiz' : 'quizzes'}
              {newStreak > 0 && ` · ${newStreak} perfect in a row`}
            </p>
          </div>
        </div>

        {missed.length > 0 && (
          <div className="kl-card mb-4 p-5 sm:p-6">
            <div className="mb-1 text-[12.5px] font-semibold" style={{ color: ACC.light }}>
              {missed.length} TO TIDY UP
            </div>
            <h3 className="font-display text-[19px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
              {missed.length === 1 ? 'One word slipped' : `${missed.length} words slipped`}
            </h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#3E4A5A] dark:text-gray-400">
              {/* Scaled from the real count — "about a minute" is a lie at eighteen words. */}
              A round of just these runs about {Math.max(1, Math.round(missed.length * 8 / 60))}{' '}
              {Math.max(1, Math.round(missed.length * 8 / 60)) === 1 ? 'minute' : 'minutes'} — worth more
              than reading them.
            </p>

            {/* Compact chips, not rows. A wall of failures is where people stop. */}
            <div className="mt-4 flex flex-wrap gap-2">
              {missed.map((q, i) => (
                <span
                  key={i}
                  className="kl-well inline-flex items-baseline gap-2 rounded-full px-3.5 py-2"
                  title={q.item.romanization}
                >
                  <span className="font-korean text-[15px] font-semibold text-[#16202F] dark:text-white">
                    {q.item.korean}
                  </span>
                  <span className="text-[12.5px] text-[#4A5566] dark:text-gray-400">{q.item.english}</span>
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => retryMissed(missed.map(q => q.item))}
                className="flex h-12 items-center rounded-[10px] px-5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
              >
                Practise just these {missed.length} →
              </button>
              <button
                onClick={() => saveMissedToDeck(missed.map(q => q.item))}
                disabled={savedToDeck}
                className="flex h-12 items-center gap-2 rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
              >
                {savedToDeck ? (
                  <><Check className="h-4 w-4" style={{ color: PINE }} /> Saved for review</>
                ) : (
                  'Save them for review'
                )}
              </button>
            </div>
            <p className="mt-2.5 text-[12.5px] text-[#4A5566] dark:text-gray-500">
              Saving puts them in a “{MISSES_DECK}” deck, so they come back on their own schedule.
            </p>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-3">
          <button
            onClick={restartQuiz}
            className={`flex h-12 items-center rounded-[10px] px-5 text-[15px] font-semibold transition-colors ${
              missed.length > 0
                ? 'border-[1.5px] border-[rgba(20,32,47,0.22)] text-[#16202F] hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200'
                : 'text-white'
            }`}
            style={missed.length === 0 ? { background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` } : undefined}
          >
            {missed.length > 0 ? 'A fresh quiz instead' : 'Another quiz →'}
          </button>
        </div>

        {/* Next-up chaining — momentum instead of re-deciding */}
        <NextUpCard exclude="quiz" />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const optionsAreKorean = currentQuestion.type !== 'korean_to_english';
  const answerIsKorean = currentQuestion.type !== 'korean_to_english';
  const answered = selectedAnswer !== null || timeLeft === 0;
  const timerUrgent = isTimedMode && timeLeft !== null && timeLeft <= 10;
  const streak = (() => {
    let n = 0;
    for (let i = currentQuestionIndex - 1; i >= 0; i--) { if (results[i]) n++; else break; }
    return n + (isCorrect ? 1 : 0);
  })();

  const QUIZ_MODES: { id: QuizMode; label: string; isPremium?: boolean }[] = [
    { id: 'mixed', label: 'Mixed' },
    { id: 'korean_to_english', label: 'KO → EN' },
    { id: 'english_to_korean', label: 'EN → KO', isPremium: !hasAdvancedQuizModes },
    { id: 'romanization_to_korean', label: 'Rom → KO', isPremium: !hasAdvancedQuizModes },
  ];

  // What is being asked, and the thing being asked ABOUT. The prompt used to be
  // a full sentence with the word buried in quote marks; the word itself is what
  // the learner needs to read, so it gets the size.
  const prompt = currentQuestion.type === 'korean_to_english'
    ? { label: 'CHOOSE THE ENGLISH MEANING', subject: currentQuestion.item.korean, sub: currentQuestion.item.romanization, korean: true }
    : currentQuestion.type === 'english_to_korean'
    ? { label: 'CHOOSE THE KOREAN', subject: currentQuestion.item.english, sub: null, korean: false }
    : { label: 'WHICH WORD SOUNDS LIKE THIS', subject: currentQuestion.item.romanization, sub: null, korean: false };

  const railCard = 'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
          Quiz
          <span className="text-[#4A5566] dark:text-gray-500"> · question {currentQuestionIndex + 1} of {questions.length}</span>
        </h1>
        <div className="flex flex-none items-center gap-3.5">
          {/* Motion here MEANS the clock is running: the hand only sweeps and the
              ring only drains while the timer is on. A hand sweeping on a switched-off
              timer would say time was passing when it was not. Off, the button is
              still obvious — it is tinted and says so — but it holds still. */}
          <button
            onClick={() => setIsTimedMode(!isTimedMode)}
            className={`flex h-11 items-center gap-2.5 rounded-[10px] border-[1.5px] px-4 text-[14px] font-semibold transition-colors ${
              isTimedMode ? 'text-white' : 'text-[#16202F] dark:text-gray-100'
            }`}
            style={isTimedMode
              ? { background: timerUrgent ? '#C13F22' : '#A8761F', borderColor: timerUrgent ? '#C13F22' : '#A8761F' }
              : { borderColor: '#A8761F80', background: '#A8761F14' }}
            title={isTimedMode ? 'Turn the timer off' : 'Turn the timer on'}
            aria-pressed={isTimedMode}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              {/* dial */}
              <circle
                cx="12" cy="12" r="9" fill="none" strokeWidth="2.2"
                stroke={isTimedMode ? 'rgba(255,255,255,0.35)' : '#A8761F'}
                strokeOpacity={isTimedMode ? 1 : 0.35}
              />
              {/* seconds remaining, draining */}
              {isTimedMode && (
                <circle
                  cx="12" cy="12" r="9" fill="none" stroke="#fff" strokeWidth="2.6"
                  strokeLinecap="round" transform="rotate(-90 12 12)"
                  strokeDasharray={2 * Math.PI * 9}
                  strokeDashoffset={2 * Math.PI * 9 * (1 - (timeLeft ?? 30) / 30)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              )}
              {/* the sweeping hand */}
              <line
                x1="12" y1="12" x2="12" y2="6.4"
                stroke={isTimedMode ? '#fff' : '#A8761F'}
                strokeWidth="2.2" strokeLinecap="round"
                className={isTimedMode ? 'kl-sweep kl-sweep-fast' : undefined}
              />
              <circle cx="12" cy="12" r="1.5" fill={isTimedMode ? '#fff' : '#A8761F'} />
            </svg>
            {isTimedMode ? `${timeLeft ?? 30}s` : 'Timer off'}
          </button>

          <span className="hidden items-center gap-2 sm:flex">
            <span className="relative flex h-[7px] w-[7px]">
              <span className="kl-pulse absolute inset-0 rounded-full" style={{ background: `${ACC.light}80` }} />
              <span className="relative h-[7px] w-[7px] rounded-full" style={{ background: ACC.light }} />
            </span>
            <span className="text-[13.5px] font-semibold text-[#16202F] dark:text-gray-200">Session live</span>
          </span>
          <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">
            {score}/{questions.length}
          </span>
        </div>
      </div>

      {/* Modes sit up here with the timer — both change the whole round, so they
          belong beside each other and out of the question's way. */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[12.5px] text-[#4A5566] dark:text-gray-500">Asking:</span>
        {QUIZ_MODES.map(({ id, label, isPremium }) => (
          <button
            key={id}
            onClick={() => !isPremium && setQuizMode(id)}
            disabled={!!isPremium}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] px-3.5 text-[12.5px] font-semibold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              quizMode === id
                ? 'text-white'
                : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
            }`}
            style={quizMode === id ? { background: ACC.light } : undefined}
          >
            {label}
            {isPremium && <Lock className="h-3 w-3" />}
          </button>
        ))}
        {subscriptionTier === 'free' && (
          <span className="ml-auto text-[12.5px] text-[#4A5566] dark:text-gray-500">
            {Math.max(0, dailyLimit - currentDailyCount)} quizzes left today
          </span>
        )}
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        {/* ── The question ── */}
        <div className="order-1 w-full min-w-0 flex-1">
          <div
            className="mb-4 flex items-start gap-3 rounded-r-lg border-l-[3px] px-4 py-3 sm:items-center"
            style={{ borderColor: ACC.light, background: `${ACC.light}14` }}
          >
            <span className="kl-accent flex-none whitespace-nowrap text-[12.5px] font-semibold"
                  style={{ ['--kl-acc' as string]: ACC.light, ['--kl-acc-dk' as string]: ACC.dark }}>
              DO THIS NEXT
            </span>
            <span className="text-[13.5px] leading-snug text-[#16202F] dark:text-gray-200">
              {isTimedMode
                ? `Answer before the timer runs out — ${timeLeft ?? 30}s left on this one.`
                : 'Pick the answer you think is right. Nothing is timed and a wrong one costs you nothing.'}
            </span>
          </div>

          <div className="kl-card p-6 sm:p-8">
            <div className="mb-3.5 text-[12.5px] font-semibold" style={{ color: ACC.light }}>
              {prompt.label}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <span className={`leading-none text-[#16202F] dark:text-white ${
                prompt.korean ? 'font-korean text-[44px] font-bold sm:text-[54px]' : 'font-display text-[32px] font-semibold sm:text-[38px]'
              }`}>
                {prompt.subject}
              </span>
              {prompt.sub && (
                <span className="text-[16px] text-[#4A5566] dark:text-gray-400">{prompt.sub}</span>
              )}
            </div>

            {/* Options, two columns, each with its letter */}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isAnswerCorrect = currentQuestion.answer === option;
                const showRight = answered && isAnswerCorrect;
                const showWrong = answered && isSelected && !isAnswerCorrect;
                const dimmed = answered && !isAnswerCorrect && !isSelected;

                return (
                  <button
                    key={`${currentQuestionIndex}-${index}`}
                    onClick={() => handleAnswer(option)}
                    disabled={answered}
                    className={`flex min-h-[64px] items-center gap-3.5 rounded-xl border-[1.5px] px-4 py-3 text-left transition-all disabled:cursor-default ${
                      showRight || showWrong ? '' : dimmed
                        ? 'border-[rgba(20,32,47,0.12)] opacity-45 dark:border-gray-800'
                        : 'border-[rgba(20,32,47,0.16)] hover:border-[rgba(20,32,47,0.32)] dark:border-gray-700 dark:hover:border-gray-500'
                    }`}
                    style={
                      showRight ? { borderColor: PINE, background: 'rgba(46,107,89,0.08)' }
                      : showWrong ? { borderColor: '#C13F22', background: 'rgba(193,63,34,0.07)' }
                      : undefined
                    }
                  >
                    <span
                      className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg text-[13px] font-semibold"
                      style={
                        showRight ? { background: PINE, color: '#fff' }
                        : showWrong ? { background: '#C13F22', color: '#fff' }
                        : { background: 'rgba(20,32,47,0.07)', color: '#16202F' }
                      }
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className={`min-w-0 flex-1 font-semibold text-[#16202F] dark:text-white ${
                      optionsAreKorean ? 'font-korean text-[18px]' : 'text-[17px]'
                    }`}>
                      {option}
                    </span>
                    {showRight && <span className="flex-none text-[13.5px] font-semibold" style={{ color: PINE }}>Correct</span>}
                    {showWrong && <span className="flex-none text-[13.5px] font-semibold text-[#C13F22]">Not this one</span>}
                  </button>
                );
              })}
            </div>

            {/* What the answer was, and why */}
            {answered && (
              <div className="mt-5">
                {isCorrect ? (
                  <div
                    className="rounded-r-lg border-l-[3px] px-4 py-3.5 text-[14.5px] font-semibold text-[#16202F] dark:text-gray-200"
                    style={{ borderColor: PINE, background: 'rgba(46,107,89,0.08)' }}
                  >
                    Right — {currentQuestion.item.korean} is {currentQuestion.item.english}.
                  </div>
                ) : (
                  <div
                    className="rounded-r-lg border-l-[3px] px-4 py-3.5"
                    style={{ borderColor: '#C13F22', background: 'rgba(193,63,34,0.07)' }}
                  >
                    <p className="text-[14.5px] text-[#16202F] dark:text-gray-200">
                      {timeLeft === 0 ? 'Time ran out. ' : ''}
                      The answer is{' '}
                      <strong className={`font-semibold ${answerIsKorean ? 'font-korean text-[17px]' : ''}`}>
                        {currentQuestion.answer}
                      </strong>.
                    </p>
                    {canAccess('detailedExplanations') ? (
                      <>
                        <button
                          onClick={() => setShowExplanation(!showExplanation)}
                          className="mt-2 text-[13px] font-semibold hover:underline"
                          style={{ color: ACC.light }}
                        >
                          {showExplanation ? 'Hide the word' : 'Show the whole word'}
                        </button>
                        {showExplanation && (
                          <div className="kl-well mt-2.5 rounded-lg px-3.5 py-3 text-[13.5px] text-[#3E4A5A] dark:text-gray-300">
                            <span className="font-korean text-[17px] font-bold text-[#16202F] dark:text-white">
                              {currentQuestion.item.korean}
                            </span>
                            <span className="ml-2.5 text-[#4A5566] dark:text-gray-500">{currentQuestion.item.romanization}</span>
                            <span className="ml-2.5">{currentQuestion.item.english}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="mt-2 text-[13px] text-[#4A5566] dark:text-gray-400">
                        <button onClick={openUpgradeModal} className="font-semibold hover:underline" style={{ color: ACC.light }}>
                          Premium
                        </button>{' '}
                        shows the full word with its romanization here.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* How far through — sits under the question, where the column used to
              run out of content long before the rail did. */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-[#4A5566] dark:text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">
                {Math.round((currentQuestionIndex / questions.length) * 100)}% through
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {questions.map((_, i) => {
                const r = results[i];
                const now = i === currentQuestionIndex;
                return (
                  <span
                    key={i}
                    className="flex h-8 min-w-[32px] flex-1 items-center justify-center rounded-lg text-[12px] font-semibold"
                    style={
                      r === true ? { background: PINE, color: '#fff' }
                      : r === false ? { background: '#C13F22', color: '#fff' }
                      : now ? { border: `1.5px solid ${ACC.light}`, background: `${ACC.light}24`, color: '#16202F' }
                      : { background: 'rgba(20,32,47,0.05)', color: '#4A5566' }
                    }
                    title={r === true ? 'Right' : r === false ? 'Wrong' : now ? 'Current' : 'Not yet'}
                  >
                    <span className={now ? 'dark:text-white' : r === null ? 'dark:text-gray-400' : ''}>{i + 1}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Move on */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">
              Press <strong className="font-semibold text-[#16202F] dark:text-gray-200">A–D</strong> to answer,{' '}
              <strong className="font-semibold text-[#16202F] dark:text-gray-200">Enter</strong> for the next one.
            </span>
            {answered && (
              <button
                onClick={handleNext}
                className="flex h-12 items-center rounded-[10px] px-5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
              >
                {currentQuestionIndex + 1 >= questions.length ? 'See how you did →' : 'Next question →'}
              </button>
            )}
          </div>
        </div>

        {/* ── Rail ── */}
        <div className="order-2 w-full flex-none lg:w-[290px]">
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Session</div>
            <div className="flex gap-5 text-[13.5px] text-[#4A5566] dark:text-gray-400">
              <span><strong className="font-semibold text-[#16202F] dark:text-white">{score}</strong> right</span>
              <span><strong className="font-semibold text-[#16202F] dark:text-white">{results.filter(r => r === false).length}</strong> wrong</span>
              <span><strong className="font-semibold" style={{ color: PINE }}>{streak}</strong> in a row</span>
            </div>
          </div>

          <div className={railCard}>
            <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Words you have seen</div>
            {currentQuestionIndex === 0 ? (
              <p className="text-[13px] text-[#4A5566] dark:text-gray-500">
                Each word appears here once you have answered it.
              </p>
            ) : (
              <div className="flex max-h-[300px] flex-col gap-2.5 overflow-y-auto">
                {questions.slice(0, currentQuestionIndex).map((q, i) => (
                  <div key={i} className="flex items-baseline gap-2 text-[15px]">
                    <span
                      className="flex-none text-[12px] font-semibold"
                      style={{ color: results[i] ? PINE : '#C13F22' }}
                    >
                      {results[i] ? '✓' : '✗'}
                    </span>
                    <span className="font-korean font-semibold text-[#16202F] dark:text-white">{q.item.korean}</span>
                    <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">{q.item.english}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticatedQuizSection;
