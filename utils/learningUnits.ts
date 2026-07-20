// Lesson-sized units — the learning path's atoms.
//
// The path used to be six section-sized steps ("Learn Hangul · 1-2 hours"),
// which reads as a mountain to a beginner. These units are the same content cut
// into ~5-minute pieces, so there's always an obvious next thing and finishing
// it is a win rather than a milestone three hours away.
//
// Units are DERIVED from the content data rather than hand-listed, so adding a
// vocabulary category or a culture tip extends the path automatically instead of
// silently falling out of it. `unitsCoverAllContent()` guards that invariant.

import { hangulCharacters, vocabulary, grammarPatterns, commonPhrases, cultureTips } from '../data/koreanData';
import type { Section } from '../types';

export interface LearningUnit {
  id: string;
  section: Section;
  title: string;
  subtitle: string;
  /** Progress keys that make up this unit — all true means the unit is done. */
  itemKeys: string[];
  estMinutes: number;
}

export type UnitStatus = 'locked' | 'available' | 'in-progress' | 'done';

export interface UnitProgress {
  unit: LearningUnit;
  status: UnitStatus;
  completed: number;
  total: number;
}

// Roughly 40s per item, floored at 3 minutes — a unit should always read as a
// short sitting, never as homework.
const estimate = (itemCount: number) => Math.max(3, Math.round(itemCount * 0.7));

