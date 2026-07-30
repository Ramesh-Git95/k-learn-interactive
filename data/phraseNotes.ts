// Word-by-word notes for the common phrases in koreanData.ts.
//
// A phrase you can only repeat is a phrase you cannot adapt. The data carries
// the whole phrase, its romanization and its meaning — what it never had is the
// seam between the words, which is what lets a learner swap one piece and say
// something new. Keyed by the exact Korean so the original data stays untouched
// and a phrase without a note still renders.
//
// Authored by hand — worth a native speaker's proofread before it is treated as
// gospel.

export interface PhraseWord {
  korean: string;
  /** Syllable-separated romanization, matching how it is said. */
  sounds: string;
  /** What this piece contributes, in plain English. */
  means: string;
}

export interface PhraseNote {
  /** "WHEN YOU WANT TO ..." — the situation this phrase belongs to. */
  when: string;
  words: PhraseWord[];
}

export const PHRASE_NOTES: Record<string, PhraseNote> = {
  '이거 얼마예요?': {
    when: 'WHEN YOU WANT TO KNOW THE PRICE',
    words: [
      { korean: '이거', sounds: 'i-geo', means: 'this one' },
      { korean: '얼마', sounds: 'eol-ma', means: 'how much' },
      { korean: '예요?', sounds: 'ye-yo', means: 'is it? — the polite question ending' },
    ],
  },
  '깎아주세요': {
    when: 'WHEN YOU WANT A BETTER PRICE',
    words: [
      { korean: '깎아', sounds: 'kka-kka', means: 'cut it down — from 깎다, to shave off' },
      { korean: '주세요', sounds: 'ju-se-yo', means: 'please do it for me' },
    ],
  },
  '이거 주세요': {
    when: 'WHEN YOU WANT TO BUY SOMETHING',
    words: [
      { korean: '이거', sounds: 'i-geo', means: 'this one' },
      { korean: '주세요', sounds: 'ju-se-yo', means: 'please give me' },
    ],
  },
  '화장실 어디예요?': {
    when: 'WHEN YOU NEED THE BATHROOM',
    words: [
      { korean: '화장실', sounds: 'hwa-jang-sil', means: 'bathroom' },
      { korean: '어디', sounds: 'eo-di', means: 'where' },
      { korean: '예요?', sounds: 'ye-yo', means: 'is it? — the polite question ending' },
    ],
  },
  '메뉴 주세요.': {
    when: 'WHEN YOU SIT DOWN TO EAT',
    words: [
      { korean: '메뉴', sounds: 'me-nyu', means: 'menu — a borrowed English word' },
      { korean: '주세요', sounds: 'ju-se-yo', means: 'please give me' },
    ],
  },
  '맛있어요!': {
    when: 'WHEN THE FOOD IS GOOD',
    words: [
      { korean: '맛', sounds: 'mat', means: 'taste' },
      { korean: '있어요', sounds: 'i-sseo-yo', means: 'there is — so literally “it has taste”' },
    ],
  },
  '계산해 주세요': {
    when: 'WHEN YOU ARE READY TO PAY',
    words: [
      { korean: '계산해', sounds: 'gye-san-hae', means: 'settle the bill — from 계산하다' },
      { korean: '주세요', sounds: 'ju-se-yo', means: 'please do it for me' },
    ],
  },
  '이름이 뭐예요?': {
    when: 'WHEN YOU WANT SOMEONE’S NAME',
    words: [
      { korean: '이름', sounds: 'i-reum', means: 'name' },
      { korean: '이', sounds: 'i', means: 'marks the subject of the sentence' },
      { korean: '뭐', sounds: 'mwo', means: 'what' },
      { korean: '예요?', sounds: 'ye-yo', means: 'is it? — the polite question ending' },
    ],
  },
  '어디에서 왔어요?': {
    when: 'WHEN YOU WANT TO KNOW WHERE SOMEONE IS FROM',
    words: [
      { korean: '어디', sounds: 'eo-di', means: 'where' },
      { korean: '에서', sounds: 'e-seo', means: 'from' },
      { korean: '왔어요?', sounds: 'wa-sseo-yo', means: 'did you come — the past of 오다, to come' },
    ],
  },
  '괜찮아요': {
    when: 'WHEN YOU ARE FINE — OR DECLINING POLITELY',
    words: [
      { korean: '괜찮', sounds: 'gwaen-chan', means: 'fine, all right' },
      { korean: '아요', sounds: 'a-yo', means: 'the polite ending' },
    ],
  },
  '천천히 말해주세요': {
    when: 'WHEN SOMEONE IS SPEAKING TOO FAST',
    words: [
      { korean: '천천히', sounds: 'cheon-cheon-hi', means: 'slowly' },
      { korean: '말해', sounds: 'mal-hae', means: 'speak — from 말하다' },
      { korean: '주세요', sounds: 'ju-se-yo', means: 'please do it for me' },
    ],
  },
  '배고파요': {
    when: 'WHEN YOU ARE HUNGRY',
    words: [
      { korean: '배', sounds: 'bae', means: 'stomach' },
      { korean: '고파요', sounds: 'go-pa-yo', means: 'is empty — so literally “my stomach is empty”' },
    ],
  },
  '목말라요': {
    when: 'WHEN YOU ARE THIRSTY',
    words: [
      { korean: '목', sounds: 'mok', means: 'throat' },
      { korean: '말라요', sounds: 'mal-la-yo', means: 'is dry — so literally “my throat is dry”' },
    ],
  },
  '아파요': {
    when: 'WHEN SOMETHING HURTS',
    words: [
      { korean: '아파요', sounds: 'a-pa-yo', means: 'it hurts — from 아프다; name the body part before it' },
    ],
  },
  '피곤해요': {
    when: 'WHEN YOU ARE TIRED',
    words: [
      { korean: '피곤', sounds: 'pi-gon', means: 'tiredness' },
      { korean: '해요', sounds: 'hae-yo', means: 'am — 하다 turns a noun like this into a verb' },
    ],
  },
  '도와주세요!': {
    when: 'WHEN YOU NEED HELP, URGENTLY',
    words: [
      { korean: '도와', sounds: 'do-wa', means: 'help — from 돕다' },
      { korean: '주세요', sounds: 'ju-se-yo', means: 'please do it for me' },
    ],
  },
};

export const phraseNoteFor = (korean: string): PhraseNote | null => PHRASE_NOTES[korean] ?? null;

/**
 * How many phrases each word appears in. 주세요 turns up in six of them, and
 * noticing that is worth more than learning six phrases separately — so the
 * screen can point it out. Computed, never hand-counted.
 */
export const WORD_FREQUENCY: Record<string, number> = (() => {
  const counts: Record<string, number> = {};
  Object.values(PHRASE_NOTES).forEach(note => {
    // Count each word once per phrase.
    new Set(note.words.map(w => w.korean)).forEach(w => {
      counts[w] = (counts[w] ?? 0) + 1;
    });
  });
  return counts;
})();
