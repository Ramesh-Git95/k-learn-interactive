import React from 'react';
import type { Section } from '../types';
import { SECTIONS } from '../constants';
import { accentFor } from '../utils/moduleAccent';

interface BreadcrumbProps {
  currentSection: Section;
  setActiveSection: (section: Section) => void;
}

// First crumb = where this section lives in the nav: the mega-menu group for
// grouped sections, "Home" for a primary tab, "Account" for profile/cookies.
const groupOf = (s: Section): string => {
  if (['hangul', 'vocabulary', 'conversation'].includes(s)) return 'Home';
  if (['grammar', 'phrases', 'topik', 'honorifics', 'topik-test'].includes(s)) return 'Learn';
  if (['quiz', 'typing', 'srs', 'bookmarks', 'reading', 'writing'].includes(s)) return 'Practice';
  if (['culture', 'culture-cards', 'kdrama', 'kpop'].includes(s)) return 'Culture';
  if (['profile', 'cookie-settings'].includes(s)) return 'Account';
  return 'Home';
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentSection, setActiveSection }) => {
  // The dashboard is the home surface — no breadcrumb there (clarity spec).
  if (currentSection === 'dashboard') return null;

  const current = SECTIONS.find(s => s.id === currentSection);
  const group = groupOf(currentSection);
  const accent = accentFor(currentSection);

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 overflow-x-auto text-[12.5px]">
      {group === 'Home' ? (
        <button
          onClick={() => setActiveSection('dashboard')}
          className="shrink-0 whitespace-nowrap font-medium text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200"
        >
          Home
        </button>
      ) : (
        <span className="shrink-0 whitespace-nowrap font-medium text-[#4A5566] dark:text-gray-400">{group}</span>
      )}

      <span className="shrink-0 text-[#4A5566]/50 dark:text-gray-600">/</span>

      <span
        className="kl-accent whitespace-nowrap truncate font-semibold"
        style={{ ['--kl-acc' as string]: accent.light, ['--kl-acc-dk' as string]: accent.dark }}
      >
        {current?.title ?? currentSection}
      </span>
    </nav>
  );
};

export default Breadcrumb;
