import React, { useState } from 'react';
import { X, Trash2, RotateCcw } from 'lucide-react';
import { useSRSContext } from '../contexts/SRSContext';
import Tooltip from './Tooltip';
import { vocabulary, commonPhrases } from '../data/koreanData';
import SRSCardPicker from './SRSCardPicker';
import type { PickerItem } from './SRSCardPicker';
import { accentFor } from '../utils/moduleAccent';

const ACC = accentFor('srs');

interface SRSManagerProps {
  onStartStudy: (deckId: string) => void;
}

const GradBtn = ({ onClick, disabled, className = '', children }: { onClick?: () => void; disabled?: boolean; className?: string; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`rounded-[10px] font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-50 ${className}`}
    style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}3D` }}
  >
    {children}
  </button>
);

const inputCls = 'kl-field w-full rounded-[10px] border border-[rgba(20,32,47,0.18)] bg-[#FFFCF4] px-3.5 py-2.5 text-[14px] text-[#16202F] placeholder-[#4A5566]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2E6B59]/40 dark:border-gray-700 dark:bg-gray-900 dark:text-white';
const labelCls = 'mb-1.5 block text-[12.5px] font-semibold text-[#4A5566] dark:text-gray-400';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="kl-card max-h-[90vh] w-full max-w-md overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[rgba(20,32,47,0.12)] p-5 dark:border-gray-800">
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-[#16202F] dark:text-white">{title}</h2>
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
    <div className="kl-card transition-transform duration-200 hover:-translate-y-0.5">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="truncate text-[16px] font-semibold text-[#16202F] dark:text-white">{deck.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{deck.description || 'No description'}</p>
          </div>
          {dueCount > 0 && (
            <Tooltip content="Cards scheduled for review today by the SM-2 algorithm." position="top" maxWidth="max-w-xs">
              <span className="flex-none rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: `${ACC.light}1F`, color: ACC.light }}>
                {dueCount} due
              </span>
            </Tooltip>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { value: deckStats.totalCards, label: 'Cards', color: '#3F8571' },
            { value: `${Math.round(deckStats.accuracy || 0)}%`, label: 'Accuracy', color: '#E4572E' },
          ].map(({ value, label, color }) => (
            <div key={label} className="kl-well rounded-xl p-3 text-center">
              <div className="text-[19px] font-bold text-[#16202F] dark:text-white">{value}</div>
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
            <div className="kl-well flex-1 rounded-[10px] py-2 text-center text-[13.5px] font-medium text-[#4A5566] dark:text-gray-400">
              Nothing due
            </div>
          )}
          <button onClick={() => onAddCard(deck.id)} className="flex-none rounded-[10px] border border-[rgba(20,32,47,0.14)] px-3 py-2 text-lg leading-none text-[#4A5566] transition-colors hover:border-[rgba(20,32,47,0.3)] dark:border-gray-700 dark:text-gray-300" title="Add Card">＋</button>
          <button onClick={() => setIsExpanded(p => !p)} className="flex-none rounded-[10px] border border-[rgba(20,32,47,0.14)] px-3 py-2 text-[#4A5566] transition-colors hover:border-[rgba(20,32,47,0.3)] dark:border-gray-700 dark:text-gray-300" title="View Cards">
            {isExpanded ? '▲' : '▼'}
          </button>
          <button onClick={() => onEditDeck(deck)} className="flex-none rounded-[10px] border border-[rgba(20,32,47,0.14)] px-3 py-2 text-[#4A5566] transition-colors hover:border-[rgba(20,32,47,0.3)] dark:border-gray-700 dark:text-gray-300" title="Edit Deck">✏️</button>
          <button onClick={() => onDeleteDeck(deck)} className="flex-none rounded-[10px] border border-[#C13F22]/30 px-3 py-2 text-[#C13F22] transition-colors hover:border-[#C13F22]" aria-label="Delete Deck">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="rounded-b-[18px] border-t border-[rgba(20,32,47,0.12)] bg-[rgba(20,32,47,0.02)] p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[14px] font-semibold text-[#16202F] dark:text-white">Cards ({deck.cards.length})</h4>
            <button onClick={() => onAddCard(deck.id)} className="text-[12.5px] font-semibold hover:underline" style={{ color: ACC.light }}>Add a card</button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {deck.cards.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-xs text-center py-4">No cards yet. Add some to start studying!</p>
            ) : (
              deck.cards.map((card: any) => (
                <div key={card.id} className="rounded-xl border border-[rgba(20,32,47,0.12)] bg-[#FFFCF4] p-3.5 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-korean text-[15px] font-semibold text-[#16202F] dark:text-white">{card.content.korean}</span>
                        {card.srs?.nextReviewDate && new Date(card.srs.nextReviewDate) <= new Date() && (
                          <span className="rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold" style={{ background: `${ACC.light}1F`, color: ACC.light }}>due</span>
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
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            
            <div>
              <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">Your decks</h1>
              <p className="mt-1.5 text-[14px] text-[#3E4A5A] dark:text-gray-400">Cards come back just before you would forget them.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowQuickImport(true); setQiImported(false); }}
              className="flex h-11 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-[14px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
            >
              Quick import
            </button>
            <GradBtn onClick={() => setShowCreateDeck(true)} className="px-5 py-2.5 text-sm">New deck</GradBtn>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: stats.todayReviews, label: "Today's Reviews", color: '#3F8571' },
            { value: stats.todayNew, label: 'New Cards', color: '#2F5D8A' },
            { value: stats.totalDue, label: 'Due for Review', color: '#E4572E' },
            { value: `${stats.streakDays}🔥`, label: 'Day Streak', color: '#F59E0B' },
          ].map(({ value, label, color }) => (
            <div key={label} className="kl-well rounded-xl p-3 text-center">
              <div className="text-[19px] font-bold text-[#16202F] dark:text-white">{value}</div>
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
        <Modal title="Quick import" onClose={() => setShowQuickImport(false)}>
          {qiImported ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-display text-[18px] font-semibold text-[#16202F] dark:text-white">Deck created</p>
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
                      style={qiSource === src ? { background: ACC.light } : {}}
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
                      style={qiCount === n ? { background: ACC.light } : {}}
                    >
                      {n === 0 ? 'All' : n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-[#EEF5F1] dark:bg-[#153327]/20 border border-[#DDEBE4] dark:border-[#1D4436] p-3 text-xs text-[#265847] dark:text-[#93C2AE]">
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
            <p className="mb-2 mt-1 font-semibold text-[#16202F] dark:text-white">"{confirmDelete.name}"</p>
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
            <p className="mb-2 mt-1 font-semibold text-[#16202F] dark:text-white">"{confirmReset.name}"</p>
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
          <div className="kl-card col-span-full p-12 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="mb-2 font-display text-[20px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">No decks yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Create your first deck to start spaced repetition learning.</p>
            <GradBtn onClick={() => setShowCreateDeck(true)} className="px-6 py-2.5 text-sm">Create Your First Deck</GradBtn>
          </div>
        )}
      </div>
    </div>
  );
}
