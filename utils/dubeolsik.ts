// The standard Korean keyboard (두벌식), as a layout you can both read and type on.
//
// Nearly every learner using this app is on a QWERTY keyboard with no Korean
// input method installed, which is normally the end of the story: you cannot
// practise typing Korean at all. So the mapping is done here instead of relying
// on the operating system — press R and you get ㄱ, exactly where it sits on a
// Korean keyboard. That means the drill teaches the real layout rather than a
// convenient invention, and it works on a machine that has never seen Korean.
//
// Consonants occupy the left half and vowels the right, which is the one fact
// about 두벌식 worth knowing before anything else.

/** Unshifted QWERTY key → jamo. */
const BASE: Record<string, string> = {
  q: 'ㅂ', w: 'ㅈ', e: 'ㄷ', r: 'ㄱ', t: 'ㅅ',
  y: 'ㅛ', u: 'ㅕ', i: 'ㅑ', o: 'ㅐ', p: 'ㅔ',
  a: 'ㅁ', s: 'ㄴ', d: 'ㅇ', f: 'ㄹ', g: 'ㅎ',
  h: 'ㅗ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ',
  z: 'ㅋ', x: 'ㅌ', c: 'ㅊ', v: 'ㅍ',
  b: 'ㅠ', n: 'ㅜ', m: 'ㅡ',
};

/** Shifted keys — the five tense consonants and two of the vowels. */
const SHIFTED: Record<string, string> = {
  q: 'ㅃ', w: 'ㅉ', e: 'ㄸ', r: 'ㄲ', t: 'ㅆ',
  o: 'ㅒ', p: 'ㅖ',
};

/** The jamo a physical key press produces, or null if the key is not on the layout. */
export function jamoForKey(key: string, shift: boolean): string | null {
  const k = key.toLowerCase();
  if (shift && SHIFTED[k]) return SHIFTED[k];
  return BASE[k] ?? null;
}

/** Which QWERTY key produces this jamo, for showing the learner where to press. */
export const KEY_FOR_JAMO: Record<string, { key: string; shift: boolean }> = (() => {
  const map: Record<string, { key: string; shift: boolean }> = {};
  Object.entries(BASE).forEach(([k, j]) => { map[j] = { key: k, shift: false }; });
  Object.entries(SHIFTED).forEach(([k, j]) => { map[j] = { key: k, shift: true }; });
  return map;
})();

/** The three letter rows, in the order they appear on a keyboard. */
export const ROWS: string[][] = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

export const jamoOfKey = (k: string) => BASE[k] ?? '';
export const shiftJamoOfKey = (k: string) => SHIFTED[k] ?? '';

// ── Which finger reaches a key ────────────────────────────────────────────────
// Standard touch-typing assignment. Used to say something true about the keys a
// learner keeps missing, rather than guessing at a reason.

const FINGERS: Record<string, string> = {
  q: 'left little', a: 'left little', z: 'left little',
  w: 'left ring', s: 'left ring', x: 'left ring',
  e: 'left middle', d: 'left middle', c: 'left middle',
  r: 'left index', f: 'left index', v: 'left index',
  t: 'left index', g: 'left index', b: 'left index',
  y: 'right index', h: 'right index', n: 'right index',
  u: 'right index', j: 'right index', m: 'right index',
  i: 'right middle', k: 'right middle',
  o: 'right ring', l: 'right ring',
  p: 'right little',
};

export function fingerForJamo(jamo: string): string | null {
  const k = KEY_FOR_JAMO[jamo];
  return k ? FINGERS[k.key] ?? null : null;
}

// ── Turning a line of Korean into the keys that type it ──────────────────────

// Compound vowels and cluster finals are not keys — they are built from two
// presses each, which is exactly what the drill has to ask for.
const VOWEL_PARTS: Record<string, [string, string]> = {
  'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ'],
};

const FINAL_PARTS: Record<string, [string, string]> = {
  'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'],
  'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'],
  'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'],
  'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ'],
};

const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

const split = (j: string, table: Record<string, [string, string]>) => table[j] ?? [j];

/**
 * Every key press needed to type this line, in order. A space stays a space;
 * anything that is not Hangul (punctuation, a Latin letter) is passed through
 * so the caller can decide what to do with it.
 */
export function keysToType(text: string): string[] {
  const out: string[] = [];
  for (const ch of Array.from(text)) {
    const code = ch.codePointAt(0)!;
    if (code >= 0xac00 && code <= 0xd7a3) {
      const n = code - 0xac00;
      out.push(CHO[Math.floor(n / 588)]);
      out.push(...split(JUNG[Math.floor((n % 588) / 28)], VOWEL_PARTS));
      const jong = JONG[n % 28];
      if (jong) out.push(...split(jong, FINAL_PARTS));
    } else {
      out.push(ch);
    }
  }
  return out;
}
