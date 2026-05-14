import React, { useState, useMemo, useRef, useEffect } from 'react';
import { vocabulary, commonPhrases, grammarPatterns, hangulCharacters } from '../data/koreanData';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PickerItem {
  korean: string;
  english: string;
  romanization?: string;
  type: 'vocabulary' | 'phrase' | 'grammar' | 'character';
  category: string;
}

interface SRSCardPickerProps {
  deckName: string;
  existingKorean: Set<string>;
  onAdd: (items: PickerItem[]) => void;
  onClose: () => void;
}

type TabId = 'search' | 'vocabulary' | 'phrases' | 'grammar' | 'hangul';

// ── Build searchable library once (module-level, evaluated once) ───────────────

const LIBRARY: PickerItem[] = [
  ...vocabulary.flatMap(cat =>
    cat.items.map(item => ({
      korean: item.korean,
      english: item.english,
      romanization: item.romanization,
      type: 'vocabulary' as const,
      category: cat.name,
    }))
  ),
  ...commonPhrases.map(p => ({
    korean: p.korean,
    english: p.english,
    romanization: p.romanization,
    type: 'phrase' as const,
    category: p.context || 'General',
  })),
  ...grammarPatterns.map(g => ({
    korean: g.pattern,
    english: g.explanation.length > 70 ? g.explanation.slice(0, 70) + '…' : g.explanation,
    type: 'grammar' as const,
    category: 'Grammar Patterns',
  })),
  ...hangulCharacters.map(h => ({
    korean: h.char,
    english: `${h.type === 'consonant' ? 'Consonant' : 'Vowel'} · ${h.romanization}`,
    romanization: h.romanization,
    type: 'character' as const,
    category: h.type === 'consonant' ? 'Consonants' : 'Vowels',
  })),
];

const VOCAB_CATEGORIES = [...new Set(vocabulary.map(c => c.name))];
const PHRASE_CONTEXTS  = [...new Set(commonPhrases.map(p => p.context || 'General'))];

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  vocabulary: { label: 'Vocab',  cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  phrase:     { label: 'Phrase', cls: 'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400'   },
  grammar:    { label: 'Grammar',cls: 'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400'  },
  character:  { label: 'Hangul', cls: 'bg-pink-100   text-pink-700   dark:bg-pink-900/30   dark:text-pink-400'   },
};

function normalize(s: string) { return s.toLowerCase().replace(/\s+/g, ' ').trim(); }

function matches(item: PickerItem, q: string): boolean {
  const n = normalize(q);
  return (
    normalize(item.korean).includes(n) ||
    normalize(item.english).includes(n) ||
    (item.romanization ? normalize(item.romanization).includes(n) : false) ||
    normalize(item.category).includes(n)
  );
}

// ── Word row / card shared component ─────────────────────────────────────────

