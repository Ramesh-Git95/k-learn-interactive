import React, { useState, useEffect } from 'react';
import type { Section } from '../types';
import Icon from './Icon';

interface FloatingProgressProps {
  progress: { [key: string]: boolean };
  activeSection: Section;
  getSectionTotalItems: (section: Section) => number;
  getSectionCompletedItems: (section: Section) => number;
}

const FloatingProgress: React.FC<FloatingProgressProps> = ({ 
  progress, 
  activeSection, 
  getSectionTotalItems, 
  getSectionCompletedItems 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getOverallProgress = () => {
    const sections: Section[] = ['hangul', 'vocabulary', 'grammar', 'phrases', 'culture', 'quiz'];
    let totalItems = 0;
    let completedItems = 0;
    
    sections.forEach(section => {
      totalItems += getSectionTotalItems(section);
      completedItems += getSectionCompletedItems(section);
    });
    
    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  };

  const getSectionProgress = (section: Section) => {
    const total = getSectionTotalItems(section);
    const completed = getSectionCompletedItems(section);
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const overallProgress = getOverallProgress();
  const radius = isMobile ? 16 : 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * overallProgress) / 100;

  const sections = [
    { id: 'hangul' as Section, name: 'Hangul', icon: '🔤' },
    { id: 'vocabulary' as Section, name: 'Vocabulary', icon: '📚' },
    { id: 'grammar' as Section, name: 'Grammar', icon: '📝' },
    { id: 'phrases' as Section, name: 'Phrases', icon: '💬' },
    { id: 'culture' as Section, name: 'Culture', icon: '🎭' },
    { id: 'quiz' as Section, name: 'Quiz', icon: '🧠' }
  ];

  if (activeSection === 'dashboard') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 w-80 sm:w-96 max-w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Learning Progress
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors touch-target"
            >
              <Icon icon="close" className="w-5 h-5" />
            </button>
          </div>
          
          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-white">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-pink-500 dark:text-pink-400">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-pink-500 dark:bg-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Section Progress */}
          <div className="space-y-3">
            {sections.map(section => {
              const sectionProgress = getSectionProgress(section.id);
              const isActive = activeSection === section.id;
              
              return (
                <div 
                  key={section.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-pink-50/20 dark:bg-pink-500/20 border border-pink-500/30' 
                      : 'bg-gray-50 dark:bg-gray-950/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{section.icon}</span>
                    <span className={`text-sm font-medium ${
                      isActive 
                        ? 'text-pink-500 dark:text-pink-400' 
                        : 'text-gray-700 dark:text-white'
                    }`}>
                      {section.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          sectionProgress >= 100 
                            ? 'bg-green-500' 
                            : isActive 
                              ? 'bg-pink-500 dark:bg-pink-500' 
                              : 'bg-gray-400'
                        }`}
                        style={{ width: `${sectionProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8 text-right">
                      {Math.round(sectionProgress)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative bg-pink-500 dark:bg-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 touch-target ${
          isMobile ? 'w-12 h-12' : 'w-16 h-16'
        } ${isExpanded ? 'scale-110' : 'hover:scale-105'}`}
      >
        {/* Progress Ring */}
        <svg 
          className="absolute inset-0 w-full h-full -rotate-90" 
          viewBox={`0 0 ${(radius + 4) * 2} ${(radius + 4) * 2}`}
        >
          {/* Background Ring */}
          <circle
            cx={radius + 4}
            cy={radius + 4}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          {/* Progress Ring */}
          <circle
            cx={radius + 4}
            cy={radius + 4}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        
        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          <Icon 
            icon={isExpanded ? 'close' : 'chart'} 
            className={isMobile ? 'w-5 h-5' : 'w-6 h-6'}
          />
        </div>
        
        {/* Progress Text */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <span className="text-xs font-medium bg-white dark:bg-gray-900 text-pink-500 dark:text-pink-400 px-2 py-1 rounded-full shadow-sm whitespace-nowrap">
            {Math.round(overallProgress)}%
          </span>
        </div>
      </button>
    </div>
  );
};

export default FloatingProgress;
