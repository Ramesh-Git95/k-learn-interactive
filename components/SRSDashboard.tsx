import React from 'react';
import { accentFor } from '../utils/moduleAccent';
import { useSRSContext } from '../contexts/SRSContext';

interface SRSDashboardProps {
  onStartStudy: (deckId: string) => void;
  onManageDecks: () => void;
}

const ACC = accentFor('srs');

export default function SRSDashboard({ onStartStudy, onManageDecks }: SRSDashboardProps) {
  const { decks, stats } = useSRSContext();

  const decksWithDueCards = decks.map(deck => {
    const now = new Date();
    const dueCards = deck.cards.filter(card => new Date(card.srs.nextReviewDate) <= now);
    return { ...deck, dueCount: dueCards.length };
  }).filter(deck => deck.dueCount > 0);

  const totalDueCards = decksWithDueCards.reduce((sum, deck) => sum + deck.dueCount, 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-[#16202F] dark:text-white">
            Spaced repetition
          </h3>
          <p className="mt-0.5 text-[12.5px] text-[#4A5566] dark:text-gray-400">
            Cards you know come back later; ones you miss come back sooner.
          </p>
        </div>
        <button
          onClick={onManageDecks}
          className="flex-none text-[12.5px] font-semibold hover:underline"
          style={{ color: ACC.light }}
        >
          Manage decks →
        </button>
      </div>

      {/* Quick stats — number first, label under, like everywhere else */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { value: totalDueCards, label: 'due now', accent: totalDueCards > 0 },
          { value: stats.todayReviews, label: 'reviewed today', accent: false },
          { value: stats.todayNew, label: 'new today', accent: false },
          { value: stats.streakDays, label: 'day streak', accent: false },
        ].map(({ value, label, accent }) => (
          <div
            key={label}
            className="rounded-xl px-3 py-2.5"
            style={accent
              ? { background: `${ACC.light}14`, border: `1px solid ${ACC.light}45` }
              : { background: 'rgba(20,32,47,0.035)', border: '1px solid rgba(20,32,47,0.10)' }}
          >
            <div
              className="text-[19px] font-bold leading-none"
              style={accent ? { color: ACC.light } : undefined}
            >
              <span className={accent ? '' : 'text-[#16202F] dark:text-white'}>{value}</span>
            </div>
            <div className="mt-1.5 text-[12px] text-[#4A5566] dark:text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Decks with something due */}
      {totalDueCards > 0 ? (
        <div>
          <h4 className="mb-3 text-[14px] font-semibold text-[#16202F] dark:text-white">Ready to review</h4>
          <div className="flex flex-col gap-2.5">
            {decksWithDueCards.slice(0, 3).map(deck => (
              <div key={deck.id} className="kl-well flex items-center justify-between gap-3 rounded-xl p-3.5">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-[#16202F] dark:text-white">{deck.name}</div>
                  <div className="mt-0.5 text-[12.5px] text-[#4A5566] dark:text-gray-500">
                    {deck.dueCount} {deck.dueCount === 1 ? 'card' : 'cards'} due
                  </div>
                </div>
                <button
                  onClick={() => onStartStudy(deck.id)}
                  className="flex h-10 flex-none items-center rounded-[9px] px-4 text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.03]"
                  style={{ background: ACC.light }}
                >
                  Review →
                </button>
              </div>
            ))}
            {decksWithDueCards.length > 3 && (
              <button
                onClick={onManageDecks}
                className="mt-1 text-[12.5px] font-semibold hover:underline"
                style={{ color: ACC.light }}
              >
                {decksWithDueCards.length - 3} more {decksWithDueCards.length - 3 === 1 ? 'deck' : 'decks'} waiting →
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="kl-well rounded-xl p-6 text-center">
          {decks.length === 0 ? (
            <>
              <h4 className="text-[15px] font-semibold text-[#16202F] dark:text-white">No decks yet</h4>
              <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-[#3E4A5A] dark:text-gray-400">
                Add a word from Vocabulary, or save the ones you miss in a quiz, and they will start
                coming back here on schedule.
              </p>
              <button
                onClick={onManageDecks}
                className="mt-4 inline-flex h-11 items-center rounded-[10px] px-5 text-[14px] font-semibold text-white"
                style={{ background: ACC.light }}
              >
                Make a deck →
              </button>
            </>
          ) : (
            <>
              <h4 className="text-[15px] font-semibold text-[#16202F] dark:text-white">Nothing due right now</h4>
              <p className="mt-1.5 text-[13.5px] text-[#3E4A5A] dark:text-gray-400">
                You are level with the queue. Come back when the next cards are ready.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
