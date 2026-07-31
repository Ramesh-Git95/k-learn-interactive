// Composing Hangul from single letters.
//
// Korean is not written as a run of letters — the letters stack into syllable
// blocks, so ㅇ + ㅏ + ㄴ has to become 안, not ㅇㅏㄴ. Anyone typing on an
// on-screen jamo keyboard needs that assembly done for them, which is what a
// real Korean IME does invisibly.
//
// These functions are deliberately STATELESS: instead of holding a "block being
// composed" in React state, they read the current state out of the last
// character of the text itself. That means the keyboard can never drift out of
// sync with a box the user has also typed in, pasted into, or cleared.

const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

// Vowels that merge when typed in sequence (ㅗ then ㅏ is one vowel, ㅘ).
const VOWEL_MERGE: Record<string, string> = {
  'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
  'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
  'ㅡㅣ': 'ㅢ',
};

// Two consonants that can share one final slot (읽 holds ㄹ and ㄱ).
const FINAL_MERGE: Record<string, string> = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ',
  'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ',
  'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ',
};
const FINAL_SPLIT: Record<string, [string, string]> = Object.fromEntries(
  Object.entries(FINAL_MERGE).map(([pair, merged]) => [merged, [pair[0], pair[1]]]),
);

const isVowel = (j: string) => JUNG.includes(j);
const canBeFinal = (j: string) => JONG.includes(j);

interface Block { cho: string | null; jung: string | null; jong: string | null; }

const isSyllable = (ch: string) => {
  const c = ch.codePointAt(0);
  return c !== undefined && c >= 0xac00 && c <= 0xd7a3;
};

/** Pull the last character back apart into the block it represents. */
function readBlock(ch: string): Block | null {
  if (!ch) return null;
  if (isSyllable(ch)) {
    const code = ch.codePointAt(0)! - 0xac00;
    return {
      cho: CHO[Math.floor(code / 588)],
      jung: JUNG[Math.floor((code % 588) / 28)],
      jong: JONG[code % 28] || null,
    };
  }
  if (CHO.includes(ch)) return { cho: ch, jung: null, jong: null };
  if (JUNG.includes(ch)) return { cho: null, jung: ch, jong: null };
  return null;
}

/** Render a block back to text — a full syllable, or the lone letter so far. */
function writeBlock(b: Block): string {
  if (b.cho && b.jung) {
    const code = 0xac00
      + (CHO.indexOf(b.cho) * 21 + JUNG.indexOf(b.jung)) * 28
      + (b.jong ? JONG.indexOf(b.jong) : 0);
    return String.fromCodePoint(code);
  }
  return b.cho ?? b.jung ?? '';
}

/**
 * Add one letter to the end of `text`, assembling syllables as a Korean
 * keyboard would. Everything before the last character is left untouched.
 */
export function appendJamo(text: string, jamo: string): string {
  const head = text.slice(0, -1);
  const last = text.slice(-1);
  const block = readBlock(last);

  // Nothing to build on — the letter starts a new block.
  if (!block) return text + jamo;

  if (isVowel(jamo)) {
    // A vowel after a bare consonant completes the block: ㄱ + ㅏ = 가.
    if (block.cho && !block.jung) {
      return head + writeBlock({ ...block, jung: jamo });
    }
    // Two vowels that merge into one: 고 + ㅏ = 과.
    if (block.cho && block.jung && !block.jong) {
      const merged = VOWEL_MERGE[block.jung + jamo];
      if (merged) return head + writeBlock({ ...block, jung: merged });
      return head + writeBlock(block) + jamo;
    }
    // The final consonant belongs to the NEW syllable instead: 간 + ㅏ = 가나.
    if (block.cho && block.jung && block.jong) {
      const split = FINAL_SPLIT[block.jong];
      const stays = split ? split[0] : null;
      const moves = split ? split[1] : block.jong;
      const closed = writeBlock({ ...block, jong: stays });
      return head + closed + writeBlock({ cho: moves, jung: jamo, jong: null });
    }
    // A vowel on its own, or after another that will not merge.
    const merged = block.jung ? VOWEL_MERGE[block.jung + jamo] : null;
    if (merged) return head + merged;
    return text + jamo;
  }

  // Consonants.
  if (block.cho && block.jung && !block.jong && canBeFinal(jamo)) {
    return head + writeBlock({ ...block, jong: jamo });
  }
  if (block.cho && block.jung && block.jong) {
    const merged = FINAL_MERGE[block.jong + jamo];
    if (merged) return head + writeBlock({ ...block, jong: merged });
  }
  // Anything else starts a fresh block.
  return text + jamo;
}

/**
 * Delete one LETTER rather than one character, so backspacing 안 gives 아 and
 * then ㅇ — the same way a Korean IME behaves.
 */
export function backspaceJamo(text: string): string {
  if (!text) return text;
  const head = text.slice(0, -1);
  const last = text.slice(-1);
  if (!isSyllable(last)) return head;

  const block = readBlock(last)!;
  if (block.jong) {
    const split = FINAL_SPLIT[block.jong];
    return head + writeBlock({ ...block, jong: split ? split[0] : null });
  }
  if (block.jung) return head + writeBlock({ ...block, jung: null });
  return head;
}
