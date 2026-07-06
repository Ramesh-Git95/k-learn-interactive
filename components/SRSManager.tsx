import React, { useState } from 'react';
import { X, Trash2, RotateCcw } from 'lucide-react';
import { useSRSContext } from '../contexts/SRSContext';
import Tooltip from './Tooltip';
import { vocabulary, commonPhrases } from '../data/koreanData';
import SRSCardPicker from './SRSCardPicker';
import type { PickerItem } from './SRSCardPicker';

interface SRSManagerProps {
  onStartStudy: (deckId: string) => void;
}

const GradBtn = ({ onClick, disabled, className = '', children }: { onClick?: () => void; disabled?: boolean; className?: string; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`font-bold rounded-xl btn-brand ${className}`}
  >
    {children}
  </button>
);

const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 text-sm transition-colors';
const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function DeckCard({ deck, dueCount, deckStats, onStartStudy, onAddCard, onEditDeck, onDeleteDeck, onEditCard, onDeleteCard, onResetCard }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{deck.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{deck.description || 'No description'}</p>
          </div>
          {dueCount > 0 && (
            <Tooltip content="Cards scheduled for review today by the SM-2 algorithm." position="top" maxWidth="max-w-xs">
              <span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full badge-brand">
                {dueCount} due
              </span>
            </Tooltip>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { value: deckStats.totalCards, label: 'Cards', color: '#8B5CF6' },
            { value: `${Math.round(deckStats.accuracy || 0)}%`, label: 'Accuracy', color: '#EC4899' },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
              <div className="text-xl font-black" style={{ color }}>{value}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {dueCount > 0 ? (
            <GradBtn onClick={() => onStartStudy(deck.id)} className="flex-1 py-2 text-sm">
              Study ({dueCount})
            </GradBtn>
          ) : (
            <div className="flex-1 py-2 rounded-xl text-center text-sm font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800">
              All caught up ✓
            </div>
          )}
          <button onClick={() => onAddCard(deck.id)} className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-lg transition-colors" title="Add Card">＋</button>
          <button onClick={() => setIsExpanded(p => !p)} className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors" title="View Cards">
            {isExpanded ? '▲' : '▼'}
          </button>
          <button onClick={() => onEditDeck(deck)} className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors" title="Edit Deck">✏️</button>
          <button onClick={() => onDeleteDeck(deck)} className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 transition-colors" aria-label="Delete Deck">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-950/50 rounded-b-2xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Cards ({deck.cards.length})</h4>
            <button onClick={() => onAddCard(deck.id)} className="text-xs font-semibold" style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>+ Add Card</button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {deck.cards.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-xs text-center py-4">No cards yet. Add some to start studying!</p>
            ) : (
              deck.cards.map((card: any) => (
                <div key={card.id} className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{card.content.korean}</span>
                        {card.srs?.nextReviewDate && new Date(card.srs.nextReviewDate) <= new Date() && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full badge-brand">Due</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{card.content.english}</div>
                      {card.content.romanization && <div className="text-[11px] text-gray-400 dark:text-gray-500 italic">{card.content.romanization}</div>}
                      <div className="flex gap-3 mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                        <span>Reviews: {card.srs?.totalReviews || 0}</span>
                        <span>Accuracy: {Math.round(card.performance?.successRate || 0)}%</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => onResetCard(deck.id, card.id)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-400 transition-colors" aria-label="Reset card">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDeleteCard(deck.id, card)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors" aria-label="Delete card">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const VOCAB_CATEGORIES = vocabulary.map(c => c.name);

export default function SRSManager({ onStartStudy }: SRSManagerProps) {
  const { decks, stats, actions } = useSRSContext();
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [showAddCard, setShowAddCard] = useState<string | null>(null);
  const [editingDeck, setEditingDeck] = useState<{ id: string; name: string; description: string } | null>(null);
  const [editingCard, setEditingCard] = useState<{ deckId: string; cardId: string; content: any } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'deck' | 'card'; deckId: string; cardId?: string; name: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState<{ deckId: string; cardId: string; name: string } | null>(null);

  // Quick Import state
  const [showQuickImport, setShowQuickImport] = useState(false);
  const [qiSource, setQiSource] = useState<'vocabulary' | 'phrases'>('vocabulary');
  const [qiCategory, setQiCategory] = useState(VOCAB_CATEGORIES[0]);
  const [qiCount, setQiCount] = useState<number>(20);
  const [qiImported, setQiImported] = useState(false);

  const handleQuickImport = () => {
    let items: { korean: string; english: string; romanization?: string }[] = [];
    let deckName = '';

    if (qiSource === 'vocabulary') {
      const cat = vocabulary.find(c => c.name === qiCategory);
      if (!cat) return;
      const pool = qiCount === 0 ? cat.items : cat.items.slice(0, qiCount);
      items = pool.map(i => ({ korean: i.korean, english: i.english, romanization: i.romanization }));
      deckName = `${qiCategory} Vocabulary`;
    } else {
      const pool = qiCount === 0 ? commonPhrases : commonPhrases.slice(0, qiCount);
      items = pool.map(p => ({ korean: p.korean, english: p.english, romanization: p.romanization }));
      deckName = 'Common Phrases';
    }

    const deckId = actions.createDeck(deckName, `Imported from ${qiSource}`);
    items.forEach(item => {
      actions.addCardToDeck(deckId, { korean: item.korean, english: item.english, romanization: item.romanization, type: qiSource === 'phrases' ? 'phrase' : 'vocabulary' });
    });
    setQiImported(true);
    setTimeout(() => { setShowQuickImport(false); setQiImported(false); }, 1500);
  };

  const handleCreateDeck = () => {
    if (newDeckName.trim()) {
      actions.createDeck(newDeckName.trim(), newDeckDescription.trim());
      setNewDeckName(''); setNewDeckDescription(''); setShowCreateDeck(false);
    }
  };

  const handlePickerAdd = (deckId: string, items: PickerItem[]) => {
    items.forEach(item => actions.addCardToDeck(deckId, item));
    setShowAddCard(null);
  };

  const handleSaveEditDeck = () => {
    if (editingDeck?.name.trim()) { actions.editDeck(editingDeck.id, editingDeck.name, editingDeck.description); setEditingDeck(null); }
  };

  const handleSaveEditCard = () => {
    if (editingCard?.content.korean.trim() && editingCard.content.english.trim()) { actions.editCard(editingCard.deckId, editingCard.cardId, editingCard.content); setEditingCard(null); }
  };

  const confirmDeleteAction = () => {
    if (confirmDelete) {
      if (confirmDelete.type === 'deck') actions.deleteDeck(confirmDelete.deckId);
      else if (confirmDelete.cardId) actions.deleteCard(confirmDelete.deckId, confirmDelete.cardId);
      setConfirmDelete(null);
    }
  };

  const confirmResetAction = () => {
    if (confirmReset) { actions.resetCard(confirmReset.deckId, confirmReset.cardId); setConfirmReset(null); }
  };

  const getDueCardsCount = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return 0;
    const now = new Date();
    return deck.cards.filter(card => new Date(card.srs.nextReviewDate) <= now).length;
  };

  const cardFormFields = (
    values: any,
    onChange: (f: string, v: string) => void
  ) => (
    <div className="space-y-3">
      <div><label className={labelCls}>Korean *</label><input className={inputCls} value={values.korean} onChange={e => onChange('korean', e.target.value)} placeholder="안녕하세요" /></div>
      <div><label className={labelCls}>English *</label><input className={inputCls} value={values.english} onChange={e => onChange('english', e.target.value)} placeholder="Hello" /></div>
      <div><label className={labelCls}>Romanization</label><input className={inputCls} value={values.romanization || ''} onChange={e => onChange('romanization', e.target.value)} placeholder="annyeonghaseyo" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type</label>
          <select className={inputCls} value={values.type} onChange={e => onChange('type', e.target.value)}>
            <option value="vocabulary">Vocabulary</option>
            <option value="phrase">Phrase</option>
            <option value="grammar">Grammar</option>
            <option value="character">Character</option>
          </select>
        </div>
        <div><label className={labelCls}>Category</label><input className={inputCls} value={values.category || ''} onChange={e => onChange('category', e.target.value)} placeholder="Greetings" /></div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>🧠</div>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white">Spaced Repetition</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">SM-2 algorithm · review before you forget</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowQuickImport(true); setQiImported(false); }}
              className="px-4 py-2.5 text-sm font-bold rounded-xl border border-violet-200 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            >
              ⚡ Quick Import
            </button>
            <GradBtn onClick={() => setShowCreateDeck(true)} className="px-5 py-2.5 text-sm">+ New Deck</GradBtn>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: stats.todayReviews, label: "Today's Reviews", color: '#8B5CF6' },
            { value: stats.todayNew, label: 'New Cards', color: '#06B6D4' },
            { value: stats.totalDue, label: 'Due for Review', color: '#EC4899' },
            { value: `${stats.streakDays}🔥`, label: 'Day Streak', color: '#F59E0B' },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
              <div className="text-xl font-black" style={{ color }}>{value}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Deck Modal */}
      {showCreateDeck && (
        <Modal title="Create New Deck" onClose={() => setShowCreateDeck(false)}>
          <div className="space-y-4">
            <div><label className={labelCls}>Deck Name *</label><input className={inputCls} value={newDeckName} onChange={e => setNewDeckName(e.target.value)} placeholder="e.g., Basic Vocabulary" autoFocus /></div>
            <div><label className={labelCls}>Description</label><textarea className={inputCls} value={newDeckDescription} onChange={e => setNewDeckDescription(e.target.value)} rows={3} placeholder="Brief description..." /></div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowCreateDeck(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <GradBtn onClick={handleCreateDeck} disabled={!newDeckName.trim()} className="flex-1 py-2.5 text-sm">Create Deck</GradBtn>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Import Modal */}
      {showQuickImport && (
        <Modal title="⚡ Quick Import" onClose={() => setShowQuickImport(false)}>
          {qiImported ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-black text-gray-900 dark:text-white text-lg">Deck Created!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cards imported successfully.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Source</label>
                <div className="flex gap-2">
                  {(['vocabulary', 'phrases'] as const).map(src => (
                    <button
                      key={src}
                      onClick={() => setQiSource(src)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        qiSource === src
                          ? 'text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}
                      style={qiSource === src ? { background: 'var(--brand-gradient)' } : {}}
                    >
                      {src === 'vocabulary' ? '📖 Vocabulary' : '💬 Phrases'}
                    </button>
                  ))}
                </div>
              </div>

              {qiSource === 'vocabulary' && (
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    className={inputCls}
                    value={qiCategory}
                    onChange={e => setQiCategory(e.target.value)}
                  >
                    {VOCAB_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelCls}>How many cards?</label>
                <div className="flex gap-2 flex-wrap">
                  {[10, 20, 30, 50, 0].map(n => (
                    <button
                      key={n}
                      onClick={() => setQiCount(n)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        qiCount === n
                          ? 'text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}
                      style={qiCount === n ? { background: 'var(--brand-gradient)' } : {}}
                    >
                      {n === 0 ? 'All' : n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 p-3 text-xs text-violet-700 dark:text-violet-300">
                Creates a new deck "{qiSource === 'vocabulary' ? qiCategory : 'Common Phrases'}" with{' '}
                {qiCount === 0
                  ? `all ${qiSource === 'vocabulary' ? (vocabulary.find(c => c.name === qiCategory)?.items.length ?? 0) : commonPhrases.length}`
                  : Math.min(qiCount, qiSource === 'vocabulary' ? (vocabulary.find(c => c.name === qiCategory)?.items.length ?? 0) : commonPhrases.length)
                } cards ready to study.
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowQuickImport(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <GradBtn onClick={handleQuickImport} className="flex-1 py-2.5 text-sm">
                  Import Cards →
                </GradBtn>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Add Card Picker */}
      {showAddCard && (() => {
        const deck = decks.find(d => d.id === showAddCard);
        if (!deck) return null;
        const existingKorean = new Set(deck.cards.map(c => c.content.korean));
        return (
          <SRSCardPicker
            deckName={deck.name}
            existingKorean={existingKorean}
            onAdd={items => handlePickerAdd(showAddCard, items)}
            onClose={() => setShowAddCard(null)}
          />
        );
      })()}

      {/* Edit Deck Modal */}
      {editingDeck && (
        <Modal title="Edit Deck" onClose={() => setEditingDeck(null)}>
          <div className="space-y-4">
            <div><label className={labelCls}>Deck Name *</label><input className={inputCls} value={editingDeck.name} onChange={e => setEditingDeck({ ...editingDeck, name: e.target.value })} /></div>
            <div><label className={labelCls}>Description</label><textarea className={inputCls} value={editingDeck.description} onChange={e => setEditingDeck({ ...editingDeck, description: e.target.value })} rows={3} /></div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditingDeck(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <GradBtn onClick={handleSaveEditDeck} disabled={!editingDeck.name.trim()} className="flex-1 py-2.5 text-sm">Save Changes</GradBtn>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Card Modal */}
      {editingCard && (
        <Modal title="Edit Card" onClose={() => setEditingCard(null)}>
          <div className="space-y-4">
            {cardFormFields(editingCard.content, (f, v) => setEditingCard(p => p ? { ...p, content: { ...p.content, [f]: v } } : p))}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditingCard(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <GradBtn onClick={handleSaveEditCard} disabled={!editingCard.content.korean.trim() || !editingCard.content.english.trim()} className="flex-1 py-2.5 text-sm">Save Changes</GradBtn>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <Modal title="Confirm Delete" onClose={() => setConfirmDelete(null)}>
          <div className="text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <p className="text-sm text-gray-700 dark:text-gray-300">Delete this {confirmDelete.type}?</p>
            <p className="font-bold text-gray-900 dark:text-white mt-1 mb-2">"{confirmDelete.name}"</p>
            {confirmDelete.type === 'deck' && <p className="text-xs text-red-500 mb-4">All cards will be permanently deleted.</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={confirmDeleteAction} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors">Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Reset Modal */}
      {confirmReset && (
        <Modal title="Reset Card Progress" onClose={() => setConfirmReset(null)}>
          <div className="text-center">
            <div className="text-4xl mb-3">🔄</div>
            <p className="text-sm text-gray-700 dark:text-gray-300">Reset progress for:</p>
            <p className="font-bold text-gray-900 dark:text-white mt-1 mb-2">"{confirmReset.name}"</p>
            <p className="text-xs text-blue-500 mb-4">Learning history will be cleared but card content stays.</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setConfirmReset(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <GradBtn onClick={confirmResetAction} className="flex-1 py-2.5 text-sm">Reset Progress</GradBtn>
            </div>
          </div>
        </Modal>
      )}

      {/* Decks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {decks.map(deck => (
          <DeckCard
            key={deck.id}
            deck={deck}
            dueCount={getDueCardsCount(deck.id)}
            deckStats={actions.getDeckStats(deck.id)}
            onStartStudy={onStartStudy}
            onAddCard={setShowAddCard}
            onEditDeck={(d: any) => setEditingDeck({ id: d.id, name: d.name, description: d.description || '' })}
            onDeleteDeck={(d: any) => setConfirmDelete({ type: 'deck', deckId: d.id, name: d.name })}
            onEditCard={(deckId: string, card: any) => setEditingCard({ deckId, cardId: card.id, content: { ...card.content } })}
            onDeleteCard={(deckId: string, card: any) => setConfirmDelete({ type: 'card', deckId, cardId: card.id, name: `${card.content.korean} (${card.content.english})` })}
            onResetCard={(deckId: string, cardId: string) => {
              const d = decks.find(x => x.id === deckId);
              const c = d?.cards.find(x => x.id === cardId);
              if (c) setConfirmReset({ deckId, cardId, name: `${c.content.korean} (${c.content.english})` });
            }}
          />
        ))}

        {decks.length === 0 && (
          <div className="col-span-full bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Study Decks Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Create your first deck to start spaced repetition learning.</p>
            <GradBtn onClick={() => setShowCreateDeck(true)} className="px-6 py-2.5 text-sm">Create Your First Deck</GradBtn>
          </div>
        )}
      </div>
    </div>
  );
}
