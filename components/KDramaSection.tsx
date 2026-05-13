import React, { useState } from 'react';
import { dramas } from '../data/kdramaData';
import type { Drama, DramaWord } from '../data/kdramaData';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useToastContext } from '../contexts/ToastContext';
import useSRS from '../hooks/useSRS';
import PronunciationButton from './PronunciationButton';

const GUMROAD_URL = 'https://learnk.gumroad.com/l/klearn-lifetime';

const difficultyStyle: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};


type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

const KDramaSection: React.FC = () => {
  const { hasPremiumAccess, isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();
  const { showToast } = useToastContext();
  const { decks, actions: srsActions } = useSRS();
  const isPremium = hasPremiumAccess();

  const [selectedDrama, setSelectedDrama] = useState<Drama | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [addedCards, setAddedCards] = useState<Set<string>>(new Set());

  const handleAddToSRS = (word: DramaWord, drama: Drama) => {
    const cardKey = `${drama.id}-${word.korean}`;
    if (addedCards.has(cardKey)) return;

    let deckId: string;
    const kdramaDeck = decks.find(d => d.name === 'K-Drama Vocabulary');
    if (kdramaDeck) {
      deckId = kdramaDeck.id;
    } else if (decks.length > 0) {
      deckId = decks[0].id;
    } else {
      deckId = srsActions.createDeck('K-Drama Vocabulary', 'Words from your favourite K-dramas');
    }

    srsActions.addCardToDeck(deckId, {
      korean: word.korean,
      romanization: word.romanization,
      english: word.english,
      type: 'vocabulary',
      category: `K-Drama: ${drama.titleEnglish}`,
    });

    setAddedCards(prev => new Set(prev).add(cardKey));
    showToast(`Added "${word.korean}" to SRS`, 'success');
  };

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🎬</div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3">K-Drama Vocabulary Packs</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Learn Korean through your favourite K-dramas. Sign up to explore 60+ words from 5 iconic shows.
        </p>
        <button
          onClick={openRegister}
          className="px-8 py-4 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-px"
          style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
        >
          Get Started Free
        </button>
      </div>
    );
  }

  // Logged in but free — upgrade teaser
  if (!isPremium) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
            ⭐ Premium Feature
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">
            🎬 K-Drama Vocabulary Packs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            Learn Korean through your favourite dramas. 60+ words curated from 5 iconic shows,
            with context sentences straight from the script.
          </p>
        </div>

        {/* Blurred teaser + lock overlay */}
        <div className="relative mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pointer-events-none select-none blur-sm opacity-60">
            {dramas.slice(0, 3).map(drama => (
              <div
                key={drama.id}
                className="relative rounded-2xl overflow-hidden h-44 shadow-md"
                style={{ background: drama.gradient }}
              >
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <div className="text-4xl mb-1">{drama.emoji}</div>
                  <h3 className="text-white font-black text-lg leading-tight">{drama.titleEnglish}</h3>
                  <p className="text-white/70 text-sm">{drama.title} · {drama.year}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Lock card */}
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center w-full max-w-sm">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-md"
                style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
              >
                🔒
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Premium Only</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Unlock K-Drama Vocabulary Packs + all premium features with a one-time payment.
              </p>
              <p className="text-xs text-gray-400 line-through mb-4">Duolingo: $84–168/year</p>
              <a
                href={GUMROAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-px text-sm"
                style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
              >
                Get Lifetime Access — $39
              </a>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🎬', label: '5 iconic dramas', sub: 'Squid Game, CLOY, Goblin & more' },
            { icon: '📚', label: '60+ curated words', sub: 'Context sentences from real scripts' },
            { icon: '🔄', label: 'SRS integration', sub: 'Add any word to your study deck' },
          ].map(f => (
            <div
              key={f.label}
              className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <span className="text-2xl">{f.icon}</span>
              <div>
                <div className="font-bold text-gray-900 dark:text-white text-sm">{f.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Premium — full experience
  const filteredWords: DramaWord[] = selectedDrama
    ? (difficultyFilter === 'all'
        ? selectedDrama.words
        : selectedDrama.words.filter(w => w.difficulty === difficultyFilter))
    : [];

  const totalWords = dramas.reduce((a, d) => a + d.words.length, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        {selectedDrama && (
          <button
            onClick={() => { setSelectedDrama(null); setDifficultyFilter('all'); }}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors mb-4 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Dramas
          </button>
        )}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
          >
            🎬
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              {selectedDrama ? selectedDrama.titleEnglish : 'K-Drama Vocabulary'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedDrama
                ? `${selectedDrama.title} · ${selectedDrama.year}`
                : `${dramas.length} dramas · ${totalWords} words`}
            </p>
          </div>
        </div>
      </div>

      {!selectedDrama ? (
        /* ── Drama selection grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {dramas.map(drama => (
            <button
              key={drama.id}
              onClick={() => setSelectedDrama(drama)}
              className="relative rounded-2xl overflow-hidden h-52 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left group"
              style={{ background: drama.gradient }}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              <div className="absolute inset-0 flex flex-col justify-between p-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {drama.genres.map(g => (
                      <span key={g} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                        {g}
                      </span>
                    ))}
                  </div>
                  <span className="text-3xl">{drama.emoji}</span>
                </div>
                <div>
                  <h3 className="text-white font-black text-xl leading-tight mb-0.5">{drama.titleEnglish}</h3>
                  <p className="text-white/70 text-sm mb-3">{drama.title} · {drama.year}</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
                      {drama.words.length} words
                    </span>
                    <span className="text-white/60 text-xs">Tap to learn →</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* ── Vocabulary cards view ── */
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 max-w-2xl leading-relaxed">
            {selectedDrama.description}
          </p>

          {/* Difficulty filter */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mr-1">Filter:</span>
            {(['all', 'beginner', 'intermediate', 'advanced'] as DifficultyFilter[]).map(d => (
              <button
                key={d}
                onClick={() => setDifficultyFilter(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 capitalize ${
                  difficultyFilter === d
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={difficultyFilter === d ? { background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' } : {}}
              >
                {d === 'all'
                  ? `All (${selectedDrama.words.length})`
                  : `${d} (${selectedDrama.words.filter(w => w.difficulty === d).length})`}
              </button>
            ))}
          </div>

          {/* Word grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWords.map((word, idx) => {
              const cardKey = `${selectedDrama.id}-${word.korean}`;
              const isAdded = addedCards.has(cardKey);
              return (
                <div
                  key={word.korean}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3"
                >
                  {/* Korean + difficulty */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{word.korean}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">{word.romanization}</div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 capitalize ${difficultyStyle[word.difficulty]}`}>
                      {word.difficulty}
                    </span>
                  </div>

                  {/* English meaning */}
                  <div className="text-base font-bold text-gray-800 dark:text-gray-100">{word.english}</div>

                  {/* Context sentence */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-l-2 border-pink-200 dark:border-pink-800 pl-3 italic flex-1">
                    {word.context}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-auto pt-1">
                    {/* Speak (TTS) */}
                    <button
                      onClick={() => {
                        const u = new SpeechSynthesisUtterance(word.korean);
                        u.lang = 'ko-KR'; u.rate = 0.8;
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(u);
                      }}
                      className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                      title="Hear pronunciation"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                      </svg>
                      <span>Hear</span>
                    </button>
                    <div className="flex-1">
                      <PronunciationButton korean={word.korean} romanization={word.romanization} size="sm" hintKey={idx === 0 ? 'kdrama' : undefined} />
                    </div>
                    <button
                      onClick={() => handleAddToSRS(word, selectedDrama)}
                      disabled={isAdded}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex-1 justify-center ${
                        isAdded
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 cursor-default'
                          : 'text-white hover:shadow-md hover:-translate-y-px'
                      }`}
                      style={!isAdded ? { background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' } : {}}
                      title={isAdded ? 'Already added to SRS' : 'Add to Spaced Repetition'}
                    >
                      {isAdded ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Added
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          + SRS
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredWords.length === 0 && (
            <div className="text-center py-16 text-gray-400 dark:text-gray-600">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium">No words at this difficulty level.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KDramaSection;
