import React from 'react';
import type { Bookmark, PhraseItem } from '../types';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  toggleBookmark: (item: Bookmark) => void;
}

const BookmarkList: React.FC<BookmarkListProps> = ({ bookmarks, toggleBookmark }) => {
  const speak = (korean: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // avoid queueing overlapping audio on rapid clicks
      const u = new SpeechSynthesisUtterance(korean);
      u.lang = 'ko-KR'; u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-8 p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 60%, #06B6D4 100%)' }}
      >
        <div className="relative z-10 flex items-center gap-4">
          <span className="text-4xl">❤️</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Bookmarks</h1>
            <p className="text-white/70 text-sm">즐겨찾기 · {bookmarks.length} saved item{bookmarks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔖</div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">No bookmarks yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click ❤️ on vocabulary or phrases to save them here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {bookmarks.map(item => {
              const isPhrase = 'context' in item;
              return (
                <li
                  key={item.korean}
                  className="p-4 sm:p-5 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-lg font-black text-gray-900 dark:text-white">{item.korean}</p>
                        {isPhrase && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
                          >
                            {(item as PhraseItem).context}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">{item.romanization}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{item.english}</p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => speak(item.korean)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors text-base"
                      >
                        🔊
                      </button>
                      <button
                        onClick={() => toggleBookmark(item)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/20 hover:scale-110 transition-all duration-200 text-base"
                      >
                        ❤️
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BookmarkList;
