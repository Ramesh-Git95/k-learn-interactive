// Spaced Repetition System (SRS) Implementation
// Based on the SuperMemo SM-2 algorithm with modifications for language learning

export interface SRSCard {
  id: string;
  content: {
    korean: string;
    english: string;
    romanization?: string;
    type: 'vocabulary' | 'phrase' | 'grammar' | 'character';
    category?: string;
  };
  srs: {
    interval: number; // Days until next review
    easeFactor: number; // Difficulty multiplier (1.3 - 2.5)
    repetitions: number; // Number of successful reviews
    nextReviewDate: Date; // When to show this card next
    lastReviewDate?: Date; // When last reviewed
    quality: number; // Quality of last response (0-5)
    streak: number; // Consecutive correct answers
    totalReviews: number; // Total times reviewed (moved from performance)
    correctStreak: number; // Consecutive correct answers
  };
  performance: {
    totalReviews: number; // Total times reviewed (redundant but kept for compatibility)
    correctReviews: number; // Number of correct answers
    averageTime: number; // Average seconds to answer
    lastReviewTime: number; // Time taken for last review
    averageResponseTime: number; // Average response time (alias for averageTime)
    successRate: number; // Success percentage
    difficultyRating: number; // User-defined difficulty (1-5)
  };
  createdAt: Date;
  modifiedAt: Date;
}

export interface SRSReview {
  cardId: string;
  quality: number; // 0-5 quality of response (5 = perfect, 0 = complete blackout)
  responseTime: number; // Time taken to answer in seconds
  wasCorrect: boolean;
  timestamp: Date;
}

export interface SRSDeck {
  id: string;
  name: string;
  description: string;
  cards: SRSCard[];
  settings: {
    newCardsPerDay: number;
    maxReviewsPerDay: number;
    graduationInterval: number; // Days before new card graduates
    easyInterval: number; // Days for easy cards
    hardInterval: number; // Multiplier for hard cards
    lapseInterval: number; // Days for forgotten cards
  };
  stats: {
    totalCards: number;
    newCards: number;
    learningCards: number;
    reviewCards: number;
    matureCards: number;
    dailyReviews: number;
    accuracy: number;
  };
}

export class SpacedRepetitionSystem {
  private readonly MIN_EASE_FACTOR = 1.3;
  private readonly MAX_EASE_FACTOR = 2.5;
  private readonly DEFAULT_EASE_FACTOR = 2.5;
  private readonly EASY_BONUS = 1.3;
  private readonly HARD_PENALTY = 0.85;

  /**
   * Calculate the next interval based on SM-2 algorithm
   */
  calculateNextInterval(card: SRSCard, quality: number): number {
    const { interval, easeFactor, repetitions } = card.srs;

    // Quality < 3 means the card was forgotten
    if (quality < 3) {
      return 1; // Reset to 1 day
    }

    // First time seeing this card
    if (repetitions === 0) {
      return 1;
    }

    // Second time
    if (repetitions === 1) {
      return 6;
    }

    // Calculate new interval using ease factor
    return Math.round(interval * easeFactor);
  }

  /**
   * Calculate the new ease factor based on performance
   */
  calculateEaseFactor(currentEase: number, quality: number): number {
    const newEase = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    return Math.max(this.MIN_EASE_FACTOR, Math.min(this.MAX_EASE_FACTOR, newEase));
  }

  /**
   * Process a review and update the card's SRS data
   */
  processReview(card: SRSCard, review: SRSReview): SRSCard {
    const { quality, responseTime, wasCorrect, timestamp } = review;
    
    // Calculate new values
    const newInterval = this.calculateNextInterval(card, quality);
    const newEaseFactor = this.calculateEaseFactor(card.srs.easeFactor, quality);
    const newRepetitions = quality >= 3 ? card.srs.repetitions + 1 : 0;
    
    // Calculate next review date
    const nextReviewDate = new Date(timestamp);
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    // Update performance metrics
    const totalReviews = card.srs.totalReviews + 1;
    const avgResponseTime = 
      (card.performance.averageResponseTime * card.srs.totalReviews + responseTime) / totalReviews;
    
    const successRate = wasCorrect 
      ? (card.performance.successRate * card.srs.totalReviews + 100) / totalReviews
      : (card.performance.successRate * card.srs.totalReviews) / totalReviews;

    const correctStreak = wasCorrect ? card.srs.correctStreak + 1 : 0;

    return {
      ...card,
      srs: {
        ...card.srs,
        interval: newInterval,
        easeFactor: newEaseFactor,
        repetitions: newRepetitions,
        nextReviewDate,
        lastReviewDate: timestamp,
        quality,
        totalReviews,
        correctStreak,
      },
      performance: {
        ...card.performance,
        totalReviews: totalReviews,
        correctReviews: wasCorrect ? card.performance.correctReviews + 1 : card.performance.correctReviews,
        averageTime: avgResponseTime,
        averageResponseTime: avgResponseTime,
        lastReviewTime: responseTime,
        successRate,
        difficultyRating: card.performance.difficultyRating, // User can update manually
      },
      modifiedAt: timestamp,
    };
  }

