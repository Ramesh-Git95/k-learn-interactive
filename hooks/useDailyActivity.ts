import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

interface DailyActivity {
  quizzesTaken: number;
  vocabularyStudied: number;
  phrasesStudied: number;
}

export const useDailyActivity = () => {
  const [dailyActivity, setDailyActivity] = useState<DailyActivity>({
    quizzesTaken: 0,
    vocabularyStudied: 0,
    phrasesStudied: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch daily activity data
  const fetchDailyActivity = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getDailyActivity();
      
      if (response.success && response.data.dailyActivity) {
        setDailyActivity(response.data.dailyActivity);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch daily activity');
      }
    } catch (err) {
      console.error('Error fetching daily activity:', err);
      setError('Failed to fetch daily activity');
    } finally {
      setIsLoading(false);
    }
  };

  // Track a daily activity
  const trackActivity = async (activityType: 'quiz' | 'vocabulary' | 'phrases', count: number = 1) => {
    try {
      const response = await apiClient.trackDailyActivity(activityType, count);
      
      if (response.success && response.data.dailyActivity) {
        setDailyActivity(response.data.dailyActivity);
        return true;
      } else {
        console.error('Failed to track activity:', response.error);
        return false;
      }
    } catch (err) {
      console.error('Error tracking activity:', err);
      return false;
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchDailyActivity();
  }, []);

  return {
    dailyActivity,
    isLoading,
    error,
    trackActivity,
    refetch: fetchDailyActivity
  };
};
