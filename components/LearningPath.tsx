import React from 'react';
import type { Section } from '../types';
import Icon from './Icon';

interface LearningPathProps {
  currentSection: Section;
  setActiveSection: (section: Section) => void;
  progress: { [key: string]: boolean };
}

const LearningPath: React.FC<LearningPathProps> = ({ currentSection, setActiveSection, progress }) => {
  const learningSteps = [
    { 
      id: 'hangul' as Section, 
      title: 'Learn Hangul', 
      description: 'Master the Korean alphabet',
      icon: '🔤',
      difficulty: 'Beginner',
      estimatedTime: '1-2 hours'
    },
    { 
      id: 'vocabulary' as Section, 
      title: 'Build Vocabulary', 
      description: 'Learn essential Korean words',
      icon: '📚',
      difficulty: 'Beginner-Intermediate',
      estimatedTime: '2-4 hours'
    },
    { 
      id: 'phrases' as Section, 
      title: 'Common Phrases', 
      description: 'Practice everyday expressions',
      icon: '💬',
      difficulty: 'Intermediate',
      estimatedTime: '1-2 hours'
    },
    { 
      id: 'grammar' as Section, 
      title: 'Grammar Basics', 
      description: 'Understand sentence structure',
      icon: '📝',
      difficulty: 'Intermediate',
      estimatedTime: '2-3 hours'
    },
    {
      id: 'culture' as Section,
      title: 'Cultural Context',
      description: 'Learn about Korean culture',
      icon: '🎭',
      difficulty: 'All levels',
      estimatedTime: '30 minutes'
    },
    { 
      id: 'quiz' as Section, 
      title: 'Test Knowledge', 
      description: 'Quiz yourself on what you\'ve learned',
      icon: '🧠',
      difficulty: 'All levels',
      estimatedTime: '15-30 minutes'
    }
  ];

  const getStepStatus = (stepId: Section) => {
    if (stepId === currentSection) return 'current';
    if (progress[`section_${stepId}`]) return 'completed';
    
    // Check if previous steps are completed
    const stepIndex = learningSteps.findIndex(step => step.id === stepId);
    const previousStepsCompleted = learningSteps
      .slice(0, stepIndex)
      .every(step => progress[`section_${step.id}`]);
    
    return previousStepsCompleted ? 'available' : 'locked';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Beginner-Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Intermediate': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'All levels': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <span className="mr-2">🗺️</span>
        Your Learning Path
      </h2>
      
      <div className="space-y-4">
        {learningSteps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isLocked = status === 'locked';
          const isCurrent = status === 'current';
          const isCompleted = status === 'completed';
          
          return (
            <div
              key={step.id}
              className={`relative flex items-center p-4 rounded-lg border-2 transition-all duration-300 ${
                isLocked 
                  ? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-700/20 opacity-50 cursor-not-allowed'
                  : isCurrent
                  ? 'border-pink-500 dark:border-pink-500 bg-pink-50/10 dark:bg-pink-500/10 cursor-pointer shadow-md'
                  : isCompleted
                  ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 cursor-pointer hover:shadow-md'
                  : 'border-gray-300 dark:border-gray-800 hover:border-pink-200 dark:hover:border-pink-500 cursor-pointer hover:shadow-md'
              }`}
              onClick={() => !isLocked && setActiveSection(step.id)}
            >
              {/* Step Number/Status */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                isCompleted 
                  ? 'bg-green-500 text-white'
                  : isCurrent
                  ? 'bg-pink-500 dark:bg-pink-500 text-white'
                  : isLocked
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                  : 'bg-gray-200 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
              }`}>
                {isCompleted ? <Icon icon="check" className="w-4 h-4" /> : index + 1}
              </div>

              {/* Step Content */}
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-lg font-semibold ${
                    isLocked ? 'text-gray-400 dark:text-gray-400/50' : 'text-gray-900 dark:text-white'
                  }`}>
                    <span className="mr-2">{step.icon}</span>
                    {step.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(step.difficulty)}`}>
                      {step.difficulty}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-1 bg-pink-500 dark:bg-pink-500 text-white text-xs rounded-full animate-pulse-gentle">
                        Current
                      </span>
                    )}
                  </div>
                </div>
                <p className={`text-sm mb-2 ${
                  isLocked ? 'text-gray-400 dark:text-gray-400/50' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {step.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${
                    isLocked ? 'text-gray-400 dark:text-gray-400/50' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    ⏱️ {step.estimatedTime}
                  </span>
                  {!isLocked && !isCurrent && (
                    <span className="text-xs text-pink-500 dark:text-pink-400 hover:underline">
                      {isCompleted ? 'Review' : 'Start'} →
                    </span>
                  )}
                </div>
              </div>

              {/* Connection Line */}
              {index < learningSteps.length - 1 && (
                <div className={`absolute left-7 top-full w-0.5 h-4 ${
                  isCompleted ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-700'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningPath;
