import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { vocabulary } from '../data/koreanData';
import type { QuizQuestion } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PremiumLockBanner } from './PremiumLock';
import NextUpCard from './NextUpCard';
import { useDailyActivity } from '../hooks/useDailyActivity';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import { QuizSkeleton } from './Skeleton';

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-md mx-auto">
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-6 p-6 sm:p-8 text-center"
        style={{ background: 'var(--brand-gradient-hero)' }}
      >
        <div className="text-5xl mb-3">🧠</div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">Sign in to take the quiz</h1>
        <p className="text-white/80 text-sm">
          Quiz scores and stats are saved to your account
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-3">
        <button
          onClick={() => openAuth('register')}
          className="w-full py-3 text-white font-black rounded-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm"
          style={{ background: 'var(--brand-gradient)' }}
        >
          🚀 Create a free account
        </button>
        <button
          onClick={() => openAuth('login')}
          className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm"
        >
          Log in
        </button>
      </div>

      <div className="mt-5 p-4 rounded-2xl bg-[#EEF5F1] dark:bg-[#153327]/20 border border-[#BFDACD] dark:border-[#1D4436]/40">
        <p className="text-xs font-black text-[#265847] dark:text-[#93C2AE] mb-2 uppercase tracking-wider">Why sign up?</p>
        <ul className="text-xs text-[#2E6B59] dark:text-[#6BA88F] space-y-1">
          {['Save quiz scores & progress', 'Track your learning streaks', 'Sync across devices', 'Access detailed statistics'].map(b => (
            <li key={b}>✅ {b}</li>
          ))}
        </ul>
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
  const allVocab = useMemo(() => vocabulary.flatMap(cat => cat.items), []);

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

  const currentDailyCount = dailyActivity.quizzesTaken;
  const dailyLimit = getLimit('quizzesPerDay') as number;
  const hasReachedDailyLimit = hasReachedLimit('quizzesPerDay', currentDailyCount);
  const maxQuestions = getLimit('quizQuestionsPerSession') as number;
  // Derive a stable boolean — canAccess is a new function reference on every
  // render, so referencing it directly in deps causes an infinite render loop.
  const hasAdvancedQuizModes = canAccess('advancedQuizModes');

  const generateQuestions = useCallback(() => {
    const shuffledVocab = [...allVocab].sort(() => 0.5 - Math.random());
    const questionCount = maxQuestions;
    const quizItems = shuffledVocab.slice(0, questionCount);

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
  }, [allVocab, quizMode, isTimedMode, maxQuestions, hasAdvancedQuizModes]);

  const handleAnswer = useCallback((option: string) => {
    if (selectedAnswer || timeLeft === 0) return;
    setSelectedAnswer(option);
    const correct = option === questions[currentQuestionIndex].answer;
    setIsCorrect(correct);
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
    if (timeLeft === 1) { setSelectedAnswer(''); setIsCorrect(false); }
    return () => clearTimeout(timer);
  }, [timeLeft, selectedAnswer]);

  useEffect(() => {
    if (currentQuestionIndex >= questions.length && questions.length > 0 && !quizCompleted) {
      completeQuiz();
    }
  }, [currentQuestionIndex, questions.length, quizCompleted, completeQuiz]);

  // Daily limit screen
  if (subscriptionTier === 'free' && hasReachedDailyLimit) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div
          className="rounded-3xl overflow-hidden mb-6 p-6 text-center"
          style={{ background: 'var(--brand-gradient-hero)' }}
        >
          <div className="text-4xl mb-2">⏰</div>
          <h2 className="text-xl font-black text-white mb-1">Daily Limit Reached</h2>
          <p className="text-white/80 text-sm">You've used {currentDailyCount}/{dailyLimit} quizzes today</p>
        </div>
        <div className="mb-5 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: '100%', background: 'linear-gradient(90deg, #EF4444, #DC2626)' }} />
        </div>
        <PremiumLockBanner
          title="Daily Quiz Limit Reached"
          description="Upgrade to Premium for unlimited daily quizzes, advanced question modes, and longer sessions."
        />
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
    const resultEmoji = percentage === 100 ? '🏆' : percentage >= 80 ? '🎉' : percentage >= 60 ? '👏' : '📚';
    const resultColor = percentage === 100 ? '#22C55E' : percentage >= 80 ? '#24476B' : percentage >= 60 ? '#F59E0B' : '#F97316';
    const resultMsg = percentage === 100 ? 'Perfect score!' : percentage >= 80 ? 'Excellent work!' : percentage >= 60 ? 'Good job! Keep going!' : 'Keep studying!';

    // quizStats.averageScore is stored as a 0-1 fraction; convert to 0-100 to combine with percentage
    const newAvg = ((quizStats.averageScore * 100 * quizStats.totalQuizzes + percentage) / (quizStats.totalQuizzes + 1));
    const newStreak = percentage === 100 ? quizStats.streak + 1 : 0;

    const stats = [
      { label: 'Score', value: `${score}/${questions.length}`, color: resultColor },
      { label: 'Percentage', value: `${percentage.toFixed(0)}%`, color: '#3F8571' },
      { label: 'Total Quizzes', value: quizStats.totalQuizzes + 1, color: '#2F5D8A' },
      { label: 'Avg Score', value: `${newAvg.toFixed(0)}%`, color: '#E4572E' },
      { label: 'Perfect Scores', value: quizStats.perfectScores + (percentage === 100 ? 1 : 0), color: '#F59E0B' },
      { label: 'Streak', value: newStreak, color: '#22C55E' },
    ];

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Result hero */}
        <div
          className="relative rounded-3xl overflow-hidden mb-8 p-8 text-center"
          style={{ background: 'var(--brand-gradient-hero)' }}
        >
          <div className="text-6xl mb-3">{resultEmoji}</div>
          <h1 className="text-3xl font-black text-white mb-1">Quiz Complete!</h1>
          <p className="text-white/80 text-base font-bold">{resultMsg}</p>
          {/* Big score */}
          <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-3">
            <span className="text-4xl font-black text-white">{score}/{questions.length}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 text-center">
              <div className="text-2xl font-black mb-1" style={{ color }}>{value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={restartQuiz}
            className="flex-1 py-3 font-black rounded-xl btn-brand"
          >
            🔄 Play Again
          </button>
          <button
            onClick={() => setIsTimedMode(!isTimedMode)}
            className="flex-1 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            {isTimedMode ? '⏸ Disable Timer' : '⏱ Enable Timer'}
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
  const progressPct = ((currentQuestionIndex) / questions.length) * 100;

  const QUIZ_MODES: { id: QuizMode; label: string; emoji: string; isPremium?: boolean }[] = [
    { id: 'mixed', label: 'Mixed', emoji: '🔀' },
    { id: 'korean_to_english', label: 'KO → EN', emoji: '🇰🇷' },
    { id: 'english_to_korean', label: 'EN → KO', emoji: '🔤', isPremium: !hasAdvancedQuizModes },
    { id: 'romanization_to_korean', label: 'Rom → KO', emoji: '🔡', isPremium: !hasAdvancedQuizModes },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-6 p-5 sm:p-6"
        style={{ background: 'var(--brand-gradient-hero)' }}
      >
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {['퀴즈','한국어','점수','연습'].map((w, i) => (
            <span key={i} className="absolute text-white/10 font-black" style={{ fontSize: `${1.2 + (i % 2) * 0.5}rem`, top: `${(i * 37) % 85}%`, left: `${(i * 43) % 80}%` }}>{w}</span>
          ))}
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">🧠</span>
              <h1 className="text-xl sm:text-2xl font-black text-white">Vocabulary Quiz</h1>
            </div>
            <p className="text-white/80 text-xs">
              {subscriptionTier === 'free'
                ? `Free Plan · ${maxQuestions} questions · ${dailyLimit - currentDailyCount} quizzes left today`
                : `Premium · ${maxQuestions} questions · unlimited`}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 text-center">
            <div className="text-2xl font-black text-white">{score}/{questions.length}</div>
            <div className="text-[10px] text-white/70">score</div>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {QUIZ_MODES.map(({ id, label, emoji, isPremium }) => {
          const locked = isPremium;
          const active = quizMode === id;
          return (
            <button
              key={id}
              onClick={() => !locked && setQuizMode(id)}
              disabled={!!locked}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                active
                  ? 'tab-brand-active'
                  : locked
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:scale-105'
              }`}
            >
              {emoji} {label} {locked && '🔒'}
            </button>
          );
        })}
        <button
          onClick={() => setIsTimedMode(!isTimedMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ml-auto ${
            isTimedMode
              ? 'bg-orange-500 text-white border-transparent'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:scale-105'
          }`}
        >
          ⏱ {isTimedMode ? 'Timed ON' : 'Timed OFF'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progressPct)}% complete</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: 'var(--brand-gradient-h)' }}
          />
        </div>
      </div>

      {/* Timer */}
      {isTimedMode && timeLeft !== null && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Time Left</span>
            <span className={`font-black ${timeLeft <= 10 ? 'text-red-500' : 'text-[#E4572E]'}`}>{timeLeft}s</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${(timeLeft / 30) * 100}%`,
                background: timeLeft <= 10 ? 'linear-gradient(90deg,#EF4444,#DC2626)' : 'linear-gradient(90deg,#F59E0B,#E4572E)',
              }}
            />
          </div>
        </div>
      )}

      {/* Question card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-4">
        {/* Type badge */}
        <div className="px-5 pt-4 pb-2 border-b border-gray-50 dark:border-gray-800 flex items-center gap-2">
          <span
            className="text-[10px] font-black px-2.5 py-0.5 rounded-full badge-brand"
          >
            {currentQuestion.type === 'korean_to_english' ? '🇰🇷 Korean → English'
              : currentQuestion.type === 'english_to_korean' ? '🔤 English → Korean'
              : '🔡 Romanization → Korean'}
          </span>
        </div>

        {/* Question text */}
        <div className="px-5 py-6 text-center">
          <p className={`text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-snug ${
            currentQuestion.type === 'korean_to_english' ? 'text-4xl' : ''
          }`}>
            {currentQuestion.question}
          </p>
        </div>

        {/* Options */}
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isAnswerCorrect = currentQuestion.answer === option;
            const answered = !!selectedAnswer || timeLeft === 0;

            let bg = 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white';
            let border = 'border border-gray-200 dark:border-gray-700';
            let scale = 'hover:scale-[1.02]';

            if (answered) {
              if (isSelected && isCorrect) { bg = 'bg-green-500 text-white'; border = 'border border-green-500'; scale = 'scale-[1.02]'; }
              else if (isSelected && !isCorrect) { bg = 'bg-red-500 text-white'; border = 'border border-red-500'; scale = 'scale-[1.02]'; }
              else if (isAnswerCorrect) { bg = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'; border = 'border-2 border-green-500'; scale = ''; }
              else { bg = 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-50'; border = 'border border-gray-200 dark:border-gray-700'; scale = ''; }
            }

            return (
              <button
                key={`${currentQuestionIndex}-${index}`}
                onClick={() => handleAnswer(option)}
                disabled={answered}
                className={`w-full p-3.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed ${bg} ${border} ${scale} ${optionsAreKorean ? 'text-base' : ''}`}
              >
                {option}
                {answered && isAnswerCorrect && <span className="ml-2 font-black">✓</span>}
                {answered && isSelected && !isAnswerCorrect && <span className="ml-2 font-black">✗</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {(selectedAnswer !== null || timeLeft === 0) && (
        <div className={`rounded-2xl border p-4 mb-4 ${
          isCorrect
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <p className={`text-base font-black mb-1 ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {isCorrect ? '✅ Correct!' : timeLeft === 0 ? "⏰ Time's up!" : '❌ Not quite!'}
          </p>

          {!isCorrect && (
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Correct answer:{' '}
                <span className={`font-black ${answerIsKorean ? 'text-lg' : ''}`}>{currentQuestion.answer}</span>
              </p>
              {canAccess('detailedExplanations') ? (
                <>
                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="text-xs font-bold text-[#E4572E] dark:text-[#F07A55] hover:underline"
                  >
                    {showExplanation ? '▲ Hide' : '▼ Show'} explanation
                  </button>
                  {showExplanation && (
                    <div className="mt-2 p-3 bg-white/60 dark:bg-gray-900/60 rounded-xl text-xs space-y-1">
                      <p><span className="font-bold text-gray-500">Korean:</span> <span className="font-black text-gray-900 dark:text-white text-sm">{currentQuestion.item.korean}</span></p>
                      <p><span className="font-bold text-gray-500">Romanization:</span> {currentQuestion.item.romanization}</p>
                      <p><span className="font-bold text-gray-500">English:</span> {currentQuestion.item.english}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-2 p-2.5 bg-[#EEF5F1] dark:bg-[#153327]/20 rounded-xl text-xs">
                  <p className="text-[#265847] dark:text-[#93C2AE]">
                    🔒 Detailed explanations available with{' '}
                    <button onClick={openUpgradeModal} className="font-black underline">Premium</button>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Next button */}
      {(selectedAnswer !== null || timeLeft === 0) && (
        <button
          onClick={handleNext}
          className="w-full py-3.5 font-black rounded-xl btn-brand"
        >
          {currentQuestionIndex + 1 >= questions.length ? '🏁 See Results' : 'Next Question →'}
        </button>
      )}
    </div>
  );
};

export default AuthenticatedQuizSection;
