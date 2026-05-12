import { useState, useEffect } from 'react';
import { GoogleAnalytics } from '../services/thirdPartyIntegrations';

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentStatus {
  hasConsent: boolean;
  consentType: 'none' | 'accepted' | 'declined' | 'customized';
  settings: CookieSettings;
}

const DEFAULT_SETTINGS: CookieSettings = {
  essential: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

/**
 * Hook to manage cookie consent throughout the application
 */
export const useCookieConsent = () => {
  const [consentStatus, setConsentStatus] = useState<CookieConsentStatus>({
    hasConsent: false,
    consentType: 'none',
    settings: DEFAULT_SETTINGS,
  });

  useEffect(() => {
    // Check localStorage for existing consent
    const consent = localStorage.getItem('cookie-consent');
    const settings = localStorage.getItem('cookie-settings');

    if (consent) {
      const parsedSettings = settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
      setConsentStatus({
        hasConsent: true,
        consentType: consent as 'accepted' | 'declined' | 'customized',
        settings: parsedSettings,
      });
    }
  }, []);

  /**
   * Check if a specific type of cookie is allowed
   */
  const isCookieAllowed = (type: keyof CookieSettings): boolean => {
    return consentStatus.settings[type];
  };

  /**
   * Check if analytics tracking should be enabled
   */
  const canTrackAnalytics = (): boolean => {
    return consentStatus.hasConsent && consentStatus.settings.analytics;
  };

  /**
   * Check if marketing cookies are allowed
   */
  const canUseMarketing = (): boolean => {
    return consentStatus.hasConsent && consentStatus.settings.marketing;
  };

  /**
   * Check if preference cookies are allowed
   */
  const canSavePreferences = (): boolean => {
    return consentStatus.hasConsent && consentStatus.settings.preferences;
  };

  /**
   * Reset cookie consent (for settings page or admin)
   */
  const resetConsent = () => {
    localStorage.removeItem('cookie-consent');
    localStorage.removeItem('cookie-settings');
    setConsentStatus({
      hasConsent: false,
      consentType: 'none',
      settings: DEFAULT_SETTINGS,
    });
  };

  /**
   * Update consent status when user changes settings
   */
  const updateConsent = (newSettings: CookieSettings, type: 'accepted' | 'declined' | 'customized') => {
    localStorage.setItem('cookie-consent', type);
    localStorage.setItem('cookie-settings', JSON.stringify(newSettings));
    setConsentStatus({
      hasConsent: true,
      consentType: type,
      settings: newSettings,
    });
  };

  return {
    consentStatus,
    isCookieAllowed,
    canTrackAnalytics,
    canUseMarketing,
    canSavePreferences,
    resetConsent,
    updateConsent,
  };
};

/**
 * Utility functions for cookie management
 */
export const CookieManager = {
  
  /**
   * Set a cookie with proper consent checking
   */
  setCookie: (name: string, value: string, type: keyof CookieSettings = 'essential', days: number = 30) => {
    const settings = localStorage.getItem('cookie-settings');
    const cookieSettings = settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
    
    if (!cookieSettings[type] && type !== 'essential') {
      console.warn(`Cookie ${name} not set: ${type} cookies are disabled`);
      return false;
    }

    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    return true;
  },

  /**
   * Get a cookie value
   */
  getCookie: (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  /**
   * Delete a cookie
   */
  deleteCookie: (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },

  /**
   * Clear all cookies of a specific type (useful when user revokes consent)
   */
  clearCookiesByType: (type: keyof CookieSettings) => {
    if (type === 'essential') {
      console.warn('Cannot clear essential cookies');
      return;
    }

    // Define which cookies belong to each category
    const cookieCategories = {
      analytics: ['_ga', '_ga_', '_gid', '_gat', '__utma', '__utmb', '__utmc', '__utmt', '__utmz'],
      marketing: ['_fbp', '_fbc', '__fb_chat_plugin', 'ads_prefs', 'marketing_'],
      preferences: ['theme', 'language', 'user_prefs', 'layout_', 'filter_'],
    };

    const cookiesToClear = cookieCategories[type] || [];
    
    cookiesToClear.forEach(cookieName => {
      // Clear exact matches and prefix matches
      Object.keys(document.cookie.split(';')).forEach(cookie => {
        const cleanCookie = cookie.trim().split('=')[0];
        if (cleanCookie === cookieName || cleanCookie.startsWith(cookieName)) {
          CookieManager.deleteCookie(cleanCookie);
        }
      });
    });

    console.log(`Cleared ${type} cookies`);
  },

  /**
   * Initialize Google Analytics based on consent
   */
  initializeAnalytics: () => {
    const settings = localStorage.getItem('cookie-settings');
    const cookieSettings = settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
    
    if (cookieSettings.analytics) {
      // Initialize Google Analytics
      GoogleAnalytics.init();
    } else {
      console.log('📊 Analytics disabled by user preference');
    }
  },

  /**
   * Track events respecting user consent
   */
  trackEvent: (eventName: string, parameters?: Record<string, any>) => {
    const settings = localStorage.getItem('cookie-settings');
    const cookieSettings = settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
    
    if (cookieSettings.analytics) {
      // Track the event using Google Analytics
      GoogleAnalytics.trackEvent(eventName, parameters);
    } else {
      console.log('📊 Event not tracked (analytics disabled):', eventName);
    }
  }
};

export default useCookieConsent;
