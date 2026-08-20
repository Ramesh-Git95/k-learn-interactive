
import type { Section } from './types';
import { grammarPatterns } from './data/koreanData';

export const SECTIONS: { id: Section; title: string; icon: string }[] = [
  { id: 'dashboard', title: 'Dashboard', icon: '📊' },
  { id: 'hangul', title: 'Hangul', icon: '한' },
  { id: 'vocabulary', title: 'Vocabulary', icon: '📚' },
  { id: 'grammar', title: 'Grammar', icon: '📝' },
  { id: 'phrases', title: 'Phrases', icon: '💬' },
  { id: 'culture', title: 'Culture', icon: '🎭' },
  { id: 'quiz', title: 'Quiz', icon: '🧠' },
  { id: 'conversation', title: 'Conversation', icon: '🤖' },
  { id: 'srs', title: 'Spaced Repetition', icon: '🔄' },
  { id: 'bookmarks', title: 'Bookmarks', icon: '⭐' },
  { id: 'profile', title: 'Profile', icon: '👤' },
  { id: 'topik', title: 'TOPIK Prep', icon: '📋' },
  { id: 'topik-test', title: 'Level Assessment', icon: '🎓' },
  { id: 'honorifics', title: 'Honorifics', icon: '🎭' },
  { id: 'culture-cards', title: 'Culture Cards', icon: '🌸' },
  { id: 'writing', title: 'Writing', icon: '✍️' },
  { id: 'typing', title: 'Typing Dojo', icon: '⌨️' },
  { id: 'kdrama', title: 'K-Drama', icon: '🎬' },
  { id: 'kpop',   title: 'K-Pop Lyrics', icon: '🎵' },
  { id: 'reading', title: 'Reading', icon: '📖' },
];

// Free-tier content caps shared between App.tsx (progress totals) and section components (rendering)
export const FREE_PHRASES_COUNT = 15;

// Grammar's free tier is the first 60% of the patterns; the rest need Premium
// (EnhancedGrammarSection gates them behind canAccess('advancedGrammar')).
//
// It lives here because the split was previously computed inside the section and
// nowhere else, so the landing page had to describe it from memory — and got it
// wrong, claiming all seven were free when two are not. Anything that states the
// number now reads it from the same place the gate does.
export const FREE_GRAMMAR_COUNT = Math.ceil(grammarPatterns.length * 0.6);
export const TOTAL_GRAMMAR_COUNT = grammarPatterns.length;

export const LS_THEME_KEY = 'k-learn-theme';
export const LS_BOOKMARKS_KEY = 'k-learn-bookmarks';
export const LS_PROGRESS_KEY = 'k-learn-progress';
