// How much XP finishing a piece of content is worth, keyed by progress-key prefix.
//
// Lives here rather than inside ProgressContext so the prefix ordering — the
// easiest thing to get silently wrong — can be unit tested.

// Ordered MOST SPECIFIC FIRST: the first matching prefix wins, so `vocab_item_x`
// scores as a single word (5) and only the category rollup `vocab_Greetings`
// scores as a milestone (20). Reordering these changes what things are worth.
export const XP_FOR_KEY: ReadonlyArray<readonly [string, number]> = [
  ['quiz_',                0],  // already awarded by score at the quiz itself
  ['hangul_char_',         5],
  ['vocab_item_',          5],
  ['grammar_pattern_',    10],
  ['phrase_',              5],
  ['culture_tip_',         3],
  ['daily_life_topic_',   10],  // topic rollup, before the subsection prefix
  ['modern_korea_topic_', 10],
  ['daily_life_',          3],
  ['modern_korea_',        3],
  ['region_',             10],
  ['section_',            25],  // finishing a whole section
  ['vocab_',              20],  // category rollup — must stay after vocab_item_
];

/** XP for first-time completion of a progress key. 0 means "paid elsewhere". */
export function xpForProgressKey(key: string): number {
  const hit = XP_FOR_KEY.find(([prefix]) => key.startsWith(prefix));
  return hit ? hit[1] : 2; // small default so new content types still count
}
