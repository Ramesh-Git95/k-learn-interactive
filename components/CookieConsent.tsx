import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { ThirdPartyIntegrations } from '../services/thirdPartyIntegrations';

interface CookieConsentProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const DEFAULT_COOKIE_SETTINGS: CookieSettings = {
  essential: true, // Always required
  analytics: false,
  marketing: false,
  preferences: false,
};

const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onDecline }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [cookieSettings, setCookieSettings] = useState<CookieSettings>(DEFAULT_COOKIE_SETTINGS);

  useEffect(() => {
    const savedSettings = localStorage.getItem('cookie-settings');
    if (savedSettings) setCookieSettings(JSON.parse(savedSettings));

    if (!localStorage.getItem('cookie-consent')) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for "Manage Cookies" click from footer
  useEffect(() => {
    const handler = () => setIsVisible(true);
    window.addEventListener('reopen-cookie-consent', handler);
    return () => window.removeEventListener('reopen-cookie-consent', handler);
  }, []);

  const saveCookieSettings = (settings: CookieSettings) => {
    localStorage.setItem('cookie-settings', JSON.stringify(settings));
    localStorage.setItem('cookie-consent', 'customized');
    // GDPR audit trail — record when consent was given/updated
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    
    // Apply cookie settings to actual tracking/analytics
    applyCookieSettings(settings);
    
    // Update third-party integrations
    ThirdPartyIntegrations.updateConsent(settings);
  };

  const applyCookieSettings = (settings: CookieSettings) => {
    // Essential cookies are always enabled
    
    // Analytics cookies (e.g., Google Analytics)
    if (settings.analytics) {
      // Enable analytics tracking
      console.log('✅ Analytics cookies enabled');
      // Example: gtag('config', 'GA_MEASUREMENT_ID');
    } else {
      // Disable analytics tracking
      console.log('❌ Analytics cookies disabled');
      // Example: Remove GA scripts, clear analytics cookies
    }

    // Marketing cookies (e.g., ads, social media)
    if (settings.marketing) {
      console.log('✅ Marketing cookies enabled');
      // Enable marketing pixels, social media widgets
    } else {
      console.log('❌ Marketing cookies disabled');
      // Disable marketing trackers
    }

    // Preference cookies (e.g., theme, language)
    if (settings.preferences) {
      console.log('✅ Preference cookies enabled');
      // Allow preference storage
    } else {
      console.log('❌ Preference cookies disabled');
      // Use session storage instead of persistent cookies
    }
  };

  const handleAcceptAll = () => {
    const allEnabled = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setCookieSettings(allEnabled);
    saveCookieSettings(allEnabled);
    setIsVisible(false);
    onAccept?.();
  };

  const handleDeclineAll = () => {
    const onlyEssential = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setCookieSettings(onlyEssential);
    saveCookieSettings(onlyEssential);
    setIsVisible(false);
    onDecline?.();
  };

  const handleCustomize = () => {
    setShowCustomizeModal(true);
  };

  const handleSaveCustomSettings = () => {
    saveCookieSettings(cookieSettings);
    setShowCustomizeModal(false);
    setIsVisible(false);
  };

  const toggleCookieType = (type: keyof CookieSettings) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    
    setCookieSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/25 z-40 pointer-events-none" />
      
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-lg">🍪</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    We use cookies
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    We use essential cookies to make our site work. We'd also like to set analytics cookies to help us improve our website. We won't set optional cookies unless you give consent.{' '}
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-footer-page', { detail: 'privacy' }))}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Privacy Policy
                    </button>
                  </p>
                  <div className="mt-2">
                    <button
                      onClick={handleCustomize}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium underline transition-colors"
                    >
                      Customize cookie settings
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
              <button
                onClick={handleDeclineAll}
                className="px-6 py-2 border border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-400 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-950-secondary rounded-lg font-medium transition-colors text-sm"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Accept all cookies
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Customization Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-[101]">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Cookie Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Manage your cookie preferences. You can enable or disable different categories of cookies below.
                </p>
              </div>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <Icon icon="close" className="w-6 h-6" />
              </button>
            </div>

            {/* Cookie Categories */}
            <div className="space-y-6">
              
              {/* Essential Cookies */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Icon icon="check" className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Essential Cookies
                    </h3>
                  </div>
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                    Always Active
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  These cookies are necessary for the website to function and cannot be switched off. They enable core functionality such as security, network management, and accessibility.
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <strong>Used for:</strong> Authentication, security, remembering your preferences, load balancing
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Icon icon="chart" className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Analytics Cookies
                    </h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cookieSettings.analytics}
                      onChange={() => toggleCookieType('analytics')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <strong>Used for:</strong> Page views, user behavior analysis, performance monitoring, A/B testing
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#DDEBE4] dark:bg-[#153327]/30 rounded-full flex items-center justify-center">
                      <Icon icon="star" className="w-4 h-4 text-[#2E6B59] dark:text-[#6BA88F]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Marketing Cookies
                    </h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cookieSettings.marketing}
                      onChange={() => toggleCookieType('marketing')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  These cookies are used to track visitors across websites to display relevant and engaging advertisements.
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <strong>Used for:</strong> Targeted advertising, social media sharing, remarketing campaigns
                </div>
              </div>

              {/* Preference Cookies */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                      <Icon icon="settings" className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Preference Cookies
                    </h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cookieSettings.preferences}
                      onChange={() => toggleCookieType('preferences')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  These cookies remember your preferences and settings to provide a personalized experience.
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <strong>Used for:</strong> Theme preferences, language settings, customized layouts, saved filters
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  setCookieSettings(DEFAULT_COOKIE_SETTINGS);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-sm font-medium"
              >
                Reset to Default
              </button>
              <div className="flex space-x-3 sm:ml-auto">
                <button
                  onClick={() => setShowCustomizeModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-400 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-950-secondary rounded-lg font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustomSettings}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
