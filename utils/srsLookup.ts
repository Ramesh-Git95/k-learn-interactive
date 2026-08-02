// Is this word already in a review deck?
//
// Every "add to deck" button in the app was happy to be pressed again on a word
// the learner had already saved. Nothing broke — the writers skip duplicates —
// but the button still said "Add to deck", so the learner had no way to know it
// was already done and no reason to trust that pressing it again was harmless.
//
// The check spans ALL decks rather than the one a given screen writes to: from
// the learner's point of view the question is "have I saved this word", not
// "have I saved it into this particular deck".

import type { SRSDeck } from '../services/spacedRepetition';

/** The deck already holding this word, if any. */
export function findDeckWithWord(decks: SRSDeck[], korean: string): SRSDeck | null {
  if (!korean) return null;
  return decks.find(d => d.cards.some(c => c.content.korean === korean)) ?? null;
}

export function isInAnyDeck(decks: SRSDeck[], korean: string): boolean {
  return findDeckWithWord(decks, korean) !== null;
}

/** Of these words, the ones not yet saved anywhere. */
export function unsavedWords<T extends { korean: string }>(decks: SRSDeck[], words: T[]): T[] {
  const saved = new Set<string>();
  decks.forEach(d => d.cards.forEach(c => saved.add(c.content.korean)));
  return words.filter(w => !saved.has(w.korean));
}
