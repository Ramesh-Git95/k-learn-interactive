import React from 'react';
import { useSRSContext } from '../contexts/SRSContext';

interface SRSDashboardProps {
  onStartStudy: (deckId: string) => void;
  onManageDecks: () => void;
}

export default function SRSDashboard({ onStartStudy, onManageDecks }: SRSDashboardProps) {
  const { decks, stats } = useSRSContext();

  const decksWithDueCards = decks.map(deck => {
    const now = new Date();
    const dueCards = deck.cards.filter(card => new Date(card.srs.nextReviewDate) <= now);
    return { ...deck, dueCount: dueCards.length };
  }).filter(deck => deck.dueCount > 0);

  const totalDueCards = decksWithDueCards.reduce((sum, deck) => sum + deck.dueCount, 0);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}
          >
            🧠
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Spaced Repetition</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Review cards for optimal retention</p>
          </div>
        </div>
        <button
          onClick={onManageDecks}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
        >
          Manage Decks →
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { value: totalDueCards, label: 'Due Now', color: '#EC4899' },
          { value: stats.todayReviews, label: 'Today', color: '#8B5CF6' },
          { value: stats.todayNew, label: 'New', color: '#06B6D4' },
          { value: stats.streakDays, label: 'Streak 🔥', color: '#F59E0B' },
        ].map(({ value, label, color }) => (
          <div
            key={label}
            className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60"
          >
            <div className="text-xl font-black" style={{ color }}>{value}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Due Cards */}
      {totalDueCards > 0 ? (
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Ready to Review</h4>
          <div className="space-y-2">
            {decksWithDueCards.slice(0, 3).map(deck => (
              <div
                key={deck.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{deck.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{deck.dueCount} cards due</div>
                </div>
                <button
                  onClick={() => onStartStudy(deck.id)}
                  className="text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm transition-transform hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
                >
                  Study
                </button>
              </div>
            ))}
            {decksWithDueCards.length > 3 && (
              <div className="text-center pt-1">
                <button
                  onClick={onManageDecks}
                  className="text-xs font-semibold"
                  style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  +{decksWithDueCards.length - 3} more decks
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-5">
          {decks.length === 0 ? (
            <>
              <div className="text-4xl mb-3">📚</div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No Study Decks Yet</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Create decks and add vocabulary for spaced repetition learning.
              </p>
              <button
                onClick={onManageDecks}
                className="text-white text-sm font-bold px-5 py-2 rounded-xl shadow-md transition-transform hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
              >
                Get Started
              </button>
            </>
          ) : (
            <>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-3"
                style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' }}
              >
                ✅
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">All Caught Up!</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No cards due for review right now. Great job!
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
