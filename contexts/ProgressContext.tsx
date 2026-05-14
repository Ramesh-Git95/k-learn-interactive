import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { progressService } from '../services/progressService';
import { useToastContext } from './ToastContext';
import { markStudyToday } from '../utils/xpStreak';

interface ProgressContextType {
  progress: { [key: string]: boolean };
  bookmarks: any[];
  isLoading: boolean;
  isSyncing: boolean;
  updateProgress: (key: string, value: boolean) => Promise<void>;
  updateBookmarks: (bookmarks: any[]) => Promise<void>;
  addBookmark: (bookmark: any) => Promise<void>;
  removeBookmark: (korean: string) => Promise<void>;
  syncLocalData: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToastContext();
  const [progress, setProgress] = useState<{ [key: string]: boolean }>({});
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);

  // Load progress from localStorage on mount
  useEffect(() => {
    const localProgress = localStorage.getItem('k-learn-progress');
    const localBookmarks = localStorage.getItem('k-learn-bookmarks');
    
    if (localProgress) {
      try {
        setProgress(JSON.parse(localProgress));
      } catch (e) {
        console.error('Error parsing local progress:', e);
      }
    }
    
    if (localBookmarks) {
      try {
        setBookmarks(JSON.parse(localBookmarks));
      } catch (e) {
        console.error('Error parsing local bookmarks:', e);
      }
    }
  }, []);

  // Load progress from server when user logs in
  useEffect(() => {
    if (isAuthenticated && !hasLoadedFromServer) {
      loadProgressFromServer();
    } else if (!isAuthenticated) {
      setHasLoadedFromServer(false);
    }
  }, [isAuthenticated, hasLoadedFromServer]);

  const loadProgressFromServer = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const serverData = await progressService.safeProgressCall(
        () => progressService.getProgress(),
        {
          progress: {},
          bookmarks: [],
          stats: { totalWordsLearned: 0, totalTimeSpent: 0, sectionsCompleted: 0, quizzesTaken: 0, averageScore: 0 },
          level: 'beginner',
          xp: 0,
          streak: 0
        }
      );
      
      if (serverData) {
        setProgress(serverData.progress || {});
        setBookmarks(serverData.bookmarks || []);
        setHasLoadedFromServer(true);
        
        // Update localStorage with server data
        localStorage.setItem('k-learn-progress', JSON.stringify(serverData.progress || {}));
        localStorage.setItem('k-learn-bookmarks', JSON.stringify(serverData.bookmarks || []));
      }
    } catch (error) {
      console.error('Error loading progress from server:', error);
      showToast('Failed to load progress from server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const syncLocalData = async () => {
    if (!isAuthenticated) return;
    
    setIsSyncing(true);
    try {
      const localProgress = JSON.parse(localStorage.getItem('k-learn-progress') || '{}');
      const localBookmarks = JSON.parse(localStorage.getItem('k-learn-bookmarks') || '[]');
      
      const result = await progressService.syncLocalData(localProgress, localBookmarks);
      
      setProgress(result.progress || {});
      setBookmarks(result.bookmarks || []);
      
      // Update localStorage with merged data
      localStorage.setItem('k-learn-progress', JSON.stringify(result.progress || {}));
      localStorage.setItem('k-learn-bookmarks', JSON.stringify(result.bookmarks || []));
      
      showToast('Progress synced successfully!', 'success');
    } catch (error) {
      console.error('Error syncing local data:', error);
      showToast('Failed to sync progress', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateProgress = async (key: string, value: boolean) => {
    console.log(`🎯 Frontend: Updating ${key} = ${value}`);

    // Mark streak only — XP is awarded by each section directly with appropriate amounts
    if (value) {
      markStudyToday();
    }

    // Update local state immediately for responsive UI
    setProgress(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('k-learn-progress', JSON.stringify(updated));
      return updated;
    });

    // Update server if authenticated
    if (isAuthenticated) {
      try {
        console.log(`📡 Sending to server: ${key} = ${value}`);
        const result = await progressService.updateProgressItem(key, value);
        console.log(`✅ Server sync complete for: ${key}`, result);
      } catch (error) {
        console.error('❌ Error updating progress on server:', error);
        showToast('Failed to sync progress to server', 'error');
        // Could add retry logic here
      }
    } else {
      console.log('⚠️ User not authenticated, skipping server update');
    }
  };

  const updateBookmarks = async (newBookmarks: any[]) => {
    setBookmarks(newBookmarks);
    localStorage.setItem('k-learn-bookmarks', JSON.stringify(newBookmarks));

    if (isAuthenticated) {
      try {
        await progressService.safeProgressCall(
          () => progressService.updateProgress(undefined, newBookmarks)
        );
      } catch (error) {
        console.error('Error updating bookmarks on server:', error);
      }
    }
  };

  const addBookmark = async (bookmark: any) => {
    const newBookmarks = [...bookmarks, bookmark];
    await updateBookmarks(newBookmarks);
  };

  const removeBookmark = async (korean: string) => {
    const newBookmarks = bookmarks.filter(b => b.korean !== korean);
    await updateBookmarks(newBookmarks);
  };

  const value = {
    progress,
    bookmarks,
    isLoading,
    isSyncing,
    updateProgress,
    updateBookmarks,
    addBookmark,
    removeBookmark,
    syncLocalData,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
