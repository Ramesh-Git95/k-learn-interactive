import { apiClient } from './apiClient';

export interface ProgressData {
  progress: { [key: string]: boolean };
  bookmarks: any[];
  stats: {
    totalWordsLearned: number;
    totalTimeSpent: number;
    sectionsCompleted: number;
    quizzesTaken: number;
    averageScore: number;
  };
  level: string;
  xp: number;
  streak: number;
  lastActiveDate?: string;
}

export interface ProgressStats {
  totalWordsLearned: number;
  totalTimeSpent: number;
  sectionsCompleted: number;
  quizzesTaken: number;
  averageScore: number;
  level: string;
  xp: number;
  streak: number;
  lastActiveDate?: string;
  totalBookmarks: number;
  joinedDate: string;
}

class ProgressService {
  // Get user's complete progress data
  async getProgress(): Promise<ProgressData> {
    const response = await apiClient.getProgress();
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch progress');
    }
    return response.data;
  }

  // Update complete progress data (for bulk updates)
  async updateProgress(progress?: { [key: string]: boolean }, bookmarks?: any[]): Promise<ProgressData> {
    const response = await apiClient.updateProgress(progress, bookmarks);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update progress');
    }
    return response.data;
  }

  // Update a single progress item
  async updateProgressItem(key: string, value: boolean): Promise<{ key: string; value: boolean; stats: any; xp: number }> {
    const response = await apiClient.updateProgressItem(key, value);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update progress item');
    }
    return response.data;
  }

  // Add a bookmark
  async addBookmark(bookmark: any): Promise<{ bookmarks: any[]; message: string }> {
    const response = await apiClient.addBookmark(bookmark);
    if (!response.success) {
      throw new Error(response.error || 'Failed to add bookmark');
    }
    return response.data;
  }

  // Remove a bookmark
  async removeBookmark(korean: string): Promise<{ bookmarks: any[]; message: string }> {
    const response = await apiClient.removeBookmark(korean);
    if (!response.success) {
      throw new Error(response.error || 'Failed to remove bookmark');
    }
    return response.data;
  }

  // Sync localStorage data to MongoDB (one-time migration)
  async syncLocalData(localProgress: { [key: string]: boolean }, localBookmarks: any[]): Promise<any> {
    const response = await apiClient.syncLocalData(localProgress, localBookmarks);
    if (!response.success) {
      throw new Error(response.error || 'Failed to sync local data');
    }
    return response.data;
  }

  // Get learning statistics
  async getStats(): Promise<ProgressStats> {
    const response = await apiClient.getProgressStats();
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch stats');
    }
    return response.data;
  }

  // Helper method to check if user is authenticated before making progress calls
  async safeProgressCall<T>(operation: () => Promise<T>, fallback?: T): Promise<T | undefined> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return fallback;
      }
      return await operation();
    } catch (error) {
      console.error('Progress API call failed:', error);
      return fallback;
    }
  }
}

export const progressService = new ProgressService();
