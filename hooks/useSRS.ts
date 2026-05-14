import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SpacedRepetitionSystem, SRSCard, SRSDeck, SRSReview } from '../services/spacedRepetition';
import useLocalStorage from './useLocalStorage';
import { useAuth } from '../contexts/AuthContext';
import { earnXP, markStudyToday } from '../utils/xpStreak';

// Utility function to safely parse dates
const parseDate = (dateValue: any): Date | undefined => {
  if (!dateValue) return undefined;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
};

// Utility function to sanitize SRS data after loading from localStorage
const sanitizeSRSData = (decks: any[]): SRSDeck[] => {
  if (!Array.isArray(decks)) return [];
  
  return decks.map(deck => {
    if (!deck || typeof deck !== 'object') return null;
    
    return {
      ...deck,
      cards: Array.isArray(deck.cards) ? deck.cards.map((card: any) => {
        if (!card || typeof card !== 'object') return null;
        
        // Ensure all required properties exist with safe defaults
        const sanitizedCard = {
          ...card,
          srs: {
            interval: card.srs?.interval || 1,
            easeFactor: card.srs?.easeFactor || 2.5,
            repetitions: card.srs?.repetitions || 0,
            nextReviewDate: parseDate(card.srs?.nextReviewDate) || new Date(),
            lastReviewDate: parseDate(card.srs?.lastReviewDate) || null,
            quality: card.srs?.quality || 0,
            streak: card.srs?.streak || 0,
          },
          performance: {
            totalReviews: card.performance?.totalReviews || 0,
            correctReviews: card.performance?.correctReviews || 0,
            averageTime: card.performance?.averageTime || 0,
            lastReviewTime: card.performance?.lastReviewTime || 0,
          },
          createdAt: parseDate(card.createdAt) || new Date(),
          modifiedAt: parseDate(card.modifiedAt) || new Date(),
        };
        
        return sanitizedCard;
      }).filter(Boolean) : []
    };
  }).filter(Boolean) as SRSDeck[];
};

export interface UseSRSReturn {
  decks: SRSDeck[];
  currentDeck: SRSDeck | null;
  studySession: {
    cards: SRSCard[];
    currentCardIndex: number;
    currentCard: SRSCard | null;
    isComplete: boolean;
    progress: number;
  };
  stats: {
    todayReviews: number;
    todayNew: number;
    totalDue: number;
    streakDays: number;
  };
  actions: {
    createDeck: (name: string, description: string) => string;
    selectDeck: (deckId: string) => void;
    addCardToDeck: (deckId: string, content: SRSCard['content']) => void;
    startStudySession: (deckId: string, maxCards?: number) => void;
    submitReview: (quality: number, responseTime: number) => void;
    nextCard: () => void;
    finishSession: () => void;
    resetDeck: (deckId: string) => void;
    getDeckStats: (deckId: string) => SRSDeck['stats'] | null;
    // New edit/delete actions
    editDeck: (deckId: string, name: string, description: string) => void;
    deleteDeck: (deckId: string) => void;
    editCard: (deckId: string, cardId: string, content: SRSCard['content']) => void;
    deleteCard: (deckId: string, cardId: string) => void;
    resetCard: (deckId: string, cardId: string) => void;
  };
}

