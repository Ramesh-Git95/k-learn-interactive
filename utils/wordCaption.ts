// The caption that goes with the Word of the Day card.
//
// The card is an image, and an image cannot be searched, cannot be clicked, and
// is invisible to a screen reader. So the caption carries the three things the
// picture cannot: the word as text, a link that works, and enough context to be
// worth reading on its own.
//
// Why the middle line rotates rather than staying fixed: posting byte-identical
// text every day is what spam looks like, to Facebook's ranking and to a person
// seeing the fourteenth one. The skeleton stays the same so the page becomes
// recognisable; one line moves so it never repeats exactly. Keyed to the
// weekday, so the same day always produces the same caption — predictable, and
// a post rewritten later does not silently change.

export interface CaptionWord {
  korean: string;
  romanization: string;
  english: string;
}

/**
 * One per weekday, indexed by Date.getDay() — 0 is Sunday.
 * Two of the seven invite a reply: comments are what make the next post reach
 * anyone, and a page nobody answers is shown to nobody.
 */
export const ROTATING_LINES = [
  'One word a day is 365 a year. That adds up faster than you think.',
  'Say it out loud once. That is what makes it stick.',
  'You will hear this one in almost any drama.',
  'Know this word already? Put it in a sentence below. 👇',
  'Save this one — it comes up constantly.',
  'Small word, used everywhere.',
  'Which word should go up tomorrow? Tell me. 👇',
];

const CLOSING = 'Learn Korean properly, from K-drama to TOPIK → korean-learn.com';

const HASHTAGS = '#LearnKorean #Korean #한국어 #Hangul #KDrama #KoreanLanguage #KoreanStudy';

/**
 * Builds the caption for a word.
 *
 * `date` decides which rotating line is used; it is a parameter rather than
 * `new Date()` inside so the result can be tested and so a caption regenerated
 * for the same day comes out the same.
 */
export function buildWordCaption(word: CaptionWord, date: Date = new Date()): string {
  const line = ROTATING_LINES[date.getDay() % ROTATING_LINES.length];

  // The first line is the only part Facebook shows before "See more", so the
  // word and its meaning go there and nothing else competes for the space.
  return [
    `${word.korean} — ${word.english}`,
    `/ ${word.romanization} /`,
    '',
    line,
    '',
    CLOSING,
    '',
    HASHTAGS,
  ].join('\n');
}
