// Pronunciation helpers for the Syllable Player.
//
// Hangul is uniquely suited to syllable teaching: every syllable block is a
// single Unicode codepoint (U+AC00–U+D7A3), so a word splits into speakable
// blocks by simply walking its characters. The player speaks each block at
// NATURAL speed with pauses between — "segment, don't slow" — which is
// comprehensible without the distortion that time-stretching TTS causes.

export function isHangulSyllable(ch: string): boolean {
  const c = ch.codePointAt(0);
  return c !== undefined && c >= 0xac00 && c <= 0xd7a3;
}

export interface KoToken {
  text: string;
  /** true = a Hangul syllable block (tappable/speakable); false = spacing/punctuation */
  speak: boolean;
}

/** Split Korean text into syllable blocks + non-Hangul runs (spaces, punctuation). */
export function segmentKorean(text: string): KoToken[] {
  const tokens: KoToken[] = [];
  let buffer = '';
  for (const ch of Array.from(text)) {
    if (isHangulSyllable(ch)) {
      if (buffer) { tokens.push({ text: buffer, speak: false }); buffer = ''; }
      tokens.push({ text: ch, speak: true });
    } else {
      buffer += ch;
    }
  }
  if (buffer) tokens.push({ text: buffer, speak: false });
  return tokens;
}

/** Speak one chunk of Korean, resolving when it finishes (or errors/cancels).
 *  Resolves on error/cancel too so sequenced playback never hangs. */
export function speakOnce(text: string, rate = 1): Promise<void> {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)) { resolve(); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export const speechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;
