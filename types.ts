export type Section = 'dashboard' | 'hangul' | 'vocabulary' | 'grammar' | 'phrases' | 'culture' | 'quiz' | 'conversation' | 'bookmarks' | 'srs' | 'profile' | 'cookie-demo' | 'topik' | 'honorifics' | 'culture-cards' | 'typing' | 'kdrama' | 'kpop' | 'topik-test' | 'reading';

export interface HangulCharacter {
  char: string;
  romanization: string;
  type: 'consonant' | 'vowel';
}

export interface VocabExample {
  korean: string;
  english: string;
  romanization?: string;
}

export interface VocabItem {
  korean: string;
  romanization: string;
  english: string;
  audioSrc?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  examples?: VocabExample[];
}

export interface VocabCategory {
  name: string;
  items: VocabItem[];
  description?: string;
}

export interface GrammarPattern {
  pattern: string;
  explanation: string;
  examples: {
    korean: string;
    english: string;
  }[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface PhraseItem {
  korean: string;
  romanization: string;
  english: string;
  context: string;
  formality?: 'casual' | 'polite' | 'formal';
}

export interface CultureTip {
  title: string;
  content: string;
  icon: string;
  category?: string;
}

export type Bookmark = VocabItem | PhraseItem;

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  item: VocabItem;
  type: 'korean_to_english' | 'english_to_korean' | 'romanization_to_korean';
}

export interface UserProgress {
  [key: string]: boolean | number | Date | string[];
  totalStudyTime?: number;
  lastActiveDate?: Date;
  completedSections?: string[];
  streakDays?: number;
}

export interface StudySession {
  date: Date;
  section: Section;
  timeSpent: number;
  itemsStudied: number;
  correctAnswers?: number;
  totalQuestions?: number;
}

export interface KoreanRegion {
  id: string;
  name: string;
  nameKorean: string;
  description: string;
  coordinates: { x: number; y: number };
  color: string;
  population: string;
  keyFeatures: string[];
  attractions: {
    name: string;
    nameKorean: string;
    type: string;
  }[];
  specialFoods: {
    name: string;
    nameKorean: string;
    description: string;
  }[];
  culturalNotes: string[];
  languageNotes: string[];
  travelTips: string[];
  bestTimeToVisit: string;
  climate: string;
}

export interface DailyLifeTopic {
  id: string;
  title: string;
  titleKorean: string;
  icon: string;
  description: string;
  sections: DailyLifeSection[];
}

export interface DailyLifeSection {
  id: string;
  title: string;
  content: string;
  tips: string[];
  vocabulary?: VocabItem[];
  phrases?: PhraseItem[];
  culturalNotes?: string[];
  examples?: {
    situation: string;
    korean: string;
    romanization: string;
    english: string;
  }[];
}