const useSRS = (): UseSRSReturn => {
  const srs = new SpacedRepetitionSystem();
  const { user, token } = useAuth();
  
  // Load and sanitize data from localStorage
  const [rawDecks, setRawDecks] = useLocalStorage<any[]>('srs-decks', []);
  const [decks, setDecks] = useState<SRSDeck[]>(() => sanitizeSRSData(rawDecks));
  const [currentDeckId, setCurrentDeckId] = useLocalStorage<string | null>('srs-current-deck', null);
  const [studyStreak, setStudyStreak] = useLocalStorage<{ date: string; days: number }>('srs-streak', { date: '', days: 0 });
  
  // Sanitize data when rawDecks changes (on mount and updates)
  useEffect(() => {
    const sanitizedDecks = sanitizeSRSData(rawDecks);
    // Use a more reliable comparison to prevent loops
    const currentDecksCount = decks.length;
    const newDecksCount = sanitizedDecks.length;
    const currentCardCount = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
    const newCardCount = sanitizedDecks.reduce((sum, deck) => sum + deck.cards.length, 0);
    
    // Only update if the actual data structure changed
    if (currentDecksCount !== newDecksCount || currentCardCount !== newCardCount) {
      console.log('🔄 Updating decks from rawDecks:', { 
        decks: newDecksCount, 
        cards: newCardCount,
        oldDecks: currentDecksCount,
        oldCards: currentCardCount
      });
      setDecks(sanitizedDecks);
    }
  }, [rawDecks]);
  
  // Listen for storage events to sync across components (but avoid loops)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'srs-decks' && e.newValue) {
        try {
          const newDecks = JSON.parse(e.newValue);
          const sanitizedDecks = sanitizeSRSData(newDecks);
          
          // Check if this is actually different from current state
          const currentCardCount = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
          const newCardCount = sanitizedDecks.reduce((sum, deck) => sum + deck.cards.length, 0);
          
          if (decks.length !== sanitizedDecks.length || currentCardCount !== newCardCount) {
            console.log('📡 Storage event received, updating decks:', sanitizedDecks.length);
            setDecks(sanitizedDecks);
          }
        } catch (error) {
          console.error('Error parsing storage event data:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [decks]); // Add decks to dependencies but with smart comparison above
  
  // Database sync functions
  const syncToDatabase = useCallback(async (decksToSync: SRSDeck[]) => {
    if (!user || !token) {
      console.log('🔒 User not authenticated, skipping database sync');
      return;
    }

    try {
      console.log('🔄 Syncing SRS data to database...');
      console.log('🔑 Token exists:', !!token);
      console.log('👤 User ID:', user.id);
      console.log('📊 Decks to sync:', decksToSync.length);
      console.log('📋 First deck sample:', decksToSync[0] ? JSON.stringify(decksToSync[0], null, 2) : 'No decks');
      
      // Prepare data for sync with proper date handling
      const syncData = {
        decks: decksToSync.map(deck => ({
          ...deck,
          cards: deck.cards.map(card => ({
            ...card,
            createdAt: card.createdAt instanceof Date ? card.createdAt.toISOString() : card.createdAt,
            modifiedAt: card.modifiedAt instanceof Date ? card.modifiedAt.toISOString() : card.modifiedAt,
            srs: {
              ...card.srs,
              nextReviewDate: card.srs.nextReviewDate instanceof Date ? card.srs.nextReviewDate.toISOString() : card.srs.nextReviewDate,
              lastReviewDate: card.srs.lastReviewDate instanceof Date ? card.srs.lastReviewDate.toISOString() : card.srs.lastReviewDate
            }
          }))
        }))
      };
      
      console.log('📤 Serialized data size:', JSON.stringify(syncData).length, 'characters');
      
      const response = await fetch('http://localhost:5001/api/srs/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(syncData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SRS data synced to database:', data.syncedDecks, 'decks');
      } else {
        console.error('❌ Failed to sync SRS data to database:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error syncing SRS data to database:', error);
    }
  }, [user, token]);

  const loadFromDatabase = useCallback(async () => {
    if (!user || !token) {
      console.log('🔒 User not authenticated, skipping database load');
      return;
    }

    try {
      console.log('📥 Loading SRS data from database...');
      const response = await fetch('http://localhost:5001/api/srs/decks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Loaded SRS data from database:', data.decks.length, 'decks');
        
        if (data.decks && data.decks.length > 0) {
          // Only update if we have data from the database
          setRawDecks(data.decks);
          console.log('🔄 Updated local storage with database data');
        }
      } else {
        console.error('❌ Failed to load SRS data from database:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading SRS data from database:', error);
    }
  }, [user, token, setRawDecks]);

  // Load from database on authentication
  useEffect(() => {
    if (user && token) {
      loadFromDatabase();
    }
  }, [user, token, loadFromDatabase]);

  // Enhanced updateRawDecks function that also syncs to database
  const updateRawDecks = useCallback((newDecks: SRSDeck[]) => {
    setRawDecks(newDecks);
    
    // Sync to database if user is authenticated
    if (user && token) {
      syncToDatabase(newDecks);
    }
  }, [setRawDecks, syncToDatabase, user, token]);
  
  // Session state
  const [studySession, setStudySession] = useState<{
    cards: SRSCard[];
    currentCardIndex: number;
    currentCard: SRSCard | null;
    isComplete: boolean;
    progress: number;
  }>({
    cards: [],
    currentCardIndex: 0,
    currentCard: null,
    isComplete: true,
    progress: 0,
  });

  const currentDeck = decks.find(deck => deck.id === currentDeckId) || null;

  // Calculate daily stats
  const calculateStats = useCallback(() => {
    const today = new Date().toDateString();
    let todayReviews = 0;
    let todayNew = 0;
    let totalDue = 0;

    try {
      decks.forEach(deck => {
        if (!deck?.cards) return;
        
        deck.cards.forEach(card => {
          try {
            // Safely parse dates from localStorage (they might be strings)
            let lastReviewDate = null;
            let nextReviewDate = null;
            
            if (card.srs?.lastReviewDate) {
              lastReviewDate = card.srs.lastReviewDate instanceof Date 
                ? card.srs.lastReviewDate 
                : new Date(card.srs.lastReviewDate);
            }
            
            if (card.srs?.nextReviewDate) {
              nextReviewDate = card.srs.nextReviewDate instanceof Date 
                ? card.srs.nextReviewDate 
                : new Date(card.srs.nextReviewDate);
            }
            
            // Count today's reviews
            if (lastReviewDate && lastReviewDate instanceof Date && !isNaN(lastReviewDate.getTime())) {
              if (lastReviewDate.toDateString() === today) {
                todayReviews++;
                if (card.srs.totalReviews === 1) {
                  todayNew++;
                }
              }
            }
            
            // Count due cards
            if (nextReviewDate && nextReviewDate instanceof Date && !isNaN(nextReviewDate.getTime())) {
              if (nextReviewDate <= new Date()) {
                totalDue++;
              }
            }
          } catch (cardError) {
            console.warn('Error processing card for stats:', cardError, card);
          }
        });
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }

    return { todayReviews, todayNew, totalDue };
  }, [decks]);

  // Update study streak (avoid infinite loops)
  useEffect(() => {
    const today = new Date().toDateString();
    
    // Calculate stats directly here to avoid circular dependency
    let todayReviews = 0;
    
    try {
      decks.forEach(deck => {
        if (!deck?.cards) return;
        
        deck.cards.forEach(card => {
          try {
            let lastReviewDate = null;
            
            if (card.srs?.lastReviewDate) {
              lastReviewDate = card.srs.lastReviewDate instanceof Date 
                ? card.srs.lastReviewDate 
                : new Date(card.srs.lastReviewDate);
            }
            
            // Count today's reviews
            if (lastReviewDate && lastReviewDate instanceof Date && !isNaN(lastReviewDate.getTime())) {
              if (lastReviewDate.toDateString() === today) {
                todayReviews++;
              }
            }
          } catch (error) {
            // Silently skip invalid cards
          }
        });
      });
    } catch (error) {
      console.error('Error calculating streak stats:', error);
    }
    
    if (todayReviews > 0 && studyStreak.date !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const isConsecutive = studyStreak.date === yesterday.toDateString();
      const newStreak = isConsecutive ? studyStreak.days + 1 : 1;
      
      setStudyStreak({ date: today, days: newStreak });
    }
  }, [decks.length, studyStreak.date, setStudyStreak]); // Use decks.length instead of calculateStats

  // Create a new deck
  const createDeck = useCallback((name: string, description: string): string => {
    const newDeck: SRSDeck = {
      id: `deck_${Date.now()}`,
      name,
      description,
      cards: [],
      settings: {
        newCardsPerDay: 10,
        maxReviewsPerDay: 50,
        graduationInterval: 4,
        easyInterval: 7,
        hardInterval: 0.85,
        lapseInterval: 1,
      },
      stats: {
        totalCards: 0,
        newCards: 0,
        learningCards: 0,
        reviewCards: 0,
        matureCards: 0,
        dailyReviews: 0,
        accuracy: 0,
      },
    };

    const updatedDecks = [...decks, newDeck];
    setDecks(updatedDecks);
    // Write synchronously so addCardToDeck can read the new deck immediately
    localStorage.setItem('srs-decks', JSON.stringify(updatedDecks));
    updateRawDecks(updatedDecks);

    return newDeck.id;
  }, [decks, updateRawDecks]);

  // Select active deck
  const selectDeck = useCallback((deckId: string) => {
    setCurrentDeckId(deckId);
  }, [setCurrentDeckId]);

  // Add card to deck
  const addCardToDeck = useCallback((deckId: string, content: SRSCard['content']) => {
    const cardId = `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newCard = srs.createCard(cardId, content);

    // Read fresh from localStorage so this works even when called immediately
    // after createDeck (before React has re-rendered with the new deck in state)
    const freshDecks = sanitizeSRSData(JSON.parse(localStorage.getItem('srs-decks') || '[]'));
    const updatedDecks = freshDecks.map(deck =>
      deck.id === deckId
        ? { ...deck, cards: [...deck.cards, newCard] }
        : deck
    );

    setDecks(updatedDecks);
    localStorage.setItem('srs-decks', JSON.stringify(updatedDecks));
    updateRawDecks(updatedDecks);
  }, [srs, updateRawDecks]);

  // Start study session
  const startStudySession = useCallback((deckId: string, maxCards: number = 20) => {
    // First, ensure any previous session is finished
    console.log('🎓 Starting fresh study session for deck:', deckId);
    
    // Clear any previous session state immediately
    setStudySession({
      cards: [],
      currentCardIndex: 0,
      currentCard: null,
      isComplete: false, // Set to false to prevent immediate completion overlay
      progress: 0,
    });
    
    // Get deck from localStorage to avoid dependency on decks state
    const currentDecks = JSON.parse(localStorage.getItem('srs-decks') || '[]');
    const rawDeck = currentDecks.find(d => d.id === deckId);
    
    if (!rawDeck) {
      console.warn('❌ Deck not found for study session:', deckId);
      setStudySession({
        cards: [],
        currentCardIndex: 0,
        currentCard: null,
        isComplete: true,
        progress: 100,
      });
      return;
    }

    console.log('🎓 Found deck for study session:', rawDeck.name, 'with', rawDeck.cards?.length || 0, 'cards');
    
    // Sanitize deck with proper date parsing
    const sanitizedDeck = {
      ...rawDeck,
      cards: (rawDeck.cards || []).map(card => {
        // Ensure all dates are properly parsed from strings to Date objects
        let nextReviewDate = new Date();
        let lastReviewDate = null;
        
        try {
          if (card.srs?.nextReviewDate) {
            if (typeof card.srs.nextReviewDate === 'string') {
              nextReviewDate = new Date(card.srs.nextReviewDate);
            } else if (card.srs.nextReviewDate instanceof Date) {
              nextReviewDate = card.srs.nextReviewDate;
            } else if (card.srs.nextReviewDate.$date) {
              // Handle MongoDB date format
              nextReviewDate = new Date(card.srs.nextReviewDate.$date);
            }
          }
          
          if (card.srs?.lastReviewDate) {
            if (typeof card.srs.lastReviewDate === 'string') {
              lastReviewDate = new Date(card.srs.lastReviewDate);
            } else if (card.srs.lastReviewDate instanceof Date) {
              lastReviewDate = card.srs.lastReviewDate;
            } else if (card.srs.lastReviewDate.$date) {
              // Handle MongoDB date format
              lastReviewDate = new Date(card.srs.lastReviewDate.$date);
            }
          }
        } catch (error) {
          console.warn('Date parsing error for card:', card.id, error);
          nextReviewDate = new Date();
          lastReviewDate = null;
        }
        
        const sanitizedCard = {
          ...card,
          srs: {
            ...card.srs,
            interval: card.srs?.interval || 0,
            easeFactor: card.srs?.easeFactor || 2.5,
            repetitions: card.srs?.repetitions || 0,
            nextReviewDate,
            lastReviewDate,
            quality: card.srs?.quality || 0,
            streak: card.srs?.streak || 0,
            totalReviews: card.srs?.totalReviews || 0,
            correctStreak: card.srs?.correctStreak || 0,
          },
          performance: {
            totalReviews: card.performance?.totalReviews || 0,
            correctReviews: card.performance?.correctReviews || 0,
            averageTime: card.performance?.averageTime || 0,
            lastReviewTime: card.performance?.lastReviewTime || 0,
            averageResponseTime: card.performance?.averageResponseTime || 0,
            successRate: card.performance?.successRate || 0,
            difficultyRating: card.performance?.difficultyRating || 3,
          },
          createdAt: card.createdAt ? new Date(card.createdAt) : new Date(),
          modifiedAt: card.modifiedAt ? new Date(card.modifiedAt) : new Date(),
        };
        
        console.log('🔄 Sanitized card:', card.id, 'nextReview:', nextReviewDate, 'due:', nextReviewDate <= new Date());
        return sanitizedCard;
      })
    };
    
    console.log('🔄 Sanitized deck cards:', sanitizedDeck.cards.length);
    
    try {
      const session = srs.getStudySession(sanitizedDeck, maxCards);
      const allCards = [...session.dueCards, ...session.newCards];
      
      console.log('📚 Study session result:', {
        dueCards: session.dueCards.length,
        newCards: session.newCards.length,
        totalCards: allCards.length,
        deckCards: sanitizedDeck.cards.length
      });
      
      if (allCards.length === 0) {
        console.log('✅ No cards to study - session complete immediately');
        setStudySession({
          cards: [],
          currentCardIndex: 0,
          currentCard: null,
          isComplete: true,
          progress: 100,
        });
        return;
      }

      // Start fresh session with proper state - no timeout needed
      console.log('🚀 Starting session with', allCards.length, 'cards');
      setStudySession({
        cards: allCards,
        currentCardIndex: 0,
        currentCard: allCards[0],
        isComplete: false,
        progress: 0,
      });
      
      setCurrentDeckId(deckId);
      console.log('✅ Study session started successfully');
      
    } catch (error) {
      console.error('❌ Error creating study session:', error);
      setStudySession({
        cards: [],
        currentCardIndex: 0,
        currentCard: null,
        isComplete: true,
        progress: 100,
      });
    }
  }, [srs, setCurrentDeckId]);

  // Submit review for current card
  const submitReview = useCallback((quality: number, responseTime: number) => {
    if (!studySession.currentCard || !currentDeck) return;

    const review: SRSReview = {
      cardId: studySession.currentCard.id,
      quality,
      responseTime,
      wasCorrect: quality >= 3,
      timestamp: new Date(),
    };

    const updatedCard = srs.processReview(studySession.currentCard, review);

    // XP: +8 for easy/good, +3 for hard, −2 for blackout (min 0)
    if (quality >= 4)      earnXP(8);
    else if (quality >= 3) earnXP(5);
    else if (quality >= 1) earnXP(3);
    else                   earnXP(-2);
    markStudyToday();

    // Update the deck with the reviewed card using direct localStorage
    const currentDecks = JSON.parse(localStorage.getItem('srs-decks') || '[]');
    const updatedDecks = currentDecks.map(deck => 
      deck.id === currentDeck.id 
        ? {
            ...deck,
            cards: deck.cards.map(card => 
              card.id === updatedCard.id ? updatedCard : card
            )
          }
        : deck
    );
    
    // Update localStorage first
    localStorage.setItem('srs-decks', JSON.stringify(updatedDecks));
    
    // Force immediate state update for stats calculation
    setDecks(updatedDecks);
    updateRawDecks(updatedDecks);
    
    console.log('✅ Card review submitted - updated card next review date:', updatedCard.srs.nextReviewDate);
  }, [studySession.currentCard, currentDeck, srs, updateRawDecks]); // Add updateRawDecks to dependencies

  // Move to next card
  const nextCard = useCallback(() => {
    const nextIndex = studySession.currentCardIndex + 1;
    const progress = (nextIndex / studySession.cards.length) * 100;
    
    if (nextIndex >= studySession.cards.length) {
      setStudySession(prev => ({
        ...prev,
        isComplete: true,
        progress: 100,
        currentCard: null,
      }));
    } else {
      setStudySession(prev => ({
        ...prev,
        currentCardIndex: nextIndex,
        currentCard: prev.cards[nextIndex],
        progress,
      }));
    }
  }, [studySession.currentCardIndex, studySession.cards.length]);

  // Finish study session and reset state completely
  const finishSession = useCallback(() => {
    console.log('🏁 Finishing study session and resetting all state');
    setStudySession({
      cards: [],
      currentCardIndex: 0,
      currentCard: null,
      isComplete: false, // Reset to false to prevent overlay issues
      progress: 0,
    });
    // Clear current deck to allow fresh session starts
    setCurrentDeckId(null);
  }, [setCurrentDeckId]);

  // Reset deck (clear all progress)
  const resetDeck = useCallback((deckId: string) => {
    // Get current decks from localStorage
    const currentDecks = JSON.parse(localStorage.getItem('srs-decks') || '[]');
    const updatedDecks = currentDecks.map(deck => 
      deck.id === deckId 
        ? {
            ...deck,
            cards: deck.cards.map(card => ({
              ...card,
              srs: {
                interval: 0,
                easeFactor: 2.5,
                repetitions: 0,
                nextReviewDate: new Date(),
                lastReviewDate: null,
                quality: 0,
                streak: 0,
              },
              performance: {
                totalReviews: 0,
                correctReviews: 0,
                averageTime: 0,
                lastReviewTime: 0,
              },
            }))
          }
        : deck
    );
    
    // Update localStorage and React state
    localStorage.setItem('srs-decks', JSON.stringify(updatedDecks));
    setDecks(updatedDecks);
    updateRawDecks(updatedDecks);
  }, [updateRawDecks]);

  // Get deck statistics
  const getDeckStats = useCallback((deckId: string): SRSDeck['stats'] | null => {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return null;
    
    return srs.calculateDeckStats(deck);
  }, [decks, srs]);

  // Edit deck name and description
  const editDeck = useCallback((deckId: string, name: string, description: string) => {
    const updatedDecks = decks.map(deck =>
      deck.id === deckId
        ? { ...deck, name: name.trim(), description: description.trim() }
        : deck
    );
    
    updateRawDecks(updatedDecks);
    setDecks(updatedDecks);
  }, [decks, updateRawDecks]);

  // Delete entire deck
  const deleteDeck = useCallback((deckId: string) => {
    const updatedDecks = decks.filter(deck => deck.id !== deckId);
    
    // If we're deleting the current deck, clear current deck
    if (currentDeckId === deckId) {
      setCurrentDeckId(null);
    }
    
    updateRawDecks(updatedDecks);
    setDecks(updatedDecks);
  }, [decks, currentDeckId, setCurrentDeckId, updateRawDecks]);

  // Edit card content
  const editCard = useCallback((deckId: string, cardId: string, content: SRSCard['content']) => {
    const updatedDecks = decks.map(deck =>
      deck.id === deckId
        ? {
            ...deck,
            cards: deck.cards.map(card =>
              card.id === cardId
                ? { ...card, content: { ...content }, modifiedAt: new Date() }
                : card
            )
          }
        : deck
    );
    
    updateRawDecks(updatedDecks);
    setDecks(updatedDecks);
  }, [decks, updateRawDecks]);

  // Delete card from deck
  const deleteCard = useCallback((deckId: string, cardId: string) => {
    const updatedDecks = decks.map(deck =>
      deck.id === deckId
        ? {
            ...deck,
            cards: deck.cards.filter(card => card.id !== cardId)
          }
        : deck
    );
    
    updateRawDecks(updatedDecks);
    setDecks(updatedDecks);
  }, [decks, updateRawDecks]);

  // Reset card progress (back to new card state)
  const resetCard = useCallback((deckId: string, cardId: string) => {
    const updatedDecks = decks.map(deck =>
      deck.id === deckId
        ? {
            ...deck,
            cards: deck.cards.map(card =>
              card.id === cardId
                ? {
                    ...card,
                    srs: {
                      interval: 0,
                      easeFactor: 2.5,
                      repetitions: 0,
                      nextReviewDate: new Date(),
                      lastReviewDate: null,
                      quality: 0,
                      streak: 0,
                      totalReviews: 0,
                      correctStreak: 0,
                    },
                    performance: {
                      totalReviews: 0,
                      correctReviews: 0,
                      averageTime: 0,
                      lastReviewTime: 0,
                      averageResponseTime: 0,
                      successRate: 0,
                      difficultyRating: 3, // Reset to default medium
                    },
                    modifiedAt: new Date(),
                  }
                : card
            )
          }
        : deck
    );
    
    updateRawDecks(updatedDecks);
    setDecks(updatedDecks);
  }, [decks, updateRawDecks]);

  // Memoize stats calculation to prevent infinite loops, but recalculate when decks change
  const stats = useMemo(() => {
    console.log('📊 Calculating SRS stats for', decks.length, 'decks');
    return calculateStats();
  }, [decks, calculateStats]);

  return {
    decks,
    currentDeck,
    studySession,
    stats: {
      ...stats,
      streakDays: studyStreak.days,
    },
    actions: {
      createDeck,
      selectDeck,
      addCardToDeck,
      startStudySession,
      submitReview,
      nextCard,
      finishSession,
      resetDeck,
      getDeckStats,
      // New edit/delete actions
      editDeck,
      deleteDeck,
      editCard,
      deleteCard,
      resetCard,
    },
  };
};

export default useSRS;
