// Teaching notes that sit on top of `grammarPatterns` in koreanData.ts.
//
// The pattern data carries a name, a paragraph of explanation and a couple of
// examples. What it never had is the thing that actually makes a rule click: the
// rule boiled down to ONE line, and one example taken apart so you can see which
// piece is doing the work. Those are authored here, keyed by pattern name, so
// the original data stays untouched and a pattern without a note still renders.
//
// Authored by hand — worth a proofread by a native speaker before it is treated
// as gospel.

export interface RulePart {
  /** The Korean morpheme, as written. */
  text: string;
  /** What this piece is doing, in plain English. */
  label: string;
  /** One or two words of English shown ON the piece, so Korean and meaning
   *  are always seen together. */
  gloss: string;
  /** true = the piece this rule is actually about (gets the accent colour). */
  focus?: boolean;
}

export interface GrammarNote {
  /** The whole rule in a single sentence. */
  oneLine: string;
  /** One example pulled apart: the pieces, then what they combine into. */
  parts: RulePart[];
  result: string;
  /** Plain-English reading of the assembled example, plus why it takes this form. */
  note: string;
  /** What "I ate" / "I am a student" — the meaning to build towards. */
  goal: string;
  /**
   * Which substrings to tint inside each example sentence, keyed by the exact
   * example text. Authored per sentence rather than matched by rule, because a
   * naive search would tint the 이 inside 고양이 as if it were a particle. Every
   * occurrence of a listed substring in that sentence is tinted.
   */
  marks: Record<string, string[]>;
}

export const GRAMMAR_NOTES: Record<string, GrammarNote> = {
  'A은/는 B입니다': {
    oneLine: 'Attach 은/는 to the thing you are talking about, then close the sentence with 입니다.',
    parts: [
      { text: '저', label: 'I', gloss: 'I' },
      { text: '는', label: 'topic marker', gloss: 'topic', focus: true },
      { text: '학생', label: 'student', gloss: 'student' },
      { text: '입니다', label: 'am · is', gloss: 'am' },
    ],
    result: '저는 학생입니다',
    note: '“I am a student.” 저 ends in a vowel, so it takes 는 rather than 은.',
    goal: '“I am a student.”',
    marks: {
      '저는 학생입니다.': ['는', '입니다'],
      '이것은 책입니다.': ['은', '입니다'],
    },
  },

  'A이/가 B에 있습니다/없습니다': {
    oneLine: 'Mark the subject with 이/가 and the place with 에, then say 있습니다 for “there is” or 없습니다 for “there isn’t”.',
    parts: [
      { text: '고양이', label: 'cat', gloss: 'cat' },
      { text: '가', label: 'subject marker', gloss: 'subject', focus: true },
      { text: '집', label: 'home', gloss: 'home' },
      { text: '에', label: 'at', gloss: 'at' },
      { text: '있습니다', label: 'exists', gloss: 'exists' },
    ],
    result: '고양이가 집에 있습니다',
    note: '“The cat is at home.” 고양이 ends in a vowel, so the subject marker is 가.',
    goal: '“The cat is at home.”',
    marks: {
      '고양이가 집에 있습니다.': ['가', '에', '있습니다'],
      '돈이 없습니다.': ['이', '없습니다'],
    },
  },

  'Verb-았/었어요': {
    oneLine: 'Add -았/었 before the ending to put a verb in the past.',
    parts: [
      { text: '먹', label: 'stem, “eat”', gloss: 'eat' },
      { text: '었', label: 'past marker', gloss: 'past', focus: true },
      { text: '어요', label: 'polite ending', gloss: 'polite' },
    ],
    result: '먹었어요',
    note: '“I ate.” The stem vowel is ㅓ, so it takes 었 — only ㅏ and ㅗ stems take 았.',
    goal: '“I ate.”',
    marks: {
      '어제 영화를 봤어요.': ['봤'],
      '밥을 먹었어요.': ['었'],
      '숙제를 했어요.': ['했'],
    },
  },

  'Verb-(으)ㄹ 거예요': {
    oneLine: 'Add -(으)ㄹ 거예요 to a verb stem to say what you are going to do.',
    parts: [
      { text: '공부하', label: 'stem, “study”', gloss: 'study' },
      { text: 'ㄹ', label: 'future marker', gloss: 'will', focus: true },
      { text: '거예요', label: 'polite ending', gloss: 'polite' },
    ],
    result: '공부할 거예요',
    note: '“I will study.” The stem ends in a vowel, so it takes plain ㄹ; a stem ending in a consonant would take 을.',
    goal: '“I will study.”',
    marks: {
      '내일 공부할 거예요.': ['할', '거예요'],
      '주말에 친구를 만날 거예요.': ['날', '거예요'],
    },
  },

  'Object을/를': {
    oneLine: 'Attach 을/를 to the noun that receives the action.',
    parts: [
      { text: '책', label: 'book', gloss: 'book' },
      { text: '을', label: 'object marker', gloss: 'object', focus: true },
      { text: '읽어요', label: 'read (polite)', gloss: 'read' },
    ],
    result: '책을 읽어요',
    note: '“I read a book.” 책 ends in a consonant, so the object marker is 을.',
    goal: '“I read a book.”',
    marks: {
      '저는 책을 읽어요.': ['을'],
      '사과를 좋아해요.': ['를'],
    },
  },

  '안 + Verb/Adjective': {
    oneLine: 'Put 안 directly in front of a verb or adjective to make it negative.',
    parts: [
      { text: '학교', label: 'school', gloss: 'school' },
      { text: '에', label: 'to', gloss: 'to' },
      { text: '안', label: 'not', gloss: 'not', focus: true },
      { text: '가요', label: 'go (polite)', gloss: 'go' },
    ],
    result: '학교에 안 가요',
    note: '“I don’t go to school.” 안 sits immediately before the verb, never after it.',
    goal: '“I don’t go to school.”',
    marks: {
      '학교에 안 가요.': ['안'],
      '이 음식은 안 매워요.': ['안'],
    },
  },

  'Verb-고 싶어요': {
    oneLine: 'Attach -고 싶어요 to a verb stem to say what you want to do.',
    parts: [
      { text: '한국', label: 'Korea', gloss: 'Korea' },
      { text: '에', label: 'to', gloss: 'to' },
      { text: '가', label: 'stem, “go”', gloss: 'go' },
      { text: '고 싶어요', label: 'want to', gloss: 'want to', focus: true },
    ],
    result: '한국에 가고 싶어요',
    note: '“I want to go to Korea.” 고 싶어요 attaches straight to the stem — 가, not 가요.',
    goal: '“I want to go to Korea.”',
    marks: {
      '한국에 가고 싶어요.': ['고 싶어요'],
      '영화를 보고 싶어요.': ['고 싶어요'],
    },
  },
};

export const noteFor = (pattern: string): GrammarNote | null => GRAMMAR_NOTES[pattern] ?? null;
