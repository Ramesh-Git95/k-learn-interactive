// Tooltip content definitions for the Korean learning app
import React from 'react';

export interface TooltipContentItem {
  title: string;
  content: string | React.ReactElement;
}

export const tooltipContent = {
  // SRS (Spaced Repetition System) tooltips
  srs: {
    easinessFactor: {
      title: "Easiness Factor",
      content: "A measure of how easy this card is for you. Starts at 2.5. Gets higher when you find the card easy, lower when you struggle. Higher numbers mean longer intervals between reviews."
    },
    interval: {
      title: "Review Interval", 
      content: "Time between reviews. Starts at 1 day, then increases each time you get the card right. If you get it wrong, the interval resets to help you learn it better."
    },
    quality: {
      title: "Quality Ratings",
      content: "Again: Complete blackout, need to see answer | Hard: Correct with serious difficulty | Good: Correct with some effort | Easy: Perfect recall, felt too easy"
    },
    dueCards: {
      title: "Due Cards",
      content: "Cards scheduled for review today. The algorithm determines when you need to review each card just before you're likely to forget it."
    },
    newCards: {
      title: "New Cards",
      content: "Cards you haven't studied yet. The system introduces these gradually to avoid overwhelming you while maintaining your review schedule."
    },
    repetitions: {
      title: "Repetitions",
      content: "Number of times you've successfully recalled this card. More repetitions mean the card is moving into long-term memory."
    }
  },

  // Hangul learning tooltips
  hangul: {
    vowels: {
      title: "Korean Vowels (모음)",
      content: "Korean has 10 basic vowels that combine to form complex sounds. Each vowel has a specific mouth shape and tongue position."
    },
    consonants: {
      title: "Korean Consonants (자음)",
      content: "Korean has 14 basic consonants. Some change sound depending on their position in a syllable (initial, medial, final)."
    },
    strokeOrder: {
      title: "Stroke Order",
      content: "The correct sequence for writing Korean characters. Generally: left to right, top to bottom, outside to inside."
    },
    syllableBlock: {
      title: "Syllable Block",
      content: "Korean characters combine into square blocks. Each block represents one syllable and can contain 2-4 letters arranged in specific patterns."
    },
    pronunciation: {
      title: "Pronunciation Guide",
      content: "Listen carefully to the native pronunciation. Korean sounds may not exist in English, so focus on mouth position and tone."
    }
  },

  // Grammar tooltips
  grammar: {
    particles: {
      title: "Korean Particles",
      content: "Small words that show relationships between words in a sentence. Essential for Korean grammar but have no direct English equivalent."
    },
    eun_neun: {
      title: "은/는 Topic Marker",
      content: "Marks the topic of conversation. Use 은 after consonants, 는 after vowels. Shows what you're talking about, not necessarily the subject."
    },
    i_ga: {
      title: "이/가 Subject Marker", 
      content: "Marks the grammatical subject. Use 이 after consonants, 가 after vowels. Shows who or what is doing the action."
    },
    honorifics: {
      title: "Honorific Levels",
      content: "Informal: Friends, family, younger people | Formal: Strangers, older people, professional | Honorific: Very formal, showing high respect"
    },
    sentenceStructure: {
      title: "Korean Sentence Structure",
      content: "Korean follows SOV (Subject-Object-Verb) order, unlike English SVO. The verb always comes last in Korean sentences."
    }
  },

  // Progress and learning tooltips
  progress: {
    accuracy: {
      title: "Accuracy Percentage",
      content: "Calculated from your recent performance. Shows how often you get cards right on the first try. Aim for 80-90% for optimal learning."
    },
    streak: {
      title: "Learning Streak",
      content: "Consecutive days you've studied. Consistency is key in language learning. Even 10 minutes daily is better than long irregular sessions."
    },
    proficiency: {
      title: "Proficiency Level",
      content: "Based on vocabulary size, grammar knowledge, and accuracy. Moves from Beginner → Elementary → Intermediate → Advanced → Fluent."
    },
    dailyGoal: {
      title: "Daily Goal",
      content: "Target number of new words or review cards per day. Start small and increase gradually. Sustainable habits lead to long-term success."
    }
  },

  // Cultural context tooltips
  culture: {
    regional: {
      title: "Regional Differences",
      content: "Korean varies slightly by region. Seoul dialect is standard, but you'll hear different accents and vocabulary in Busan, Jeju, etc."
    },
    formal: {
      title: "Formality Levels",
      content: "Korean has built-in respect levels. Always err on the side of being more formal until told otherwise, especially with older people."
    },
    historical: {
      title: "Historical Context",
      content: "Understanding when and why certain expressions developed helps with proper usage and cultural sensitivity."
    }
  },

  // Quiz and practice tooltips
  quiz: {
    difficulty: {
      title: "Quiz Difficulty",
      content: "Adapts based on your performance. Focuses on areas where you need more practice while maintaining learned material."
    },
    types: {
      title: "Quiz Types",
      content: "Recognition: Choose the correct answer | Recall: Type or speak the answer | Listening: Understand spoken Korean | Reading: Comprehend written text"
    }
  }
} as const;

// Helper function to get tooltip content
export function getTooltipContent(category: string, key: string): TooltipContentItem | null {
  const categoryContent = tooltipContent[category as keyof typeof tooltipContent];
  if (!categoryContent) return null;
  
  return (categoryContent as any)[key] || null;
}
