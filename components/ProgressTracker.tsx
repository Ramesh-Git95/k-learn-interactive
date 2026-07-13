import React, { useEffect, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import Tooltip from './Tooltip';

interface ProgressTrackerProps {
  currentSection: string;
  totalItems?: number;
  completedItems?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  requirement: number;
  currentValue: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
  currentSection, 
  totalItems = 0, 
  completedItems = 0 
}) => {
  const [achievements, setAchievements] = useLocalStorage<Achievement[]>('k-learn-achievements', []);
  const [showNotification, setShowNotification] = useState<Achievement | null>(null);

  const defaultAchievements: Achievement[] = [
    { id: 'first_vocab', title: 'First Steps', description: 'Complete your first vocabulary item', icon: '🌱', unlocked: false, requirement: 1, currentValue: 0 },
    { id: 'vocab_master', title: 'Vocabulary Master', description: 'Complete 50 vocabulary items', icon: '📚', unlocked: false, requirement: 50, currentValue: 0 },
    { id: 'hangul_learner', title: 'Hangul Explorer', description: 'Practice all Hangul characters', icon: '🔤', unlocked: false, requirement: 1, currentValue: 0 },
    { id: 'quiz_champion', title: 'Quiz Champion', description: 'Score 100% on 5 quizzes', icon: '🏆', unlocked: false, requirement: 5, currentValue: 0 },
    { id: 'bookmark_collector', title: 'Bookmark Collector', description: 'Bookmark 20 items', icon: '📌', unlocked: false, requirement: 20, currentValue: 0 },
  ];

  useEffect(() => {
    if (achievements.length === 0) {
      setAchievements(defaultAchievements);
    }
  }, []);

  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const checkAchievements = (type: string, value: number) => {
    const updatedAchievements = achievements.map(achievement => {
      if (achievement.id.includes(type) && !achievement.unlocked) {
        const newValue = Math.max(achievement.currentValue, value);
        if (newValue >= achievement.requirement) {
          setShowNotification(achievement);
          setTimeout(() => setShowNotification(null), 3000);
          return { ...achievement, unlocked: true, currentValue: newValue };
        }
        return { ...achievement, currentValue: newValue };
      }
      return achievement;
    });
    setAchievements(updatedAchievements);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)} Progress
          </h3>
          <Tooltip 
            content="Your completion rate for this section. Progress is saved automatically as you study."
            position="left"
            maxWidth="max-w-xs"
          >
            <span className="text-sm text-gray-500 dark:text-gray-400 cursor-help">
              {completedItems}/{totalItems}
            </span>
          </Tooltip>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-[#E4572E] dark:bg-[#E4572E] h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <Tooltip 
          content="Consistency is key in language learning. Even small daily progress adds up to significant fluency over time."
          position="bottom"
          maxWidth="max-w-xs"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 cursor-help">
            {progressPercentage.toFixed(1)}% complete
          </p>
        </Tooltip>
      </div>

      {/* Achievement Notification */}
      {showNotification && (
        <div className="fixed top-20 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 animate-slideIn">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{showNotification.icon}</span>
            <div>
              <p className="font-semibold">Achievement Unlocked!</p>
              <p className="text-sm">{showNotification.title}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProgressTracker;
