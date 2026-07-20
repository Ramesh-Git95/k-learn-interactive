// Stroke-order data for handwriting practice.
//
// Authored in a 100x100 box, as SVG paths drawn IN WRITING DIRECTION — the
// direction matters as much as the shape, because a ㄱ drawn bottom-up looks
// identical as a picture but is wrong, and the scorer checks for exactly that.
//
// Only the 24 basic jamo are authored. Hangul is compositional, so everything
// else is generated: tense consonants are doubles (ㄲ = ㄱ ㄱ) and compound
// vowels are combinations (ㅘ = ㅗ ㅏ). That means 24 hand-authored letters
// cover all 40 in the app — and the same machinery extends to full syllable
// blocks (가 = ㄱ + ㅏ) when writing moves on to words.

export interface JamoStrokes {
  char: string;
  /** SVG path 'd' strings in a 0-100 box, in writing order. */
  strokes: string[];
  /** What to keep in mind while writing it — shown under the animation. */
  tip: string;
}

// ── Basic consonants (14) ────────────────────────────────────────────────────
const CONSONANTS: JamoStrokes[] = [
  { char: 'ㄱ', strokes: ['M 18 22 L 80 22 L 80 84'],
    tip: 'One stroke: across the top, then straight down.' },
  { char: 'ㄴ', strokes: ['M 26 16 L 26 78 L 84 78'],
    tip: 'One stroke: down the left, then along the bottom.' },
  { char: 'ㄷ', strokes: ['M 20 20 L 80 20', 'M 20 20 L 20 80 L 80 80'],
    tip: 'Top line first, then down and along the bottom.' },
  { char: 'ㄹ', strokes: ['M 20 18 L 78 18 L 78 46', 'M 20 46 L 78 46', 'M 20 46 L 20 80 L 80 80'],
    tip: 'Three strokes, each starting from the left.' },
  { char: 'ㅁ', strokes: ['M 22 18 L 22 80', 'M 22 18 L 80 18 L 80 80', 'M 22 80 L 80 80'],
    tip: 'Left side, then top and right, then close the bottom.' },
  { char: 'ㅂ', strokes: ['M 22 16 L 22 82', 'M 78 16 L 78 82', 'M 22 50 L 78 50', 'M 22 82 L 78 82'],
    tip: 'Both uprights first, then the two crossbars.' },
  { char: 'ㅅ', strokes: ['M 50 20 L 20 82', 'M 52 40 L 82 82'],
    tip: 'Left leg from the peak, then the right leg.' },
  { char: 'ㅇ', strokes: ['M 50 18 C 68 18 82 32 82 50 C 82 68 68 82 50 82 C 32 82 18 68 18 50 C 18 32 32 18 50 18'],
    tip: 'A single circle, starting at the top.' },
  { char: 'ㅈ', strokes: ['M 18 24 L 82 24', 'M 50 24 L 22 82', 'M 52 44 L 82 82'],
    tip: 'Top line, then the two legs — like ㅅ with a hat.' },
  { char: 'ㅊ', strokes: ['M 50 8 L 50 20', 'M 18 32 L 82 32', 'M 50 32 L 22 84', 'M 52 50 L 82 84'],
    tip: 'The little mark on top comes first.' },
  { char: 'ㅋ', strokes: ['M 18 20 L 80 20 L 80 82', 'M 40 50 L 80 50'],
    tip: 'Write ㄱ, then add the bar across the middle.' },
  { char: 'ㅌ', strokes: ['M 20 18 L 80 18', 'M 20 49 L 80 49', 'M 20 18 L 20 80 L 80 80'],
    tip: 'Two bars top to bottom, then the left side closes it.' },
  { char: 'ㅍ', strokes: ['M 16 24 L 84 24', 'M 32 24 L 32 76', 'M 68 24 L 68 76', 'M 16 76 L 84 76'],
    tip: 'Top bar, both legs, then the base.' },
  { char: 'ㅎ', strokes: ['M 50 8 L 50 18', 'M 22 28 L 78 28',
      'M 50 40 C 64 40 74 50 74 61 C 74 72 64 82 50 82 C 36 82 26 72 26 61 C 26 50 36 40 50 40'],
    tip: 'Mark, then bar, then the circle underneath.' },
];

