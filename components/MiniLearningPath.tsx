import React, { useState } from 'react';
import type { Section } from '../types';
import Icon from './Icon';

interface MiniLearningPathProps {
  currentSection: Section;
  setActiveSection: (section: Section) => void;
  progress: { [key: string]: boolean };
  getSectionTotalItems: (section: Section) => number;
  getSectionCompletedItems: (section: Section) => number;
}

const MiniLearningPath: React.FC<MiniLearningPathProps> = ({ 
  currentSection, 
  setActiveSection, 
  progress, 
  getSectionTotalItems, 
  getSectionCompletedItems 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const learningSteps = [
    { id: 'hangul' as Section, title: 'Hangul', icon: '🔤', shortTitle: 'H' },
    { id: 'vocabulary' as Section, title: 'Vocabulary', icon: '📚', shortTitle: 'V' },
    { id: 'phrases' as Section, title: 'Phrases', icon: '💬', shortTitle: 'P' },
    { id: 'grammar' as Section, title: 'Grammar', icon: '📝', shortTitle: 'G' },
    { id: 'culture' as Section, title: 'Culture', icon: '🏛️', shortTitle: 'C' },
    { id: 'quiz' as Section, title: 'Quiz', icon: '🧠', shortTitle: 'Q' }
  ];

  const getStepStatus = (stepId: Section) => {
    if (stepId === currentSection) return 'current';
    
    // Check if section is completed based on actual progress
    const totalItems = getSectionTotalItems(stepId);
    const completedItems = getSectionCompletedItems(stepId);
    const isCompleted = totalItems > 0 && completedItems >= totalItems;
    
    if (isCompleted) return 'completed';
    
    const stepIndex = learningSteps.findIndex(step => step.id === stepId);
    const previousStepsCompleted = learningSteps
      .slice(0, stepIndex)
      .every(step => {
        const prevTotal = getSectionTotalItems(step.id);
        const prevCompleted = getSectionCompletedItems(step.id);
        return prevTotal > 0 && prevCompleted >= prevTotal;
      });
    
    return previousStepsCompleted ? 'available' : 'locked';
  };

  const completedCount = learningSteps.filter(step => {
    const totalItems = getSectionTotalItems(step.id);
    const completedItems = getSectionCompletedItems(step.id);
    return totalItems > 0 && completedItems >= totalItems;
  }).length;
  const progressPercentage = (completedCount / learningSteps.length) * 100;

  if (!isExpanded) {
    // Compact horizontal progress bar
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-2 sm:p-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
            <span className="text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">
              Progress
            </span>
            <div className="flex items-center space-x-0.5 sm:space-x-1 overflow-x-auto">
              {learningSteps.map(step => {
                const status = getStepStatus(step.id);
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveSection(step.id)}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs font-bold transition-all duration-200 flex-shrink-0 touch-target ${
                      status === 'completed' 
                        ? 'bg-green-500 text-white'
                        : status === 'current'
                        ? 'bg-pink-500 dark:bg-pink-500 text-white ring-2 ring-pink-200 dark:ring-pink-500/50'
                        : status === 'available'
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-pink-50/50 dark:hover:bg-pink-500/30'
                        : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={status === 'locked'}
                    title={step.title}
                  >
                    <span className="text-xs">{status === 'completed' ? '✓' : step.shortTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {completedCount}/{learningSteps.length}
            </span>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-pink-500 dark:text-pink-400 hover:bg-pink-50/20 dark:hover:bg-pink-500/20 rounded p-1 transition-colors touch-target"
              title="Expand learning path"
            >
              <Icon icon="menu" className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-2">
          <div 
            className={`h-1 rounded-full transition-all duration-500 ${
              progressPercentage >= 100 ? 'bg-green-500' : 'bg-pink-500 dark:bg-pink-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">🗺️</span>
          <span className="hidden sm:inline">Learning Path</span>
          <span className="sm:hidden">Path</span>
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors p-2 touch-target"
        >
          <Icon icon="close" className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {learningSteps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isLocked = status === 'locked';
          const isCurrent = status === 'current';
          const isCompleted = status === 'completed';
          
          return (
            <button
              key={step.id}
              className={`relative p-2 sm:p-3 rounded-lg text-center transition-all duration-300 touch-target ${
                isLocked 
                  ? 'bg-gray-100 dark:bg-gray-700/30 text-gray-400 dark:text-gray-400 opacity-50 cursor-not-allowed'
                  : isCurrent
                  ? 'bg-pink-500 dark:bg-pink-500 text-white shadow-md transform scale-105'
                  : isCompleted
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:scale-105'
                  : 'bg-gray-50 dark:bg-gray-700/20 text-gray-900 dark:text-white hover:bg-pink-50/20 dark:hover:bg-pink-500/20 hover:scale-105'
              }`}
              onClick={() => !isLocked && setActiveSection(step.id)}
              disabled={isLocked}
            >
              <div className={`text-lg sm:text-2xl mb-1 ${isCurrent ? 'animate-pulse-gentle' : ''}`}>
                {step.icon}
              </div>
              <div className={`text-xs font-medium truncate leading-tight ${
                isCurrent ? 'text-white' : 
                isCompleted ? 'text-green-800 dark:text-green-200' : 
                isLocked ? 'text-gray-400 dark:text-gray-400' :
                'text-gray-900 dark:text-white'
              }`}>
                {step.title}
              </div>
              {isCompleted && (
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Icon icon="check" className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniLearningPath;
