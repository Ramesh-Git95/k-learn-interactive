import React from 'react';
import type { Section } from '../types';
import Icon from './Icon';

interface BreadcrumbProps {
  currentSection: Section;
  setActiveSection: (section: Section) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentSection, setActiveSection }) => {
  const sectionInfo = {
    dashboard: { title: 'Dashboard', icon: '🏠' },
    hangul: { title: 'Hangul', icon: '🔤' },
    vocabulary: { title: 'Vocabulary', icon: '📚' },
    grammar: { title: 'Grammar', icon: '📝' },
    phrases: { title: 'Phrases', icon: '💬' },
    culture: { title: 'Culture', icon: '🏛️' },
    quiz: { title: 'Quiz', icon: '🧠' },
    conversation: { title: 'Conversation', icon: '🤖' },
    bookmarks: { title: 'Bookmarks', icon: '📌' }
  };

  const current = sectionInfo[currentSection];

  // Safety check to prevent errors if section is not defined
  if (!current) {
    return (
      <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <button
          onClick={() => setActiveSection('dashboard')}
          className="flex items-center space-x-1 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
        >
          <span>🏠</span>
          <span>Dashboard</span>
        </button>
        <Icon icon="close" className="w-3 h-3 rotate-45 text-gray-400" />
        <div className="flex items-center space-x-1 text-pink-500 dark:text-pink-400 font-medium">
          <span>❓</span>
          <span>{currentSection}</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 overflow-x-auto">
      <button
        onClick={() => setActiveSection('dashboard')}
        className="flex items-center space-x-1 hover:text-pink-500 dark:hover:text-pink-400 transition-colors whitespace-nowrap touch-target"
      >
        <span>🏠</span>
        <span className="hidden sm:inline">Dashboard</span>
        <span className="sm:hidden">Home</span>
      </button>
      
      {currentSection !== 'dashboard' && (
        <>
          <Icon icon="close" className="w-2 h-2 sm:w-3 sm:h-3 rotate-45 text-gray-400 flex-shrink-0" />
          <div className="flex items-center space-x-1 text-pink-500 dark:text-pink-400 font-medium whitespace-nowrap">
            <span>{current.icon}</span>
            <span className="truncate">{current.title}</span>
          </div>
        </>
      )}
    </nav>
  );
};

export default Breadcrumb;
