import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GUMROAD_URL } from '../constants';

// Feature limits for different subscription tiers
export const FEATURE_LIMITS = {
  free: {
    // Quiz limitations
    quizzesPerDay: 3,
    quizQuestionsPerSession: 10,
    advancedQuizModes: false,
    detailedExplanations: false,
    
    // Content access
    premiumLessons: false,
    advancedGrammar: false,
    businessKorean: false,
    culturalDeepDives: false,
    
    // Vocabulary limits
    vocabularyStudyPerDay: 20,
    vocabularyCategoriesAccess: 3,
    
    // Phrases limits
    phrasesStudyPerDay: 10,
    phrasesAccess: 15,
    
    // Analytics & tracking
    detailedAnalytics: false,
    progressReports: false,
    learningInsights: false,
    
    // Social features
    leaderboards: false,
    studyGroups: false,
    
    // AI limits
    aiConversationsPerDay: 5,

    // General limits
    bookmarksLimit: 15,
    dailyChallenges: false,
    offlineMode: false
  },
  premium: {
    // Quiz features
    quizzesPerDay: Infinity,
    quizQuestionsPerSession: 25,
    advancedQuizModes: true,
    detailedExplanations: true,
    
    // Content access
    premiumLessons: true,
    advancedGrammar: true,
    businessKorean: true,
    culturalDeepDives: true,
    
    // Vocabulary access
    vocabularyStudyPerDay: Infinity,
    vocabularyCategoriesAccess: Infinity,
    
    // Phrases access
    phrasesStudyPerDay: Infinity,
    phrasesAccess: Infinity,
    
    // Analytics & tracking
    detailedAnalytics: true,
    progressReports: true,
    learningInsights: true,
    
    // Social features
    leaderboards: true,
    studyGroups: true,
    
    // AI limits
    aiConversationsPerDay: 50,

    // General limits
    bookmarksLimit: Infinity,
    dailyChallenges: true,
    offlineMode: true
  },
  pro: {
    // All premium features plus
    quizzesPerDay: Infinity,
    quizQuestionsPerSession: 50,
    advancedQuizModes: true,
    detailedExplanations: true,
    
    // Pro exclusive
    premiumLessons: true,
    advancedGrammar: true,
    businessKorean: true,
    culturalDeepDives: true,
    aiTutor: true,
    prioritySupport: true,
    
    // Vocabulary access (unlimited)
    vocabularyStudyPerDay: Infinity,
    vocabularyCategoriesAccess: Infinity,
    
    // Phrases access (unlimited)
    phrasesStudyPerDay: Infinity,
    phrasesAccess: Infinity,
    
    // Enhanced analytics
    detailedAnalytics: true,
    progressReports: true,
    learningInsights: true,
    exportData: true,
    
    // Pro social features
    leaderboards: true,
    studyGroups: true,
    privateGroups: true,
    
    // AI limits
    aiConversationsPerDay: 50,

    // Pro limits
    bookmarksLimit: Infinity,
    dailyChallenges: true,
    offlineMode: true,
    customStudyPlans: true
  }
};

// Hook for checking feature access
export const useFeatureAccess = () => {
  const { user, hasPremiumAccess } = useAuth();
  
  const subscriptionTier = user?.subscription?.type || 'free';
  const isPremium = hasPremiumAccess();
  const isActive = user?.subscription?.status === 'active';
  
  // Get current user's feature limits
  const currentLimits = FEATURE_LIMITS[subscriptionTier] || FEATURE_LIMITS.free;
  
  // Check if user can access a specific feature
  const canAccess = (featureName: keyof typeof FEATURE_LIMITS.free) => {
    if (!isActive && subscriptionTier !== 'free') {
      // If premium/pro subscription is not active, fall back to free limits
      return FEATURE_LIMITS.free[featureName];
    }
    return currentLimits[featureName];
  };
  
  // Check if user has reached a limit (for countable features)
  const hasReachedLimit = (featureName: keyof typeof FEATURE_LIMITS.free, currentCount: number) => {
    const limit = canAccess(featureName);
    if (typeof limit === 'number' && limit !== Infinity) {
      return currentCount >= limit;
    }
    return false;
  };
  
  // Get the limit value for a feature
  const getLimit = (featureName: keyof typeof FEATURE_LIMITS.free) => {
    return canAccess(featureName);
  };
  
  return {
    subscriptionTier,
    isPremium,
    isActive,
    canAccess,
    hasReachedLimit,
    getLimit,
    limits: currentLimits
  };
};

// Helper component for feature gates
export const FeatureGate: React.FC<{
  feature: keyof typeof FEATURE_LIMITS.free;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ feature, fallback, children }) => {
  const { canAccess } = useFeatureAccess();
  
  if (canAccess(feature)) {
    return <>{children}</>;
  }
  
  return fallback ? <>{fallback}</> : null;
};

// Premium upgrade prompt component
export const PremiumPrompt: React.FC<{
  feature: string;
  description: string;
  className?: string;
}> = ({ feature, description, className = '' }) => {
  const handleUpgradeClick = () => {
    window.open(GUMROAD_URL, '_blank');
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center ${className}`}>
      <div className="text-4xl mb-3">🔒</div>
      <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
        Premium Feature: {feature}
      </h3>
      <p className="text-blue-700 dark:text-blue-300 mb-4">
        {description}
      </p>
      <button
        onClick={handleUpgradeClick}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Get Lifetime Access — $39 one-time
      </button>
      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
        Pay once, own everything forever. No monthly fees. 🚀
      </p>
    </div>
  );
};
