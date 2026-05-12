import { useAuth } from '../contexts/AuthContext';

// Feature flags for different subscription tiers
export const FEATURE_FLAGS = {
  // Free tier features
  FREE: {
    maxQuizzesPerDay: 3,
    basicProgress: true,
    standardContent: true,
    basicStats: true,
  },
  
  // Premium tier features  
  PREMIUM: {
    maxQuizzesPerDay: -1, // unlimited
    advancedProgress: true,
    premiumContent: true,
    advancedStats: true,
    prioritySupport: true,
    advancedQuizModes: true,
    detailedAnalytics: true,
  },
  
  // Pro tier features (for future expansion)
  PRO: {
    maxQuizzesPerDay: -1, // unlimited
    advancedProgress: true,
    premiumContent: true,
    advancedStats: true,
    prioritySupport: true,
    advancedQuizModes: true,
    detailedAnalytics: true,
    customizableInterface: true,
    apiAccess: true,
    bulkDownloads: true,
  }
};

export const useSubscription = () => {
  const { user, hasPremiumAccess } = useAuth();
  
  const subscriptionType = user?.subscription?.type || 'free';
  const subscriptionStatus = user?.subscription?.status || 'active';
  const isPremium = hasPremiumAccess();
  
  // Get features available for current subscription
  const getAvailableFeatures = () => {
    switch (subscriptionType) {
      case 'premium':
        return { ...FEATURE_FLAGS.FREE, ...FEATURE_FLAGS.PREMIUM };
      case 'pro':
        return { ...FEATURE_FLAGS.FREE, ...FEATURE_FLAGS.PREMIUM, ...FEATURE_FLAGS.PRO };
      default:
        return FEATURE_FLAGS.FREE;
    }
  };
  
  // Check if a specific feature is available
  const hasFeature = (feature: keyof typeof FEATURE_FLAGS.PREMIUM) => {
    const features = getAvailableFeatures();
    return features[feature] === true;
  };
  
  // Get numeric limits (e.g., max quizzes per day)
  const getFeatureLimit = (feature: keyof typeof FEATURE_FLAGS.PREMIUM) => {
    const features = getAvailableFeatures();
    return features[feature];
  };
  
  // Check if user can access premium content
  const canAccessPremiumContent = () => {
    return isPremium && subscriptionStatus === 'active';
  };
  
  // Get subscription tier display info
  const getSubscriptionInfo = () => {
    return {
      type: subscriptionType,
      status: subscriptionStatus,
      isPremium,
      isActive: subscriptionStatus === 'active',
      isTrial: subscriptionStatus === 'trialing',
      currentPeriodEnd: user?.subscription?.currentPeriodEnd,
      features: getAvailableFeatures()
    };
  };
  
  return {
    subscriptionType,
    subscriptionStatus,
    isPremium,
    user,
    hasFeature,
    getFeatureLimit,
    canAccessPremiumContent,
    getSubscriptionInfo,
    getAvailableFeatures
  };
};

export default useSubscription;
