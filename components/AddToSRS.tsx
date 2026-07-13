import React, { useState, useEffect } from 'react';
import { useSRSContext } from '../contexts/SRSContext';
import Icon from './Icon';

interface AddToSRSProps {
  content: {
    korean: string;
    english: string;
    romanization?: string;
    type: 'vocabulary' | 'phrase' | 'grammar' | 'character';
    category?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const LAST_DECK_KEY = 'srs-last-used-deck';

function suggestDeckName(content: AddToSRSProps['content']): string {
  const cat = content.category?.toLowerCase() ?? '';
  if (cat.includes('k-drama')) return 'K-Drama Vocabulary';
  if (cat.includes('k-pop'))   return 'K-Pop Vocabulary';
  switch (content.type) {
    case 'phrase':    return 'Common Phrases';
    case 'grammar':   return 'Grammar Patterns';
    case 'character': return 'Hangul Practice';
    default:          return 'My Vocabulary';
  }
}

export default function AddToSRS({ content, onClose, onSuccess }: AddToSRSProps) {
  const { decks, actions } = useSRSContext();


  const getInitialDeck = () => {
    if (decks.length === 1) return decks[0].id;
    const last = localStorage.getItem(LAST_DECK_KEY);
    if (last && decks.some(d => d.id === last)) return last;
    return decks[0]?.id ?? '';
  };

  const [selectedDeckId, setSelectedDeckId] = useState<string>(() => getInitialDeck());
  const [showCustomName, setShowCustomName] = useState(false);
  const [customName, setCustomName] = useState('');
  const [done, setDone] = useState(false);
  const [doneDeckName, setDoneDeckName] = useState('');

  useEffect(() => {
    setSelectedDeckId(getInitialDeck());
  }, [decks.length]);

  const addToDecks = (deckId: string, deckName: string) => {
    actions.addCardToDeck(deckId, content);
    localStorage.setItem(LAST_DECK_KEY, deckId);
    setDoneDeckName(deckName);
    setDone(true);
    setTimeout(() => { onSuccess(); }, 1200);
  };

  const handleQuickAdd = () => {
    const name = suggestDeckName(content);
    const deckId = actions.createDeck(name, `${content.type} cards`);
    addToDecks(deckId, name);
  };

  const handleCustomCreate = () => {
    const name = customName.trim();
    if (!name) return;
    const deckId = actions.createDeck(name, `${content.type} cards`);
    addToDecks(deckId, name);
  };

  const handleAddToSelected = () => {
    const deck = decks.find(d => d.id === selectedDeckId);
    if (!deck) return;
    addToDecks(deck.id, deck.name);
  };

  const suggestedName = suggestDeckName(content);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-black text-gray-900 dark:text-white">Add to SRS</h2>
          <button onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 transition-colors">
            <Icon icon="close" className="w-4 h-4" />
          </button>
        </div>

        {/* Word preview */}
        <div className="mx-5 mb-4 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(228,87,46,0.08), rgba(63,133,113,0.08))' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0"
              style={{ background: 'var(--brand-gradient)', color: 'white' }}>
              {content.korean.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="font-black text-gray-900 dark:text-white text-base leading-tight">{content.korean}</div>
              {content.romanization && <div className="text-xs text-gray-500 dark:text-gray-400">{content.romanization}</div>}
              <div className="text-xs font-semibold" style={{ color: '#E4572E' }}>{content.english}</div>
            </div>
          </div>
        </div>

        {/* Success state */}
        {done ? (
          <div className="px-5 pb-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="font-black text-gray-900 dark:text-white">Added!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Saved to <span className="font-semibold text-gray-700 dark:text-gray-300">"{doneDeckName}"</span></p>
          </div>
        ) : decks.length === 0 ? (
          /* ── No decks ── */
          <div className="px-5 pb-5 space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              You need a deck first. We'll create one in one click.
            </p>

            {!showCustomName ? (
              <>
                <button
                  onClick={handleQuickAdd}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition-transform hover:scale-[1.02] active:scale-95"
                  style={{ background: 'var(--brand-gradient)' }}
                >
                  ✨ Quick Add → Create "{suggestedName}"
                </button>
                <button
                  onClick={() => { setShowCustomName(true); setCustomName(''); }}
                  className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Name my deck instead
                </button>
              </>
            ) : (
              <>
                <input
                  autoFocus
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomCreate()}
                  placeholder={suggestedName}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F07A55] placeholder-gray-400 dark:placeholder-gray-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCustomName(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCustomCreate}
                    disabled={!customName.trim()}
                    className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ background: 'var(--brand-gradient)' }}
                  >
                    Create & Add
                  </button>
                </div>
              </>
            )}
          </div>
        ) : decks.length === 1 ? (
          /* ── Single deck — just confirm ── */
          <div className="px-5 pb-5 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-[#F5A183] dark:border-[#A83619]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: 'var(--brand-gradient)', color: 'white' }}>
                🧠
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{decks[0].name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{decks[0].cards.length} cards</div>
              </div>
              <span className="text-xs font-bold text-[#E4572E]">Selected ✓</span>
            </div>
            <button
              onClick={handleAddToSelected}
              className="w-full py-3 rounded-xl text-white font-bold text-sm transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: 'var(--brand-gradient)' }}
            >
              Add to "{decks[0].name}"
            </button>
            <button
              onClick={() => { setShowCustomName(true); setCustomName(''); }}
              className="w-full py-2 rounded-xl text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              + Create a new deck instead
            </button>
            {showCustomName && (
              <div className="space-y-2 pt-1">
                <input
                  autoFocus
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomCreate()}
                  placeholder="New deck name..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F07A55] placeholder-gray-400"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowCustomName(false)} className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-sm transition-colors">Cancel</button>
                  <button
                    onClick={handleCustomCreate}
                    disabled={!customName.trim()}
                    className="flex-1 py-2 rounded-xl text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--brand-gradient)' }}
                  >Create & Add</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Multiple decks — card picker ── */
          <div className="px-5 pb-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Choose a deck</p>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
              {decks.map(deck => (
                <button
                  key={deck.id}
                  onClick={() => setSelectedDeckId(deck.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selectedDeckId === deck.id
                      ? 'border-[#F07A55] dark:border-[#C13F22] bg-[#FDEEE6] dark:bg-[#5F2010]/20'
                      : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: 'var(--brand-gradient)', color: 'white' }}>
                    🧠
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm truncate ${selectedDeckId === deck.id ? 'text-[#A83619] dark:text-[#F5A183]' : 'text-gray-900 dark:text-white'}`}>{deck.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{deck.cards.length} cards</div>
                  </div>
                  {selectedDeckId === deck.id && <span className="text-[#E4572E] text-sm flex-shrink-0">✓</span>}
                </button>
              ))}
            </div>

            {!showCustomName ? (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowCustomName(true); setCustomName(''); }}
                  className="px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                >
                  + New Deck
                </button>
                <button
                  onClick={handleAddToSelected}
                  disabled={!selectedDeckId}
                  className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: 'var(--brand-gradient)' }}
                >
                  Add to Selected
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <input
                  autoFocus
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomCreate()}
                  placeholder="New deck name..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F07A55] placeholder-gray-400"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowCustomName(false)} className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-sm transition-colors">Cancel</button>
                  <button
                    onClick={handleCustomCreate}
                    disabled={!customName.trim()}
                    className="flex-1 py-2 rounded-xl text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--brand-gradient)' }}
                  >Create & Add</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