// ── Hangul ───────────────────────────────────────────────────────────────────
// Grouped the way the alphabet is actually taught: plain consonants, then the
// aspirated and tense sets that build on them, then vowels simple-to-compound.
const HANGUL_GROUPS: { title: string; subtitle: string; chars: string[] }[] = [
  { title: 'First consonants',   subtitle: 'ㄱ ㄴ ㄷ ㄹ ㅁ',      chars: ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ'] },
  { title: 'More consonants',    subtitle: 'ㅂ ㅅ ㅇ ㅈ',         chars: ['ㅂ','ㅅ','ㅇ','ㅈ'] },
  { title: 'Aspirated sounds',   subtitle: 'ㅊ ㅋ ㅌ ㅍ ㅎ',      chars: ['ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'] },
  { title: 'Tense consonants',   subtitle: 'ㄲ ㄸ ㅃ ㅆ ㅉ',      chars: ['ㄲ','ㄸ','ㅃ','ㅆ','ㅉ'] },
  { title: 'First vowels',       subtitle: 'ㅏ ㅑ ㅓ ㅕ ㅗ',      chars: ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ'] },
  { title: 'More vowels',        subtitle: 'ㅛ ㅜ ㅠ ㅡ ㅣ',      chars: ['ㅛ','ㅜ','ㅠ','ㅡ','ㅣ'] },
  { title: 'Combined vowels',    subtitle: 'ㅐ ㅒ ㅔ ㅖ ㅘ',      chars: ['ㅐ','ㅒ','ㅔ','ㅖ','ㅘ'] },
  { title: 'Last vowels',        subtitle: 'ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ',   chars: ['ㅙ','ㅚ','ㅝ','ㅞ','ㅟ','ㅢ'] },
];

// ── Phrases ──────────────────────────────────────────────────────────────────
// Bundled by situation, so a unit is "the phrases you need in a shop" rather
// than an arbitrary slice. Contexts not listed here fall into the last unit.
const PHRASE_GROUPS: { title: string; subtitle: string; contexts: string[] }[] = [
  { title: 'Meeting people',   subtitle: 'Introduce yourself',      contexts: ['Introductions', 'General'] },
  { title: 'Out shopping',     subtitle: 'Prices and directions',   contexts: ['Shopping', 'Directions'] },
  { title: 'Eating out',       subtitle: 'Ordering and feeling ok', contexts: ['Restaurant', 'Health'] },
  { title: 'Saying how you feel', subtitle: 'Feelings and help',    contexts: ['Feelings', 'Communication', 'Emergency'] },
];

// ── Grammar ──────────────────────────────────────────────────────────────────
// What each pattern lets you DO, in plain English. "Grammar 2" tells a beginner
// nothing; "Talking about the past" tells them why they'd open it. Keyed by the
// pattern string rather than by position, so reordering or inserting patterns
// keeps every name attached to the right one — anything unnamed simply falls
// back to the pattern itself.
const GRAMMAR_TOPIC: Record<string, string> = {
  'A은/는 B입니다':               'Saying what something is',
  'A이/가 B에 있습니다/없습니다':  'Saying where something is',
  'Verb-았/었어요':               'Talking about the past',
  'Verb-(으)ㄹ 거예요':           'Talking about the future',
  'Object을/를':                  'Marking the object',
  '안 + Verb/Adjective':          'Saying no',
  'Verb-고 싶어요':               'Saying what you want',
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * The full ordered path. Section order matches how the app teaches: the
 * alphabet first, then words, then putting them to use.
 */
export function buildLearningUnits(): LearningUnit[] {
  const units: LearningUnit[] = [];

  HANGUL_GROUPS.forEach((g, i) => {
    units.push({
      id: `hangul-${i + 1}`,
      section: 'hangul' as Section,
      title: g.title,
      subtitle: g.subtitle,
      itemKeys: g.chars.map(c => `hangul_char_${c}`),
      estMinutes: estimate(g.chars.length),
    });
  });

  // A category is usually one unit, but oversized ones (Numbers is 21 words)
  // get split so no unit ever reads as homework.
  const MAX_WORDS_PER_UNIT = 12;
  let vocabIndex = 0;
  vocabulary.forEach(cat => {
    const parts = chunk(cat.items, MAX_WORDS_PER_UNIT);
    parts.forEach((items, partIdx) => {
      vocabIndex += 1;
      units.push({
        id: `vocab-${vocabIndex}`,
        section: 'vocabulary' as Section,
        title: parts.length > 1 ? `${cat.name} ${partIdx + 1}` : cat.name,
        subtitle: `${items.length} words`,
        itemKeys: items.map(item => `vocab_item_${item.korean}`),
        estMinutes: estimate(items.length),
      });
    });
  });

  PHRASE_GROUPS.forEach((g, i) => {
    const isLast = i === PHRASE_GROUPS.length - 1;
    const listed = PHRASE_GROUPS.flatMap(x => x.contexts);
    const indices = commonPhrases
      .map((p, idx) => ({ p, idx }))
      // The last unit sweeps up any context nobody claimed, so a newly authored
      // phrase can never end up outside the path.
      .filter(({ p }) => g.contexts.includes(p.context) || (isLast && !listed.includes(p.context)))
      .map(({ idx }) => idx);

    units.push({
      id: `phrases-${i + 1}`,
      section: 'phrases' as Section,
      title: g.title,
      subtitle: g.subtitle,
      itemKeys: indices.map(idx => `phrase_${idx}`),
      estMinutes: estimate(indices.length),
    });
  });

  chunk(grammarPatterns.map((_, i) => i), 2).forEach((indices, i) => {
    const patterns = indices.map(idx => grammarPatterns[idx].pattern);
    const topics = patterns.map(p => GRAMMAR_TOPIC[p] ?? p);
    units.push({
      id: `grammar-${i + 1}`,
      section: 'grammar' as Section,
      title: topics.length > 1 ? `${topics[0]} & more` : topics[0],
      // The patterns themselves become the subtitle: the title says what you can
      // do with it, the subtitle shows the shape you'll actually be writing.
      subtitle: patterns.join(' · '),
      itemKeys: indices.map(idx => `grammar_pattern_${idx}`),
      estMinutes: estimate(indices.length * 4), // patterns take longer than words
    });
  });

  // Titled from the tips themselves — "Bowing & more" tells you what you're
  // about to read; "Culture 2" tells you nothing.
  chunk(cultureTips.map((_, i) => i), 4).forEach((indices, i) => {
    const titles = indices.map(idx => cultureTips[idx].title);
    units.push({
      id: `culture-${i + 1}`,
      section: 'culture' as Section,
      title: titles.length > 1 ? `${titles[0]} & more` : titles[0],
      subtitle: titles.slice(1).join(' · '),
      itemKeys: indices.map(idx => `culture_tip_${idx}`),
      estMinutes: estimate(indices.length),
    });
  });

  return units;
}

export const LEARNING_UNITS: LearningUnit[] = buildLearningUnits();

/**
 * Status for every unit, in path order.
 *
 * Only ONE unit is ever unlocked ahead of the work you've done — that's the
 * point of the path. `assumeDone` lets placement skip sections (a TOPIK 2+
 * learner shouldn't be gated behind the alphabet).
 */
export function getUnitProgress(
  progress: { [key: string]: boolean },
  assumeDone: Section[] = [],
): UnitProgress[] {
  let previousSatisfied = true;

  return LEARNING_UNITS.map(unit => {
    const total = unit.itemKeys.length;
    const completed = unit.itemKeys.filter(k => progress[k]).length;
    const skipped = assumeDone.includes(unit.section);
    const isDone = skipped || (total > 0 && completed === total);

    let status: UnitStatus;
    if (isDone) status = 'done';
    else if (completed > 0) status = 'in-progress';
    else if (previousSatisfied) status = 'available';
    else status = 'locked';

    // A unit only opens the next one once it's finished; a half-done unit still
    // counts as the frontier so you're never locked out of your own progress.
    previousSatisfied = isDone || completed > 0;

    return { unit, status, completed, total };
  });
}

/** The unit to point the learner at next — the first thing not finished. */
export function getNextUnit(
  progress: { [key: string]: boolean },
  assumeDone: Section[] = [],
): UnitProgress | null {
  const all = getUnitProgress(progress, assumeDone);
  return all.find(u => u.status === 'in-progress')
      ?? all.find(u => u.status === 'available')
      ?? null;
}

/** Overall path completion, for the header ring. */
export function getPathSummary(progress: { [key: string]: boolean }, assumeDone: Section[] = []) {
  const all = getUnitProgress(progress, assumeDone);
  const doneUnits = all.filter(u => u.status === 'done').length;
  return { doneUnits, totalUnits: all.length, percent: Math.round((doneUnits / all.length) * 100) };
}

/**
 * Guard: every piece of content must belong to exactly one unit. Exported so a
 * test can fail loudly when new content is authored but slips out of the path.
 */
export function unitsCoverAllContent(): { ok: boolean; missing: string[]; duplicated: string[] } {
  const expected = [
    ...hangulCharacters.map(c => `hangul_char_${c.char}`),
    ...vocabulary.flatMap(c => c.items.map(i => `vocab_item_${i.korean}`)),
    ...commonPhrases.map((_, i) => `phrase_${i}`),
    ...grammarPatterns.map((_, i) => `grammar_pattern_${i}`),
    ...cultureTips.map((_, i) => `culture_tip_${i}`),
  ];
  const covered = LEARNING_UNITS.flatMap(u => u.itemKeys);
  const counts = new Map<string, number>();
  covered.forEach(k => counts.set(k, (counts.get(k) ?? 0) + 1));

  return {
    ok: expected.every(k => counts.has(k)) && [...counts.values()].every(n => n === 1),
    missing: expected.filter(k => !counts.has(k)),
    duplicated: [...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k),
  };
}
