import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { vocabulary } from '../data/koreanData';
import type { QuizQuestion, VocabItem } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import Icon from './Icon';
import Tooltip from './Tooltip';

type QuizMode = 'korean_to_english' | 'english_to_korean' | 'romanization_to_korean' | 'mixed';

interface QuizStats {
  totalQuizzes: number;
  perfectScores: number;
  averageScore: number;
  streak: number;
  bestStreak: number;
}

interface EnhancedQuizSectionProps {
  progress: {[key: string]: boolean};
  toggleProgress: (key: string) => void;
}

const EnhancedQuizSection: React.FC<EnhancedQuizSectionProps> = ({ progress, toggleProgress }) => {
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
    totalQuizzes: 0,
    perfectScores: 0,
    averageScore: 0,
    streak: 0,
    bestStreak: 0
  });
  const [showExplanation, setShowExplanation] = useState(false);

  const isQuizCompleted = (quizIndex: number) => {
    return progress[`quiz_completed_${quizIndex}`] || false;
  };

  const handleQuizComplete = (quizIndex: number) => {
    toggleProgress(`quiz_completed_${quizIndex}`);
  };

  const generateQuestions = useCallback(() => {
    const shuffledVocab = [...allVocab].sort(() => 0.5 - Math.random());
    const quizItems = shuffledVocab.slice(0, 10);
    
    const newQuestions: QuizQuestion[] = quizItems.map(item => {
      let questionType: QuizQuestion['type'];
      
      if (quizMode === 'mixed') {
        const types: QuizQuestion['type'][] = ['korean_to_english', 'english_to_korean', 'romanization_to_korean'];
        questionType = types[Math.floor(Math.random() * types.length)];
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
        case 'korean_to_english':
        default:
          questionData = {
            question: `What is the meaning of "${item.korean}"?`,
            options: [item.english, ...wrongItems.map(v => v.english)].sort(() => 0.5 - Math.random()),
            answer: item.english,
            type: 'korean_to_english',
          };
          break;
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
  }, [allVocab, quizMode, isTimedMode]);

  useEffect(() => {
    generateQuestions();
  }, [generateQuestions]);

  // Timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || selectedAnswer) return;
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    if (timeLeft === 1) {
      // Time's up
      setSelectedAnswer('');
      setIsCorrect(false);
    }

    return () => clearTimeout(timer);
  }, [timeLeft, selectedAnswer]);

  const handleAnswer = (option: string) => {
    if (selectedAnswer || timeLeft === 0) return; 

    setSelectedAnswer(option);
    const correct = option === questions[currentQuestionIndex].answer;
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
    }
  };
  
  const handleNext = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
    setCurrentQuestionIndex(i => i + 1);
    setTimeLeft(isTimedMode ? 30 : null);
  };
  
  const restartQuiz = () => {
    generateQuestions();
  };

  const completeQuiz = () => {
    const finalScore = score / questions.length;
    const isPerfect = score === questions.length;
    
    // Track this quiz completion
    const quizIndex = quizStats.totalQuizzes;
    handleQuizComplete(quizIndex);
    
    setQuizStats(prev => ({
      totalQuizzes: prev.totalQuizzes + 1,
      perfectScores: prev.perfectScores + (isPerfect ? 1 : 0),
      averageScore: ((prev.averageScore * prev.totalQuizzes) + finalScore) / (prev.totalQuizzes + 1),
      streak: isPerfect ? prev.streak + 1 : 0,
      bestStreak: Math.max(prev.bestStreak, isPerfect ? prev.streak + 1 : prev.streak)
    }));
  };

  const QuizModeSelector = () => {
    const modes: { id: QuizMode, label: string, tooltip: string }[] = [
      { id: 'mixed', label: 'Mixed', tooltip: 'A variety of question types to test all aspects of your Korean knowledge. Keeps you on your toes!' },
      { id: 'korean_to_english', label: 'Korean → English', tooltip: 'Test your comprehension: see Korean words and choose their English meanings.' },
      { id: 'english_to_korean', label: 'English → Korean', tooltip: 'Test your recall: see English words and choose their Korean translations.' },
      { id: 'romanization_to_korean', label: 'Romanization → Korean', tooltip: 'Practice reading Hangul: see romanized pronunciation and choose the correct Korean characters.' },
    ];

    return (
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {modes.map(mode => (
          <Tooltip
            content={mode.tooltip}
            position="top"
            maxWidth="max-w-xs"
            trigger="hover"
          >
            <button
              key={mode.id}
              onClick={() => setQuizMode(mode.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                quizMode === mode.id
                  ? 'bg-pink-500 text-white shadow-md transform scale-105'
                  : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-pink-50/20 hover:scale-105'
              }`}
            >
              {mode.label}
            </button>
          </Tooltip>
        ))}
      </div>
    );
  };

  const completedQuizzes = Object.keys(progress).filter(key => 
    key.startsWith('quiz_completed_') && progress[key] === true
  ).length;

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-500 dark:border-pink-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-lg text-gray-900 dark:text-white">Loading quiz...</p>
      </div>
    );
  }

  if (currentQuestionIndex >= questions.length) {
    completeQuiz();
    const percentage = (score / questions.length) * 100;
    
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 text-center">
        <div className="max-w-3xl mx-auto">
          <div className={`text-4xl sm:text-5xl lg:text-6xl mb-4`}>
            {percentage >= 80 ? '🎉' : percentage >= 60 ? '👏' : '📚'}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-pink-500 dark:text-pink-400">Quiz Complete!</h1>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {score} / {questions.length}
            </p>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-6">
              {percentage >= 80 ? 'Excellent work!' : percentage >= 60 ? 'Good job!' : 'Keep practicing!'}
            </p>
            
            {/* Quiz Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <Tooltip
                content="Total number of quizzes you've completed. Each quiz helps build your Korean knowledge!"
                position="top"
                maxWidth="max-w-xs"
              >
                <div className="text-center">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-pink-500 dark:text-pink-400">{quizStats.totalQuizzes}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Quizzes</p>
                </div>
              </Tooltip>
              <Tooltip
                content="Quizzes where you got every question right. Perfect scores show you're really mastering the material!"
                position="top"
                maxWidth="max-w-xs"
              >
                <div className="text-center">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{quizStats.perfectScores}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Perfect Scores</p>
                </div>
              </Tooltip>
              <Tooltip
                content="Your overall quiz performance. Aim for steady improvement rather than perfection - consistent practice beats occasional cramming!"
                position="top"
                maxWidth="max-w-xs"
              >
                <div className="text-center">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{Math.round(quizStats.averageScore * 100)}%</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                </div>
              </Tooltip>
              <Tooltip
                content="Longest streak of perfect quiz scores. Streaks show consistent mastery and help build learning momentum!"
                position="top"
                maxWidth="max-w-xs"
              >
                <div className="text-center">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">{quizStats.bestStreak}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Best Streak</p>
                </div>
              </Tooltip>
            </div>
            
            <button 
              onClick={restartQuiz}
              className="bg-pink-500 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-pink-500/80 transition-colors font-medium w-full sm:w-auto touch-target"
            >
              Take Another Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-pink-500 dark:text-pink-400">Korean Quiz</h1>
        <div className="flex items-center space-x-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-sm text-gray-600 dark:text-gray-400">Completed: </span>
            <span className="font-semibold text-pink-500 dark:text-pink-400">
              {completedQuizzes}
            </span>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-sm text-gray-600 dark:text-gray-400">Current Score: </span>
            <span className="font-semibold text-pink-500 dark:text-pink-400">
              {score}/{questions.length}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Quiz Mode Selector */}
        <QuizModeSelector />

        {/* Timer Mode Toggle */}
        <div className="flex justify-center mb-8">
          <Tooltip
            content="Add time pressure to make the quiz more challenging! You'll have 30 seconds per question. Great for testing your instant recall abilities."
            position="top"
            maxWidth="max-w-sm"
          >
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isTimedMode}
                onChange={(e) => setIsTimedMode(e.target.checked)}
                className="w-5 h-5 text-pink-500 rounded focus:ring-pink-400"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                Timed Mode (30s per question)
              </span>
            </label>
          </Tooltip>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            {timeLeft !== null && (
              <span className={`font-medium ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
                Time: {timeLeft}s
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-pink-500 dark:bg-pink-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            {currentQuestion.question}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
                className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                  selectedAnswer === option
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : selectedAnswer && option === currentQuestion.answer
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-800 hover:border-pink-500 hover:bg-pink-50/10'
                } ${selectedAnswer ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="font-korean text-lg">{option}</span>
              </button>
            ))}
          </div>

          {selectedAnswer && (
            <div className="mt-8 text-center">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${
                isCorrect ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}>
                <Icon icon={isCorrect ? 'check' : 'close'} className="w-5 h-5" />
                <span className="font-medium">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              
              {!isCorrect && (
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Correct answer: <span className="font-korean font-medium">{currentQuestion.answer}</span>
                </p>
              )}
              
              <button
                onClick={handleNext}
                className="mt-6 bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-500/80 transition-colors font-medium"
              >
                {currentQuestionIndex + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedQuizSection;
