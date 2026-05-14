import React, { useState } from 'react';
import { useSRSContext } from '../contexts/SRSContext';
import Icon from './Icon';
import { useToastContext } from '../contexts/ToastContext';

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

export default function AddToSRS({ content, onClose, onSuccess }: AddToSRSProps) {
  const { decks, actions } = useSRSContext();
  const { showToast } = useToastContext();
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  const handleAddToExistingDeck = () => {
    console.log('🎯 Adding card to existing deck:', selectedDeckId);
    console.log('📝 Card content:', content);
    
    if (selectedDeckId) {
      try {
        // Use the useSRS hook's addCardToDeck method which handles both localStorage and database sync
        actions.addCardToDeck(selectedDeckId, content);
        
        // Find deck name for toast message
        const deck = decks.find(d => d.id === selectedDeckId);
        const deckName = deck ? deck.name : 'Unknown Deck';
        
        // Show success toast
        showToast(`Successfully added "${content.korean}" to ${deckName}!`, 'success');
        
        onSuccess();
        
      } catch (error) {
        console.error('❌ Error adding card to deck:', error);
        showToast('Error adding card to deck. Please try again.', 'error');
      }
    } else {
      console.warn('⚠️ No deck selected');
      showToast('Please select a deck first.', 'warning');
    }
  };

  const handleCreateDeckAndAdd = () => {
    console.log('🆕 Creating new deck and adding card:', newDeckName.trim());
    console.log('📝 Card content:', content);
    
    if (newDeckName.trim()) {
      try {
        // Use the useSRS hook's createDeck method
        const deckId = actions.createDeck(newDeckName.trim(), `Deck for ${content.type}s`);
        console.log('✅ New deck created with ID:', deckId);
        
        // Add the card to the newly created deck
        actions.addCardToDeck(deckId, content);
        
        // Show success toast
        showToast(`Created deck "${newDeckName.trim()}" and added "${content.korean}"!`, 'success');
        
        onSuccess();
        
      } catch (error) {
        console.error('❌ Error creating deck and adding card:', error);
        showToast('Error creating deck and adding card. Please try again.', 'error');
      }
    } else {
      console.warn('⚠️ Deck name is empty');
      showToast('Please enter a deck name.', 'warning');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add to SRS Deck</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Icon icon="close" className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Preview Card */}
        <div className="bg-blue-50 dark:bg-gray-900-hover rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">{content.korean}</div>
            {content.romanization && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{content.romanization}</div>
            )}
            <div className="text-blue-600 dark:text-pink-400 font-medium">{content.english}</div>
            <div className="inline-block bg-blue-100 dark:bg-pink-500/20 text-blue-800 dark:text-pink-400 px-2 py-1 rounded-full text-xs font-medium mt-2">
              {content.type}
            </div>
          </div>
        </div>

        {!showCreateDeck ? (
          <div className="space-y-4">
            {decks.length > 0 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Select Deck
                  </label>
                  <select
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 focus:border-blue-500 dark:focus:border-pink-500 transition-colors"
                  >
                    <option value="">Choose a deck...</option>
                    {decks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.name} ({deck.cards.length} cards)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddToExistingDeck}
                    disabled={!selectedDeckId}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-pink-500 dark:hover:bg-pink-600 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to Deck
                  </button>
                  <button
                    onClick={() => setShowCreateDeck(true)}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    New Deck
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  You don't have any SRS decks yet. Create your first deck to get started!
                </div>
                <button
                  onClick={() => setShowCreateDeck(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-pink-500 dark:hover:bg-pink-600 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create First Deck
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                New Deck Name
              </label>
              <input
                type="text"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 focus:border-blue-500 dark:focus:border-pink-500 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                placeholder={`${content.type.charAt(0).toUpperCase() + content.type.slice(1)} Deck`}
                autoFocus
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateDeck(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateDeckAndAdd}
                disabled={!newDeckName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-pink-500 dark:hover:bg-pink-600 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create & Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