function ItemRow({
  item, selected, inDeck, onToggle,
}: { item: PickerItem; selected: boolean; inDeck: boolean; onToggle: () => void }) {
  const badge = TYPE_BADGE[item.type];
  return (
    <button
      onClick={inDeck ? undefined : onToggle}
      disabled={inDeck}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
        inDeck
          ? 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/40'
          : selected
          ? 'border-pink-400 dark:border-pink-600 bg-pink-50 dark:bg-pink-900/20'
          : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-base font-black ${selected ? 'text-pink-700 dark:text-pink-300' : 'text-gray-900 dark:text-white'}`}>
            {item.korean}
          </span>
          {item.romanization && (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">{item.romanization}</span>
          )}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">{item.english}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
        {inDeck
          ? <span className="text-xs text-gray-400">✓ added</span>
          : selected
          ? <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white" style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' }}>✓</span>
          : <span className="w-5 h-5 rounded-full border-2 border-gray-200 dark:border-gray-700" />
        }
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SRSCardPicker({ deckName, existingKorean, onAdd, onClose }: SRSCardPickerProps) {
  const [tab, setTab] = useState<TabId>('search');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [vocabCat, setVocabCat] = useState<string | null>(null);
  const [phraseCat, setPhraseCat] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (tab === 'search') searchRef.current?.focus(); }, [tab]);

  const toggle = (korean: string) => {
    if (existingKorean.has(korean)) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(korean) ? next.delete(korean) : next.add(korean);
      return next;
    });
  };

  const handleAdd = () => {
    const items = LIBRARY.filter(i => selected.has(i.korean));
    if (items.length) onAdd(items);
  };

  // ── Search results ──────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return LIBRARY.filter(i => matches(i, query)).slice(0, 60);
  }, [query]);

  const TABS: { id: TabId; label: string; emoji: string }[] = [
    { id: 'search',     label: 'Search',     emoji: '🔍' },
    { id: 'vocabulary', label: 'Vocabulary',  emoji: '📖' },
    { id: 'phrases',    label: 'Phrases',     emoji: '💬' },
    { id: 'grammar',    label: 'Grammar',     emoji: '📝' },
    { id: 'hangul',     label: 'Hangul',      emoji: '한' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 z-50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white">Add Cards</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">to "{deckName}"</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 text-lg transition-colors">✕</button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                tab === t.id
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={tab === t.id ? { background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' } : {}}
            >
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0">

          {/* Search tab */}
          {tab === 'search' && (
            <div className="space-y-2">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type any word in English, Korean or romanization…"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 sticky top-0"
              />
              {!query.trim() ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-sm">Try "family", "food", "hello"…</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <div className="text-4xl mb-2">🤷</div>
                  <p className="text-sm">No results for "{query}"</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500 px-1">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
                  {searchResults.map(item => (
                    <ItemRow key={item.korean + item.type} item={item} selected={selected.has(item.korean)} inDeck={existingKorean.has(item.korean)} onToggle={() => toggle(item.korean)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vocabulary tab */}
          {tab === 'vocabulary' && (
            <div>
              {!vocabCat ? (
                <>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 px-1">Choose a category</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {VOCAB_CATEGORIES.map(cat => {
                      const catItems = vocabulary.find(c => c.name === cat)?.items ?? [];
                      const available = catItems.filter(i => !existingKorean.has(i.korean)).length;
                      return (
                        <button
                          key={cat}
                          onClick={() => setVocabCat(cat)}
                          className="flex flex-col items-start p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 transition-all text-left"
                        >
                          <span className="font-bold text-sm text-gray-900 dark:text-white">{cat}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{catItems.length} words · {available} available</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => setVocabCat(null)} className="flex items-center gap-1 text-xs font-bold mb-3 px-1" style={{ color: '#EC4899' }}>
                    ← All categories
                  </button>
                  <p className="text-sm font-black text-gray-900 dark:text-white mb-2 px-1">{vocabCat}</p>
                  <div className="space-y-1">
                    {(vocabulary.find(c => c.name === vocabCat)?.items ?? []).map(item => (
                      <ItemRow key={item.korean} item={{ ...item, type: 'vocabulary', category: vocabCat }} selected={selected.has(item.korean)} inDeck={existingKorean.has(item.korean)} onToggle={() => toggle(item.korean)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Phrases tab */}
          {tab === 'phrases' && (
            <div>
              {!phraseCat ? (
                <>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 px-1">Choose a context</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PHRASE_CONTEXTS.map(ctx => {
                      const count = commonPhrases.filter(p => (p.context || 'General') === ctx).length;
                      const available = commonPhrases.filter(p => (p.context || 'General') === ctx && !existingKorean.has(p.korean)).length;
                      return (
                        <button key={ctx} onClick={() => setPhraseCat(ctx)} className="flex flex-col items-start p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 transition-all text-left">
                          <span className="font-bold text-sm text-gray-900 dark:text-white">{ctx}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{count} phrases · {available} available</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => setPhraseCat(null)} className="flex items-center gap-1 text-xs font-bold mb-3 px-1" style={{ color: '#EC4899' }}>
                    ← All contexts
                  </button>
                  <p className="text-sm font-black text-gray-900 dark:text-white mb-2 px-1">{phraseCat}</p>
                  <div className="space-y-1">
                    {commonPhrases.filter(p => (p.context || 'General') === phraseCat).map(item => (
                      <ItemRow key={item.korean} item={{ korean: item.korean, english: item.english, romanization: item.romanization, type: 'phrase', category: phraseCat }} selected={selected.has(item.korean)} inDeck={existingKorean.has(item.korean)} onToggle={() => toggle(item.korean)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Grammar tab */}
          {tab === 'grammar' && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 px-1">{grammarPatterns.length} patterns available</p>
              {grammarPatterns.map(g => (
                <ItemRow
                  key={g.pattern}
                  item={{ korean: g.pattern, english: g.explanation.length > 70 ? g.explanation.slice(0, 70) + '…' : g.explanation, type: 'grammar', category: 'Grammar Patterns' }}
                  selected={selected.has(g.pattern)}
                  inDeck={existingKorean.has(g.pattern)}
                  onToggle={() => toggle(g.pattern)}
                />
              ))}
            </div>
          )}

          {/* Hangul tab */}
          {tab === 'hangul' && (
            <div className="space-y-4">
              {(['Consonants', 'Vowels'] as const).map(section => {
                const items = hangulCharacters.filter(h => (h.type === 'consonant' ? 'Consonants' : 'Vowels') === section);
                return (
                  <div key={section}>
                    <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">{section}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {items.map(h => {
                        const inDeck = existingKorean.has(h.char);
                        const isSel  = selected.has(h.char);
                        return (
                          <button
                            key={h.char}
                            onClick={inDeck ? undefined : () => toggle(h.char)}
                            disabled={inDeck}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center transition-all ${
                              inDeck ? 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                              : isSel ? 'border-pink-400 dark:border-pink-600 bg-pink-50 dark:bg-pink-900/20'
                              : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800'
                            }`}
                          >
                            <span className={`text-2xl font-black ${isSel ? 'text-pink-600 dark:text-pink-400' : 'text-gray-900 dark:text-white'}`}>{h.char}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{h.romanization}</span>
                            {inDeck && <span className="text-[10px] text-gray-400 mt-0.5">added</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center gap-3">
          {selected.size > 0 ? (
            <>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                <span className="font-black text-gray-900 dark:text-white">{selected.size}</span> card{selected.size !== 1 ? 's' : ''} selected
              </span>
              <button onClick={() => setSelected(new Set())} className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Clear
              </button>
              <button
                onClick={handleAdd}
                className="px-5 py-2 rounded-xl text-white text-sm font-black transition-transform hover:scale-[1.03] active:scale-95 shadow-sm"
                style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' }}
              >
                Add {selected.size} card{selected.size !== 1 ? 's' : ''} →
              </button>
            </>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 flex-1 text-center">
              Click any word to select it, then add to your deck
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