  /**
   * Get cards due for review
   */
  getDueCards(deck: SRSDeck, currentDate: Date = new Date()): SRSCard[] {
    const dueCards = deck.cards.filter(card => 
      card.srs.nextReviewDate <= currentDate
    ).sort((a, b) => {
      // Prioritize by: overdue time, then by difficulty
      const overdueA = currentDate.getTime() - a.srs.nextReviewDate.getTime();
      const overdueB = currentDate.getTime() - b.srs.nextReviewDate.getTime();
      
      if (overdueA !== overdueB) {
        return overdueB - overdueA; // Most overdue first
      }
      
      // Then by ease factor (harder cards first)
      return a.srs.easeFactor - b.srs.easeFactor;
    });
    
    return dueCards;
  }

  /**
   * Get new cards to introduce
   */
  getNewCards(deck: SRSDeck, limit: number): SRSCard[] {
    const newCards = deck.cards
      .filter(card => {
        // A card is "new" if it has never been reviewed
        // We check both repetitions = 0 AND no lastReviewDate to be safe
        return card.srs.repetitions === 0 && 
               !card.srs.lastReviewDate && 
               (card.performance?.totalReviews || 0) === 0;
      })
      .slice(0, limit);
      
    return newCards;
  }

  /**
   * Create a new SRS card from content
   */
  createCard(id: string, content: SRSCard['content']): SRSCard {
    return {
      id,
      content,
      srs: {
        interval: 0,
        easeFactor: this.DEFAULT_EASE_FACTOR,
        repetitions: 0,
        nextReviewDate: new Date(),
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
        difficultyRating: 3, // Default to medium difficulty
      },
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
  }

  /**
   * Calculate deck statistics
   */
  calculateDeckStats(deck: SRSDeck): SRSDeck['stats'] {
    const currentDate = new Date();
    
    const newCards = deck.cards.filter(card => 
      card.srs.repetitions === 0 && !card.srs.lastReviewDate
    ).length;

    const learningCards = deck.cards.filter(card => 
      card.srs.repetitions > 0 && card.srs.repetitions < 3
    ).length;

    const reviewCards = deck.cards.filter(card => 
      card.srs.repetitions >= 3 && card.srs.nextReviewDate <= currentDate
    ).length;

    const matureCards = deck.cards.filter(card => 
      card.srs.repetitions >= 3 && card.srs.interval >= 21
    ).length;

    const totalCards = deck.cards.length;
    
    const dailyReviews = deck.cards.filter(card => {
      const lastReview = card.srs.lastReviewDate;
      if (!lastReview) return false;
      
      const today = new Date();
      return (
        lastReview.getDate() === today.getDate() &&
        lastReview.getMonth() === today.getMonth() &&
        lastReview.getFullYear() === today.getFullYear()
      );
    }).length;

    const totalSuccessRate = deck.cards.reduce((sum, card) => 
      sum + card.performance.successRate, 0
    );
    const accuracy = totalCards > 0 ? totalSuccessRate / totalCards : 0;

    return {
      totalCards,
      newCards,
      learningCards,
      reviewCards,
      matureCards,
      dailyReviews,
      accuracy,
    };
  }

  /**
   * Get optimal study session
   */
  getStudySession(deck: SRSDeck, maxCards: number = 20): {
    dueCards: SRSCard[];
    newCards: SRSCard[];
    totalCards: number;
    estimatedTime: number;
  } {
    const dueCards = this.getDueCards(deck);
    const availableNewSlots = Math.max(0, maxCards - dueCards.length);
    
    // Get due card IDs to exclude them from new cards
    const dueCardIds = new Set(dueCards.map(c => c.id));
    
    // Filter new cards to exclude any that are already in due cards
    const allNewCards = this.getNewCards(deck, deck.settings.newCardsPerDay);
    const newCards = allNewCards
      .filter(card => !dueCardIds.has(card.id))
      .slice(0, availableNewSlots);
    
    const totalCards = dueCards.length + newCards.length;
    
    // Estimate 30 seconds per card on average
    const estimatedTime = totalCards * 30;

    return {
      dueCards,
      newCards,
      totalCards,
      estimatedTime,
    };
  }
}
