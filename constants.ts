
import type { Section } from './types';

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
  { id: 'typing', title: 'Typing Dojo', icon: '⌨️' },
  { id: 'kdrama', title: 'K-Drama', icon: '🎬' },
  { id: 'kpop',   title: 'K-Pop Lyrics', icon: '🎵' },
  { id: 'reading', title: 'Reading', icon: '📖' },
];

export const GUMROAD_URL = 'https://learnk.gumroad.com/l/klearn-lifetime';

export const LS_THEME_KEY = 'k-learn-theme';
export const LS_BOOKMARKS_KEY = 'k-learn-bookmarks';
export const LS_PROGRESS_KEY = 'k-learn-progress';