// ── Basic vowels (10) ────────────────────────────────────────────────────────
// Korean writes top-to-bottom and left-to-right, which decides the order: ㅏ has
// its short stroke on the RIGHT so the long line comes first, while ㅓ has it on
// the LEFT so the short stroke leads.
const VOWELS: JamoStrokes[] = [
  { char: 'ㅏ', strokes: ['M 46 12 L 46 88', 'M 46 50 L 80 50'],
    tip: 'Long line down, then the short stroke to the right.' },
  { char: 'ㅑ', strokes: ['M 46 12 L 46 88', 'M 46 36 L 80 36', 'M 46 64 L 80 64'],
    tip: 'Long line, then two short strokes top to bottom.' },
  { char: 'ㅓ', strokes: ['M 20 50 L 54 50', 'M 54 12 L 54 88'],
    tip: 'Short stroke first — it sits on the left.' },
  { char: 'ㅕ', strokes: ['M 20 36 L 54 36', 'M 20 64 L 54 64', 'M 54 12 L 54 88'],
    tip: 'Both short strokes first, then the long line.' },
  { char: 'ㅗ', strokes: ['M 50 22 L 50 56', 'M 14 56 L 86 56'],
    tip: 'Short stroke down, then the line beneath it.' },
  { char: 'ㅛ', strokes: ['M 34 22 L 34 56', 'M 66 22 L 66 56', 'M 14 56 L 86 56'],
    tip: 'Both short strokes left to right, then the base.' },
  { char: 'ㅜ', strokes: ['M 14 44 L 86 44', 'M 50 44 L 50 78'],
    tip: 'Line first — it sits on top.' },
  { char: 'ㅠ', strokes: ['M 14 44 L 86 44', 'M 34 44 L 34 78', 'M 66 44 L 66 78'],
    tip: 'Line first, then the two legs.' },
  { char: 'ㅡ', strokes: ['M 14 50 L 86 50'],
    tip: 'One straight line, left to right.' },
  { char: 'ㅣ', strokes: ['M 50 12 L 50 88'],
    tip: 'One straight line, top to bottom.' },
];

export const BASIC_JAMO: JamoStrokes[] = [...CONSONANTS, ...VOWELS];

// ── Composition ──────────────────────────────────────────────────────────────
// Each part is placed by scaling the 0-100 box into a sub-box, so a compound
// reuses its parts' authored strokes rather than duplicating them.
interface Placement { char: string; x: number; y: number; w: number; h: number; }

