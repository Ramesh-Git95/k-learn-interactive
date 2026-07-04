import React from 'react';
import type { Section } from '../types';
import { SECTIONS } from '../constants';

interface BreadcrumbProps {
  currentSection: Section;
  setActiveSection: (section: Section) => void;
}

const Chevron = () => (
  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
  </svg>
);

const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentSection, setActiveSection }) => {
  // Single source of truth — SECTIONS covers every section with title + icon,
  // so new sections can never fall back to a "❓ raw-id" crumb again.
  const current = SECTIONS.find(s => s.id === currentSection);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 overflow-x-auto">
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
          <Chevron />
          <div className="flex items-center space-x-1 text-pink-500 dark:text-pink-400 font-medium whitespace-nowrap">
            <span>{current?.icon ?? '📄'}</span>
            <span className="truncate">{current?.title ?? currentSection}</span>
          </div>
        </>
      )}
    </nav>
  );
};

export default Breadcrumb;
