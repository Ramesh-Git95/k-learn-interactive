import React, { useState, useEffect } from 'react';
import { useCookieConsent, CookieManager } from '../hooks/useCookieConsent';
import Icon from './Icon';

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const CookieSettingsPage: React.FC = () => {
  const { consentStatus, updateConsent, resetConsent } = useCookieConsent();
  const [settings, setSettings] = useState<CookieSettings>(consentStatus.settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setSettings(consentStatus.settings);
  }, [consentStatus.settings]);

  const toggleCookieType = (type: keyof CookieSettings) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    
    const newSettings = {
      ...settings,
      [type]: !settings[type]
    };
    setSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(consentStatus.settings));
  };

  const handleSave = () => {
    updateConsent(settings, 'customized');
    setHasChanges(false);
    
    // Clear cookies for disabled categories
    Object.keys(settings).forEach(key => {
      const cookieType = key as keyof CookieSettings;
      if (!settings[cookieType] && consentStatus.settings[cookieType]) {
        CookieManager.clearCookiesByType(cookieType);
      }
    });

    // Show success message
    const event = new CustomEvent('show-toast', {
      detail: {
        type: 'success',
        message: 'Cookie preferences saved successfully!'
      }
    });
    window.dispatchEvent(event);
  };

  const handleReset = () => {
    resetConsent();
    setShowResetConfirm(false);
    setHasChanges(false);
    
    // Clear all non-essential cookies
    CookieManager.clearCookiesByType('analytics');
    CookieManager.clearCookiesByType('marketing');
    CookieManager.clearCookiesByType('preferences');

    const event = new CustomEvent('show-toast', {
      detail: {
        type: 'info',
        message: 'Cookie preferences reset. Please set your preferences again.'
      }
    });
    window.dispatchEvent(event);
  };

  const getConsentStatusBadge = () => {
    switch (consentStatus.consentType) {
      case 'accepted':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm font-medium">
            All Cookies Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full text-sm font-medium">
            Only Essential Cookies
          </span>
        );
      case 'customized':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium">
            Custom Settings
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 rounded-full text-sm font-medium">
            No Consent Given
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Cookie Settings
          </h1>
          {getConsentStatusBadge()}
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your cookie preferences and control what data we can collect. Changes take effect immediately.
        </p>
      </div>

      {/* Current Status */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <Icon icon="lightbulb" className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
              About Cookies
            </h3>
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              Cookies help us provide you with a better experience. Essential cookies are required for the site to function, 
              while other cookies help us understand how you use our site and personalize your experience.
            </p>
          </div>
        </div>
      </div>

      {/* Cookie Categories */}
      <div className="space-y-6 mb-8">
        
        {/* Essential Cookies */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Icon icon="lock" className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Essential Cookies
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Required for basic site functionality
                </p>
              </div>
            </div>
            <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
              Always Active
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            These cookies are necessary for the website to function and cannot be switched off. They are usually only set in 
            response to actions made by you which amount to a request for services, such as setting your privacy preferences, 
            logging in or filling in forms.
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Examples:</strong> Authentication tokens, security settings, accessibility preferences, load balancing
          </div>
        </div>

        {/* Analytics Cookies */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Icon icon="chart" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analytics Cookies
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Help us understand site usage
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.analytics}
                onChange={() => toggleCookieType('analytics')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. 
            They help us to know which pages are the most and least popular and see how visitors move around the site.
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Examples:</strong> Google Analytics, page view tracking, user journey analysis, performance monitoring
          </div>
        </div>

        {/* Marketing Cookies */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Icon icon="star" className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Marketing Cookies
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Used for targeted advertising
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.marketing}
                onChange={() => toggleCookieType('marketing')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            These cookies may be set by our advertising partners through our site. They may be used to build a profile of your 
            interests and show you relevant advertisements on other sites.
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Examples:</strong> Facebook Pixel, Google Ads, remarketing tags, social media widgets
          </div>
        </div>

        {/* Preference Cookies */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Icon icon="settings" className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Preference Cookies
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Remember your personal settings
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.preferences}
                onChange={() => toggleCookieType('preferences')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            These cookies enable the website to remember information that changes the way the website behaves or looks, 
            such as your preferred language or the region that you are in.
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Examples:</strong> Dark/light theme, language settings, layout preferences, saved filters
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-center justify-between p-6 bg-gray-50 dark:bg-gray-950-secondary rounded-lg">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium text-sm transition-colors"
        >
          Reset All Preferences
        </button>
        
        <div className="flex space-x-3">
          {hasChanges && (
            <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              You have unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors ${
              hasChanges
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reset Cookie Preferences?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              This will reset all your cookie preferences and clear existing cookies. You'll need to set your preferences again.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookieSettingsPage;
