import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

interface SubscriptionBadgeProps {
  className?: string;
  showDetails?: boolean;
}

const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const { user, hasPremiumAccess } = useAuth();

  if (!user) return null;

  const isPremium = hasPremiumAccess();
  const subscriptionType = user.subscription?.type || 'free';
  const subscriptionStatus = user.subscription?.status || 'active';

  return (
    <div className={`inline-flex items-center ${className}`}>
      {/* Main Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isPremium 
          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-md'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
      }`}>
        {isPremium ? (
          <Icon icon="star" className="w-4 h-4 mr-1" />
        ) : (
          <Icon icon="user" className="w-4 h-4 mr-1" />
        )}
        {subscriptionType.toUpperCase()}
      </div>

      {/* Status Indicator */}
      <div className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
        subscriptionStatus === 'active'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : subscriptionStatus === 'trialing'
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      }`}>
        {subscriptionStatus === 'trialing' ? 'TRIAL' : subscriptionStatus.toUpperCase()}
      </div>

      {/* Detailed Info */}
      {showDetails && user.subscription?.currentPeriodEnd && (
        <div className="ml-3 text-xs text-gray-500 dark:text-gray-400">
          {subscriptionStatus === 'active' ? 'Renews' : 'Expires'}: {' '}
          {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default SubscriptionBadge;
