import React, { useMemo, useState } from 'react';
import { ChevronDown, Search, Volume2, CheckCircle2, BookOpen } from 'lucide-react';
import type { HangulCharacter } from '../types';
import { hangulCharacters, vocabulary } from '../data/koreanData';
import { getStrokes } from '../data/strokeData';
import { jamoOf } from '../utils/pronunciation';
import { accentFor } from '../utils/moduleAccent';

// The full alphabet, inside the drawer.
//
// 40 letters is a reference table, not a lesson — so it gets the tools a table
// needs: search (by letter, sound or the meaning of a word that uses it),
// filters, and four collapsible groups rather than one flat wall. Each card
// carries its own audio and its own learned toggle, so marking a letter no
// longer requires playing it.

const ACC = accentFor('hangul');

// The four real groups of Hangul. Basic letters are learned first; tense
// consonants and compound vowels are built from them.
const GROUPS: { id: string; title: string; korean: string; chars: string[] }[] = [
  { id: 'consonant',        title: 'Basic consonants',  korean: '자음',   chars: ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'] },
  { id: 'double-consonant', title: 'Tense consonants',  korean: '쌍자음', chars: ['ㄲ','ㄸ','ㅃ','ㅆ','ㅉ'] },
  { id: 'vowel',            title: 'Basic vowels',      korean: '모음',   chars: ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ'] },
  { id: 'compound-vowel',   title: 'Compound vowels',   korean: '복합모음', chars: ['ㅐ','ㅒ','ㅔ','ㅖ','ㅘ','ㅙ','ㅚ','ㅝ','ㅞ','ㅟ','ㅢ'] },
];

type Filter = 'all' | 'consonant' | 'vowel' | 'learned';

// Words that use a given letter — searchable even before they are readable.
const wordsUsing = (() => {
  const map = new Map<string, { korean: string; english: string }[]>();
  const items = vocabulary.flatMap(c => c.items).filter(it => !/\s/.test(it.korean) && it.korean.length <= 3);
  for (const it of items) {
    for (const j of new Set(jamoOf(it.korean))) {
      if (!map.has(j)) map.set(j, []);
      map.get(j)!.push({ korean: it.korean, english: it.english });
    }
  }
  return map;
})();

interface Props {
  currentChar: string;
  isStudied: (char: string) => boolean;
  studiedCount: number;
  onSelect: (char: string) => void;
  onToggleStudied: (char: string) => void;
  onSpeak: (char: string) => void;
  close: () => void;
}

const HangulAlphabetDrawer: React.FC<Props> = ({
  currentChar, isStudied, studiedCount, onSelect, onToggleStudied, onSpeak, close,
}) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  // The group holding the current letter opens by default; the rest stay folded.
  const groupOfCurrent = GROUPS.find(g => g.chars.includes(currentChar))?.id;
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map(g => [g.id, g.id === groupOfCurrent])));

  const allExpanded = GROUPS.every(g => expanded[g.id]);
  const toggleAll = () =>
    setExpanded(Object.fromEntries(GROUPS.map(g => [g.id, !allExpanded])));

  const byChar = useMemo(() => {
    const m = new Map<string, HangulCharacter>();
    hangulCharacters.forEach(c => m.set(c.char, c));
    return m;
  }, []);

  const counts = {
    all: hangulCharacters.length,
    consonant: GROUPS[0].chars.length + GROUPS[1].chars.length,
    vowel: GROUPS[2].chars.length + GROUPS[3].chars.length,
    learned: studiedCount,
  };

  const matches = (char: string): boolean => {
    const meta = byChar.get(char);
    if (!meta) return false;

    if (filter === 'learned' && !isStudied(char)) return false;
    if (filter === 'consonant' && meta.type !== 'consonant') return false;
    if (filter === 'vowel' && meta.type !== 'vowel') return false;

    const q = query.trim().toLowerCase();
    if (!q) return true;
    if (char.includes(q) || meta.romanization.toLowerCase().includes(q)) return true;
    return (wordsUsing.get(char) ?? []).some(
      w => w.korean.includes(q) || w.english.toLowerCase().includes(q));
  };

  const tab = (id: Filter, label: string, n: number) => (
    <button
      key={id}
      onClick={() => setFilter(id)}
      className={`inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-[9px] px-3.5 text-[12.5px] font-semibold leading-none transition-colors ${
        filter === id
          ? 'text-white'
          : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
      }`}
      style={filter === id ? { background: ACC.light } : undefined}
    >
      {label} ({n})
    </button>
  );

  return (
    <div className="kl-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-3.5 border-b border-[rgba(20,32,47,0.12)] bg-[rgba(20,32,47,0.02)] p-4 sm:p-5 md:flex-row md:items-center md:justify-between dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {tab('all', 'All', counts.all)}
          {tab('consonant', 'Consonants', counts.consonant)}
          {tab('vowel', 'Vowels', counts.vowel)}
          <button
            onClick={() => setFilter('learned')}
            className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] px-3.5 text-[12.5px] font-semibold leading-none transition-colors ${
              filter === 'learned'
                ? 'bg-[#2E6B59] text-white'
                : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Learned ({counts.learned})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-[9px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-3 text-[12.5px] font-semibold leading-none text-[#4A5566] transition-colors hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
          <div className="relative min-w-0 flex-1 md:w-64 md:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5566]" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search ㅂ, b, or 'rice'…"
              className="h-9 w-full rounded-[9px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] pl-9 pr-8 text-[12.5px] text-[#16202F] outline-none transition-colors placeholder:text-[#4A5566] focus:border-[#C13F22] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#4A5566] hover:text-[#16202F]"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Groups */}
      <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4 sm:p-5">
        {GROUPS.map(group => {
          const visible = group.chars.filter(matches);
          if (visible.length === 0) return null;
          const open = expanded[group.id] ?? false;
          const learnedHere = group.chars.filter(isStudied).length;

          return (
            <div key={group.id} className="overflow-hidden rounded-2xl border border-[rgba(20,32,47,0.10)] dark:border-gray-800">
              <button
                onClick={() => setExpanded(e => ({ ...e, [group.id]: !open }))}
                className="flex w-full items-center justify-between gap-3 border-b border-[rgba(20,32,47,0.10)] bg-[rgba(20,32,47,0.025)] px-4 py-3.5 text-left transition-colors hover:bg-[rgba(20,32,47,0.045)] dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-lg font-korean text-[15px] font-bold"
                    style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}45`, color: ACC.light }}
                  >
                    {group.chars[0]}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-[#16202F] dark:text-white">
                      {group.title}
                      <span className="font-korean text-[12.5px] font-medium text-[#4A5566] dark:text-gray-500">{group.korean}</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-[#4A5566] dark:text-gray-500">
                      {learnedHere} of {group.chars.length} learned
                      {visible.length !== group.chars.length && ` · ${visible.length} shown`}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 flex-none text-[#4A5566] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {visible.map((char, i) => {
                    const meta = byChar.get(char)!;
                    const learned = isStudied(char);
                    const selected = char === currentChar;
                    const strokes = getStrokes(char)?.strokes.length ?? 0;

                    return (
                      <div
                        key={char}
                        className="kl-cascade"
                        style={{ animationDelay: `${i * 45}ms` }}
                      >
                        <button
                          onClick={() => { onSelect(char); onSpeak(char); }}
                          className="group flex w-full flex-col rounded-2xl border p-3 transition-all duration-200 hover:-translate-y-0.5"
                          style={selected
                            ? { borderColor: ACC.light, background: `${ACC.light}12`, boxShadow: `0 0 0 1px ${ACC.light}` }
                            : { borderColor: 'rgba(20,32,47,0.12)' }}
                          title={`${char} · ${meta.romanization}`}
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={e => { e.stopPropagation(); onToggleStudied(char); }}
                              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onToggleStudied(char); } }}
                              className="rounded-full p-0.5 transition-colors"
                              style={{ color: learned ? '#2E6B59' : 'rgba(20,32,47,0.22)' }}
                              title={learned ? 'Learned — tap to unmark' : 'Mark as learned'}
                            >
                              <CheckCircle2 className="h-[18px] w-[18px]" fill={learned ? '#2E6B59' : 'none'} stroke={learned ? '#fff' : 'currentColor'} />
                            </span>
                            <span
                              className="rounded-md p-1 text-[#4A5566] transition-colors group-hover:text-[#C13F22]"
                              aria-hidden="true"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </span>
                          </div>

                          <span className="my-1 text-center font-korean text-[30px] font-bold leading-none text-[#16202F] transition-transform group-hover:scale-110 dark:text-white">
                            {char}
                          </span>

                          <span className="mt-2 border-t border-[rgba(20,32,47,0.08)] pt-2 text-center dark:border-gray-800">
                            <span className="block text-[12.5px] font-semibold text-[#16202F] dark:text-gray-200">{meta.romanization}</span>
                            {strokes > 0 && (
                              <span className="mt-0.5 block text-[11px] text-[#4A5566] dark:text-gray-500">
                                {strokes} {strokes === 1 ? 'stroke' : 'strokes'}
                              </span>
                            )}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {GROUPS.every(g => g.chars.filter(matches).length === 0) && (
          <p className="py-8 text-center text-[13.5px] text-[#4A5566] dark:text-gray-400">
            Nothing matches “{query}”. Try a letter, a sound like <em>b</em>, or a word meaning like <em>rice</em>.
          </p>
        )}
      </div>

      {/* Footer — printed guidance, not a hover hint */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(20,32,47,0.12)] bg-[rgba(20,32,47,0.02)] px-4 py-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
        <span className="flex items-center gap-2 text-[12.5px] text-[#4A5566] dark:text-gray-400">
          <BookOpen className="h-4 w-4" style={{ color: ACC.light }} />
          Tap any letter to hear it and open its strokes above.
        </span>
        <button onClick={close} className="text-[12.5px] font-semibold" style={{ color: ACC.light }}>
          Close drawer ↑
        </button>
      </div>
    </div>
  );
};

export default HangulAlphabetDrawer;
