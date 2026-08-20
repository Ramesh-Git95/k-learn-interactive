// What the free plan includes, in one place.
//
// The paywall has to state these numbers, and until now it held its own
// hardcoded copy of them — which is how the landing page came to claim all
// seven grammar patterns were free when two are not. Anything that describes
// the plan should read from here.
//
// Counts are computed from the shipped content wherever the content is
// importable. Where a limit lives inside a component (a category name, a
// duration), the value is written out with the file it was checked against, so
// a reviewer can confirm it in one hop.

import { vocabulary, commonPhrases } from './koreanData';
import { kpopArtists } from './kpopData';
import { FREE_GRAMMAR_COUNT, TOTAL_GRAMMAR_COUNT, FREE_PHRASES_COUNT } from '../constants';

export interface PlanRow {
  /** What the learner recognises it as, not the internal feature key. */
  label: string;
  /** What the free plan gives. */
  free: string;
  /** What Premium gives. */
  premium: string;
}

const FREE_VOCAB_CATEGORIES = 3;   // VocabularySection.tsx · FREE_CATEGORY_COUNT
const FREE_CULTURE_CARDS = 6;      // CultureCards.tsx · the 'Social' category
const TOTAL_CULTURE_CARDS = 24;    // CultureCards.tsx · CARDS
const FREE_HONORIFIC_CATS = 2;     // HonorificEngine.tsx · FREE_CATEGORY_IDS
const TOTAL_HONORIFIC_CATS = 6;    // HonorificEngine.tsx · CATEGORIES
const FREE_TOPIK_QUESTIONS = 3;    // TopikPrepSection.tsx · FREE_QUESTION_LIMIT
const FREE_TYPING_SECONDS = 15;    // TypingDojo.tsx · DEMO_SECONDS
const FULL_TYPING_SECONDS = 60;    // TypingDojo.tsx · FULL_SECONDS
const FREE_AI_CHATS = 5;           // useFeatureAccess.tsx · aiConversationsPerDay
const PREMIUM_AI_CHATS = 50;
const FREE_BOOKMARKS = 15;         // useFeatureAccess.tsx · bookmarksLimit
const FREE_QUIZZES_PER_DAY = 3;    // useFeatureAccess.tsx · quizzesPerDay

const TOTAL_KPOP_SONGS = kpopArtists.reduce((a, r) => a + r.songs.length, 0);
const FREE_KPOP_SONGS = kpopArtists.reduce((a, r) => a + r.songs.filter(s => s.isFree).length, 0);

const totalVocab = vocabulary.reduce((a, c) => a + c.items.length, 0);
const freeVocab = vocabulary
  .slice(0, FREE_VOCAB_CATEGORIES)
  .reduce((a, c) => a + c.items.length, 0);

/** Ordered by how often a learner actually runs into the limit. */
export const PLAN_ROWS: PlanRow[] = [
  { label: 'AI chats',          free: `${FREE_AI_CHATS} a day`,                      premium: `${PREMIUM_AI_CHATS} a day` },
  { label: 'Quizzes',           free: `${FREE_QUIZZES_PER_DAY} a day`,               premium: 'No daily limit' },
  { label: 'Vocabulary',        free: `${freeVocab} words · ${FREE_VOCAB_CATEGORIES} categories`, premium: `All ${totalVocab} words` },
  { label: 'Grammar patterns',  free: `${FREE_GRAMMAR_COUNT} of ${TOTAL_GRAMMAR_COUNT}`,          premium: `All ${TOTAL_GRAMMAR_COUNT}` },
  { label: 'Phrases',           free: `${FREE_PHRASES_COUNT} of ${commonPhrases.length}`,          premium: `All ${commonPhrases.length}` },
  { label: 'Bookmarks',         free: `Up to ${FREE_BOOKMARKS}`,                     premium: 'Unlimited' },
  { label: 'Culture Cards',     free: `${FREE_CULTURE_CARDS} of ${TOTAL_CULTURE_CARDS}`,           premium: `All ${TOTAL_CULTURE_CARDS}` },
  { label: 'Honorifics',        free: `${FREE_HONORIFIC_CATS} of ${TOTAL_HONORIFIC_CATS} categories`, premium: `All ${TOTAL_HONORIFIC_CATS}` },
  { label: 'TOPIK Prep',        free: `${FREE_TOPIK_QUESTIONS} questions a session`,  premium: 'Unlimited' },
  { label: 'Typing drills',     free: `${FREE_TYPING_SECONDS} seconds`,               premium: `The full ${FULL_TYPING_SECONDS} seconds` },
  // Not the same gate: K-Pop gives four of its nine songs away, K-Drama gives
  // nothing. Rolling them into one row would have been wrong about both.
  { label: 'K-Pop lyrics',      free: `${FREE_KPOP_SONGS} of ${TOTAL_KPOP_SONGS} songs`,           premium: `All ${TOTAL_KPOP_SONGS}` },
  { label: 'K-Drama packs',     free: 'Premium only',                                 premium: 'All 5 shows' },
];

/**
 * What free gives outright. Naming these matters as much as the table: a paywall
 * that only lists what you cannot have reads as a threat, and these are the
 * parts nobody is ever going to lose.
 */
export const FREE_FOREVER = [
  'The whole Hangul alphabet',
  'Full spaced repetition',
  'Reading, Writing and the Korean keyboard',
  'Progress, streaks and XP',
];

export const PREMIUM_PRICE = '$4';
