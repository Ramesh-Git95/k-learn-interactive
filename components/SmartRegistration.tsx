import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { useAuthModal } from '../contexts/AuthModalContext';

interface ProgressPromptProps {
  trigger: 'timeSpent' | 'wordsLearned' | 'beforeExit' | 'bookmark';
  onDismiss?: () => void;
}

export const ProgressPrompt: React.FC<ProgressPromptProps> = ({ trigger, onDismiss }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToastContext();
  const { openRegister, openLogin } = useAuthModal();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Don't show if user is already authenticated
    if (isAuthenticated) {
      setIsVisible(false);
      return;
    }

    // Show the prompt
    setIsVisible(true);
  }, [isAuthenticated]);

  if (!isVisible || isAuthenticated) return null;

  const getPromptContent = () => {
    switch (trigger) {
      case 'timeSpent':
        return {
          title: "Great progress! 🎉",
          message: "You've been learning for a while! Sign up to save your progress and never lose it.",
          icon: "📈"
        };
      case 'wordsLearned':
        return {
          title: "Awesome learning! 🌟", 
          message: "You've learned several Korean words! Create an account to track your achievements.",
          icon: "🏆"
        };
      case 'beforeExit':
        return {
          title: "Don't lose your progress! 💭",
          message: "Your learning progress will be lost when you close this tab. Sign up to save it!",
          icon: "⚠️"
        };
      case 'bookmark':
        return {
          title: "Save your favorites! 📌",
          message: "Create an account to permanently save your bookmarked content.",
          icon: "💾"
        };
      default:
        return {
          title: "Join K-Learn! 🚀",
          message: "Sign up to save your progress and unlock more features.",
          icon: "✨"
        };
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  const handleSignUp = () => {
    openRegister();
    handleDismiss();
  };

  const handleSignIn = () => {
    openLogin();
    handleDismiss();
  };

  const content = getPromptContent();

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-md w-full animate-slideUp">
        <div className="text-center">
          <div className="text-4xl mb-4">{content.icon}</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {content.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {content.message}
          </p>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleSignUp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Get Started - It's Free! 🆓
            </button>
            
            <button
              onClick={handleSignIn}
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              I Have an Account
            </button>
            
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to track user engagement and trigger prompts
export const useSmartRegistration = () => {
  const { isAuthenticated } = useAuth();
  const [sessionStartTime] = useState(Date.now());
  const [wordsLearned, setWordsLearned] = useState(0);
  const [showPrompt, setShowPrompt] = useState<ProgressPromptProps['trigger'] | null>(null);
  
  // Get previously shown prompts from sessionStorage to avoid spam
  const [promptShown, setPromptShown] = useState<Set<string>>(() => {
    const stored = sessionStorage.getItem('smartRegistrationShown');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // Save to sessionStorage when prompts are shown
  useEffect(() => {
    sessionStorage.setItem('smartRegistrationShown', JSON.stringify([...promptShown]));
  }, [promptShown]);

  // Track time spent
  useEffect(() => {
    if (isAuthenticated) return;

    const checkTimeSpent = () => {
      const timeSpent = Date.now() - sessionStartTime;
      const tenMinutes = 10 * 60 * 1000; // 10 minutes (reduced for better engagement)
      
      if (timeSpent > tenMinutes && !promptShown.has('timeSpent')) {
        setShowPrompt('timeSpent');
        setPromptShown(prev => new Set([...prev, 'timeSpent']));
      }
    };

    const interval = setInterval(checkTimeSpent, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated, sessionStartTime, promptShown]);

  // Track words learned
  useEffect(() => {
    if (isAuthenticated) return;

    if (wordsLearned >= 3 && !promptShown.has('wordsLearned')) { // Reduced from 5 to 3
      setShowPrompt('wordsLearned');
      setPromptShown(prev => new Set([...prev, 'wordsLearned']));
    }
  }, [wordsLearned, isAuthenticated, promptShown]);

  // Track before page unload
  useEffect(() => {
    if (isAuthenticated) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const timeSpent = Date.now() - sessionStartTime;
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes
      
      if (timeSpent > fiveMinutes && !promptShown.has('beforeExit')) {
        setShowPrompt('beforeExit');
        setPromptShown(prev => new Set([...prev, 'beforeExit']));
        e.preventDefault();
        e.returnValue = "Your Korean learning progress will be lost! Consider signing up to save it.";
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated, sessionStartTime, promptShown]);

  const trackWordLearned = () => {
    if (!isAuthenticated) {
      setWordsLearned(prev => prev + 1);
    }
  };

  const showBookmarkPrompt = () => {
    if (!isAuthenticated && !promptShown.has('bookmark')) {
      setShowPrompt('bookmark');
      setPromptShown(prev => new Set([...prev, 'bookmark']));
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(null);
  };

  return {
    showPrompt,
    dismissPrompt,
    trackWordLearned,
    showBookmarkPrompt,
    isAuthenticated
  };
};
