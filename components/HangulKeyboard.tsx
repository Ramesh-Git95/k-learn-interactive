import React, { useState } from 'react';
import { Delete } from 'lucide-react';
import { hangulCharacters } from '../data/koreanData';
import { accentFor } from '../utils/moduleAccent';

// An on-screen Korean keyboard, arranged by SOUND rather than by the positions
// of a physical Korean keyboard.
//
// Most learners have no Korean input method installed, which leaves the reply
// box unusable for actual Korean. A standard 두벌식 layout would not help them
// either: on it, K is ㅏ and R is ㄱ, so the English letters say nothing about
// the sounds. Here every key carries its romanization, so a learner who is
// thinking "annyeong" can find ㅇ, ㅏ, ㄴ by their sounds — and reads the
// pairing again every time they type, which is where the incidental learning
// comes from.
//
// Letters are assembled into syllable blocks by utils/hangulCompose.

const ACC = accentFor('conversation');

const ROMAN: Record<string, string> = Object.fromEntries(
  hangulCharacters.map(c => [c.char, c.romanization]),
);

const consonants = hangulCharacters.filter(c => c.type === 'consonant').map(c => c.char);
const vowels = hangulCharacters.filter(c => c.type === 'vowel').map(c => c.char);

// The 14 + 10 a beginner needs, then the doubles and combinations behind a toggle.
const BASIC_CONSONANTS = consonants.slice(0, 14);
const TENSE_CONSONANTS = consonants.slice(14);
const BASIC_VOWELS = vowels.slice(0, 10);
const COMPOUND_VOWELS = vowels.slice(10);

interface Props {
  /** Current box contents, echoed back so the assembly is visible. */
  value: string;
  onJamo: (jamo: string) => void;
  onSpace: () => void;
  onBackspace: () => void;
  onClose: () => void;
}

const HangulKeyboard: React.FC<Props> = ({ value, onJamo, onSpace, onBackspace, onClose }) => {
  const [showMore, setShowMore] = useState(false);

  const Key: React.FC<{ jamo: string }> = ({ jamo }) => (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={() => onJamo(jamo)}
      className="flex h-12 min-w-[42px] flex-col items-center justify-center rounded-lg border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0 dark:border-gray-700 dark:bg-gray-900"
      aria-label={`${jamo}, sounds like ${ROMAN[jamo] ?? ''}`}
    >
      <span className="font-korean text-[17px] font-bold leading-none text-[#16202F] dark:text-white">{jamo}</span>
      <span className="mt-1 text-[10px] leading-none text-[#4A5566] dark:text-gray-500">{ROMAN[jamo]}</span>
    </button>
  );

  const Group: React.FC<{ label: string; chars: string[] }> = ({ label, chars }) => (
    <div className="mb-3">
      <div className="mb-1.5 text-[11.5px] font-semibold text-[#4A5566] dark:text-gray-500">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {chars.map(c => <Key key={c} jamo={c} />)}
      </div>
    </div>
  );

  return (
    <div className="mt-3 rounded-xl border border-[rgba(20,32,47,0.14)] bg-[rgba(255,252,244,0.6)] p-3.5 dark:border-gray-800 dark:bg-gray-900/40">
      {/* Echo what is being built. Letters combine into blocks as you tap, and
          seeing that happen is the whole reassurance that it is working. */}
      <div
        className="mb-3 flex min-h-[52px] items-center rounded-lg px-3.5 py-2"
        style={{ background: `${ACC.light}12`, border: `1px solid ${ACC.light}33` }}
      >
        {value ? (
          <span className="break-all font-korean text-[22px] font-bold text-[#16202F] dark:text-white">
            {value}
          </span>
        ) : (
          <span className="text-[13px] text-[#4A5566] dark:text-gray-500">
            Tap ㅇ then ㅏ then ㄴ — they become 안
          </span>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[12.5px] text-[#4A5566] dark:text-gray-400">
          Letters join into syllables on their own.
        </span>
        <button
          onClick={onClose}
          className="flex-none text-[12.5px] font-semibold text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-500 dark:hover:text-gray-300"
        >
          Hide
        </button>
      </div>

      <Group label="CONSONANTS" chars={BASIC_CONSONANTS} />
      <Group label="VOWELS" chars={BASIC_VOWELS} />

      {showMore && (
        <div className="kl-drawer-panel">
          <Group label="DOUBLE CONSONANTS" chars={TENSE_CONSONANTS} />
          <Group label="COMBINED VOWELS" chars={COMPOUND_VOWELS} />
        </div>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowMore(v => !v)}
          className="flex h-11 items-center rounded-lg border border-[rgba(20,32,47,0.14)] px-3.5 text-[12.5px] font-semibold text-[#4A5566] transition-colors hover:text-[#16202F] dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {showMore ? 'Fewer letters' : 'More letters'}
        </button>
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={onSpace}
          className="flex h-11 flex-1 items-center justify-center rounded-lg border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[12.5px] font-semibold text-[#4A5566] transition-colors hover:text-[#16202F] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          space
        </button>
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={onBackspace}
          className="flex h-11 items-center gap-2 rounded-lg px-4 text-[12.5px] font-semibold text-white"
          style={{ background: ACC.light }}
          aria-label="Delete one letter"
        >
          <Delete className="h-4 w-4" />
          delete
        </button>
      </div>
    </div>
  );
};

export default HangulKeyboard;