const COMPOUNDS: Record<string, Placement[]> = {
  // Tense consonants — the same letter written twice, side by side.
  'ㄲ': [{ char: 'ㄱ', x: 0, y: 0, w: 0.48, h: 1 }, { char: 'ㄱ', x: 0.52, y: 0, w: 0.48, h: 1 }],
  'ㄸ': [{ char: 'ㄷ', x: 0, y: 0, w: 0.48, h: 1 }, { char: 'ㄷ', x: 0.52, y: 0, w: 0.48, h: 1 }],
  'ㅃ': [{ char: 'ㅂ', x: 0, y: 0, w: 0.48, h: 1 }, { char: 'ㅂ', x: 0.52, y: 0, w: 0.48, h: 1 }],
  'ㅆ': [{ char: 'ㅅ', x: 0, y: 0, w: 0.48, h: 1 }, { char: 'ㅅ', x: 0.52, y: 0, w: 0.48, h: 1 }],
  'ㅉ': [{ char: 'ㅈ', x: 0, y: 0, w: 0.48, h: 1 }, { char: 'ㅈ', x: 0.52, y: 0, w: 0.48, h: 1 }],

  // Compound vowels — a vertical partner gains a ㅣ, and ㅗ/ㅜ pair up with ㅏ/ㅓ.
  'ㅐ': [{ char: 'ㅏ', x: 0, y: 0, w: 0.66, h: 1 }, { char: 'ㅣ', x: 0.62, y: 0, w: 0.38, h: 1 }],
  'ㅒ': [{ char: 'ㅑ', x: 0, y: 0, w: 0.66, h: 1 }, { char: 'ㅣ', x: 0.62, y: 0, w: 0.38, h: 1 }],
  'ㅔ': [{ char: 'ㅓ', x: 0, y: 0, w: 0.66, h: 1 }, { char: 'ㅣ', x: 0.62, y: 0, w: 0.38, h: 1 }],
  'ㅖ': [{ char: 'ㅕ', x: 0, y: 0, w: 0.66, h: 1 }, { char: 'ㅣ', x: 0.62, y: 0, w: 0.38, h: 1 }],
  'ㅘ': [{ char: 'ㅗ', x: 0, y: 0, w: 0.55, h: 1 }, { char: 'ㅏ', x: 0.55, y: 0, w: 0.45, h: 1 }],
  'ㅙ': [{ char: 'ㅗ', x: 0, y: 0, w: 0.44, h: 1 }, { char: 'ㅐ', x: 0.44, y: 0, w: 0.56, h: 1 }],
  'ㅚ': [{ char: 'ㅗ', x: 0, y: 0, w: 0.6, h: 1 }, { char: 'ㅣ', x: 0.6, y: 0, w: 0.4, h: 1 }],
  'ㅝ': [{ char: 'ㅜ', x: 0, y: 0, w: 0.55, h: 1 }, { char: 'ㅓ', x: 0.55, y: 0, w: 0.45, h: 1 }],
  'ㅞ': [{ char: 'ㅜ', x: 0, y: 0, w: 0.44, h: 1 }, { char: 'ㅔ', x: 0.44, y: 0, w: 0.56, h: 1 }],
  'ㅟ': [{ char: 'ㅜ', x: 0, y: 0, w: 0.6, h: 1 }, { char: 'ㅣ', x: 0.6, y: 0, w: 0.4, h: 1 }],
  'ㅢ': [{ char: 'ㅡ', x: 0, y: 0, w: 0.6, h: 1 }, { char: 'ㅣ', x: 0.6, y: 0, w: 0.4, h: 1 }],
};

/** Scale every coordinate in a path into the given sub-box of the 0-100 canvas. */
function transformPath(d: string, p: Placement): string {
  let isX = true;
  return d.replace(/-?\d*\.?\d+/g, match => {
    const v = parseFloat(match);
    const out = isX ? p.x * 100 + (v / 100) * (p.w * 100)
                    : p.y * 100 + (v / 100) * (p.h * 100);
    isX = !isX;
    return String(Math.round(out * 10) / 10);
  });
}

const BASIC_BY_CHAR = new Map(BASIC_JAMO.map(j => [j.char, j]));

/**
 * Stroke data for any of the 40 characters — authored for the 24 basics,
 * generated for the rest. Returns null for anything with no data.
 */
export function getStrokes(char: string): JamoStrokes | null {
  const basic = BASIC_BY_CHAR.get(char);
  if (basic) return basic;

  const parts = COMPOUNDS[char];
  if (!parts) return null;

  const strokes: string[] = [];
  for (const part of parts) {
    // Recursive: ㅙ is built from ㅗ and ㅐ, and ㅐ is itself a compound.
    const partData = getStrokes(part.char);
    if (!partData) return null;
    partData.strokes.forEach(d => strokes.push(transformPath(d, part)));
  }

  const names = parts.map(p => p.char);
  const isDouble = names.length === 2 && names[0] === names[1];
  return {
    char,
    strokes,
    tip: isDouble
      ? `Write ${names[0]} twice — the second is a little tighter.`
      : `Built from ${names.join(' + ')} — write them in that order.`,
  };
}

/** Every character writing practice can teach, in teaching order. */
export const WRITABLE_CHARS: string[] = [
  ...CONSONANTS.map(c => c.char),
  'ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ',
  ...VOWELS.map(v => v.char),
  'ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ',
];

/** The free tier: the 14 basic consonants. Everything else needs Premium. */
export const FREE_WRITING_CHARS: string[] = CONSONANTS.map(c => c.char);
