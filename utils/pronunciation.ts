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

// ── Jamo decomposition ───────────────────────────────────────────────────────
// A syllable block's codepoint encodes its letters arithmetically, so a word can
// be broken back into the jamo it is spelled with. That is what lets the Hangul
// screen answer "which words can you actually read now?" from real progress
// instead of a hardcoded list.

const INITIALS = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const MEDIALS  = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const FINALS   = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

// Clustered finals are two letters written together — split them so a reader who
// knows ㄱ and ㅅ counts as able to read 값.
const CLUSTERS: Record<string, string[]> = {
  'ㄳ': ['ㄱ','ㅅ'], 'ㄵ': ['ㄴ','ㅈ'], 'ㄶ': ['ㄴ','ㅎ'], 'ㄺ': ['ㄹ','ㄱ'],
  'ㄻ': ['ㄹ','ㅁ'], 'ㄼ': ['ㄹ','ㅂ'], 'ㄽ': ['ㄹ','ㅅ'], 'ㄾ': ['ㄹ','ㅌ'],
  'ㄿ': ['ㄹ','ㅍ'], 'ㅀ': ['ㄹ','ㅎ'], 'ㅄ': ['ㅂ','ㅅ'],
};

/** Every jamo used to spell the given text, in order, clusters split apart. */
export function jamoOf(text: string): string[] {
  const out: string[] = [];
  for (const ch of Array.from(text)) {
    if (!isHangulSyllable(ch)) continue;
    const code = ch.codePointAt(0)! - 0xac00;
    const initial = INITIALS[Math.floor(code / 588)];
    const medial  = MEDIALS[Math.floor((code % 588) / 28)];
    const final   = FINALS[code % 28];
    out.push(initial, medial);
    if (final) out.push(...(CLUSTERS[final] ?? [final]));
  }
  return out;
}

// ── Pre-generated neural audio ────────────────────────────────────────────────
// Core words/phrases are voiced once by Gemini TTS (scripts/generate-tts.cjs)
// and shipped as static clips. When a clip exists we play it — consistent, clear,
// and crucially audible on devices with no Korean voice installed, where Web
// Speech is silent. Everything else falls back to Web Speech, so nothing breaks.

const AUDIO_BASE = '/audio/tts/';
let manifest: Record<string, string> | null = null;

// Load the manifest once, early, so a clip is ready by the first tap. A miss
// (offline, not deployed yet) just leaves us on the Web Speech path.
function loadManifest(): void {
  if (manifest !== null || typeof fetch === 'undefined') return;
  manifest = {}; // prevent re-entry; fill in on success
  fetch(`${AUDIO_BASE}manifest.json`)
    .then(r => (r.ok ? r.json() : {}))
    .then(m => { manifest = m; })
    .catch(() => { /* stay empty → Web Speech */ });
}
if (typeof window !== 'undefined') loadManifest();

function clipUrl(text: string): string | null {
  const f = manifest?.[text.trim()];
  return f ? AUDIO_BASE + f : null;
}

// One shared element so a new play interrupts the previous clip.
let currentAudio: HTMLAudioElement | null = null;

function playClip(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    const a = new Audio(url);
    currentAudio = a;
    a.onended = () => { if (currentAudio === a) currentAudio = null; resolve(); };
    a.onerror = () => { if (currentAudio === a) currentAudio = null; reject(new Error('audio failed')); };
    a.play().catch(reject);
  });
}

function webSpeak(text: string, rate: number): Promise<void> {
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

/** Speak one chunk of Korean, resolving when it finishes (or errors/cancels).
 *  Prefers a pre-generated neural clip at natural speed; otherwise Web Speech.
 *  Resolves on error/cancel too so sequenced playback never hangs. */
export function speakOnce(text: string, rate = 1): Promise<void> {
  // Clips are whole-word at natural speed; slow syllable-by-syllable playback
  // (rate < 0.9) still uses Web Speech, which can time-stretch per syllable.
  const clip = rate >= 0.9 ? clipUrl(text) : null;
  if (clip) return playClip(clip).catch(() => webSpeak(text, rate));
  return webSpeak(text, rate);
}

export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export const speechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;
