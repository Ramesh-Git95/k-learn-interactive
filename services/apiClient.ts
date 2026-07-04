// API configuration and service functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Simple HTTP client
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; success: boolean; error?: string }> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Refresh token from localStorage before each request
    this.token = localStorage.getItem('token');
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    console.log(`🔑 Token present: ${!!this.token}`);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      console.log(`📥 API Response: ${response.status}`, data);

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && data.error === 'TOKEN_EXPIRED') {
          localStorage.removeItem('token');
          this.token = null;
          window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
        }
        
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
          data: data
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: null as unknown as T
      };
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, acceptedTerms: true }),
    });
  }

  async getProfile() {
    return this.request<{ user: any }>('/auth/me');
  }

  async updateProfile(profileData: any) {
    return this.request<{ user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async logout() {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request<{ message: string }>(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  // User endpoints
  async getUserStats() {
    return this.request<{ stats: any }>('/users/stats');
  }

  async updateLessonProgress(lessonId: string, xpGained?: number) {
    return this.request<{ progress: any }>('/users/progress/lesson', {
      method: 'POST',
      body: JSON.stringify({ lessonId, xpGained }),
    });
  }

  async addXP(amount: number, source?: string) {
    return this.request<{ xp: any }>('/users/progress/xp', {
      method: 'POST',
      body: JSON.stringify({ amount, source }),
    });
  }

  async getLeaderboard(limit?: number, timeframe?: string) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (timeframe) params.append('timeframe', timeframe);
    
    return this.request<{ leaderboard: any[] }>(`/users/leaderboard?${params}`);
  }

  // Daily activity tracking
  async getDailyActivity() {
    return this.request<{ dailyActivity: { quizzesTaken: number; vocabularyStudied: number; phrasesStudied: number } }>('/users/daily-activity');
  }

  async trackDailyActivity(activityType: 'quiz' | 'vocabulary' | 'phrases', count?: number) {
    return this.request<{ dailyActivity: { quizzesTaken: number; vocabularyStudied: number; phrasesStudied: number } }>('/users/daily-activity', {
      method: 'POST',
      body: JSON.stringify({ activityType, count }),
    });
  }

  // Progress endpoints
  async getProgress() {
    return this.request<{
      progress: { [key: string]: boolean };
      bookmarks: any[];
      stats: any;
      level: string;
      xp: number;
      streak: number;
      lastActiveDate?: string;
    }>('/progress');
  }

  async updateProgress(progress?: { [key: string]: boolean }, bookmarks?: any[]) {
    return this.request<{
      progress: { [key: string]: boolean };
      bookmarks: any[];
      stats: any;
      level: string;
      xp: number;
      streak: number;
      lastActiveDate?: string;
    }>('/progress', {
      method: 'POST',
      body: JSON.stringify({ progress, bookmarks }),
    });
  }

  async updateProgressItem(key: string, value: boolean) {
    return this.request<{ key: string; value: boolean; stats: any; xp: number }>('/progress/item', {
      method: 'PATCH',
      body: JSON.stringify({ key, value }),
    });
  }

  async addBookmark(bookmark: any) {
    return this.request<{ bookmarks: any[]; message: string }>('/progress/bookmark', {
      method: 'POST',
      body: JSON.stringify(bookmark),
    });
  }

  async removeBookmark(korean: string) {
    return this.request<{ bookmarks: any[]; message: string }>(`/progress/bookmark/${encodeURIComponent(korean)}`, {
      method: 'DELETE',
    });
  }

  async syncLocalData(localProgress: { [key: string]: boolean }, localBookmarks: any[]) {
    return this.request<{
      message: string;
      progress: { [key: string]: boolean };
      bookmarks: any[];
      stats: any;
    }>('/progress/sync', {
      method: 'POST',
      body: JSON.stringify({ localProgress, localBookmarks }),
    });
  }

  async getProgressStats() {
    return this.request<{
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
    }>('/progress/stats');
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types
export interface User {
  id: string;
  email: string;
  name: string;
  subscription: {
    type: 'free' | 'premium' | 'pro';
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    hasAccess: boolean;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
  };
  progress: {
    level: 'beginner' | 'intermediate' | 'advanced';
    xp: number;
    streak: number;
    lastActiveDate?: Date;
    completedLessons: string[];
    srsData: {
      totalCards: number;
      reviewsToday: number;
      accuracyRate: number;
    };
  };
  preferences: {
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      dailyReminder: boolean;
    };
    theme: 'light' | 'dark' | 'auto';
  };
  emailVerified: boolean;
  createdAt: Date;
}

