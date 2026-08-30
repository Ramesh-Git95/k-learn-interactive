import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { ThirdPartyIntegrations } from '../services/thirdPartyIntegrations';
import { COOKIE_CATEGORIES } from '../data/cookieCategories';

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

// Icon colours only — the wording comes from data/cookieCategories.ts.
const CATEGORY_ACCENT: Record<keyof CookieSettings, { bg: string; fg: string }> = {
  essential: { bg: 'bg-green-100 dark:bg-green-900/30', fg: 'text-green-600 dark:text-green-400' },
  preferences: { bg: 'bg-orange-100 dark:bg-orange-900/30', fg: 'text-orange-600 dark:text-orange-400' },
  analytics: { bg: 'bg-blue-100 dark:bg-blue-900/30', fg: 'text-blue-600 dark:text-blue-400' },
  marketing: { bg: 'bg-[#DDEBE4] dark:bg-[#153327]/30', fg: 'text-[#2E6B59] dark:text-[#6BA88F]' },
};

const TOGGLE_TRACK =
  "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600";

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

  // The footer's "Manage cookies" used to reopen this banner through a
  // 'reopen-cookie-consent' event; it now opens the settings page instead, so
  // the listener is gone. This banner is the first-visit ask and nothing else.

  // The recorded type has to match what was actually chosen: this value is what
  // the settings page reads back to tell you where you stand. It used to be
  // written as 'customized' every time, so accepting everything reported itself
  // as "your own selection".
  const saveCookieSettings = (settings: CookieSettings, type: 'accepted' | 'declined' | 'customized') => {
    localStorage.setItem('cookie-settings', JSON.stringify(settings));
    localStorage.setItem('cookie-consent', type);
    // GDPR audit trail — record when consent was given/updated
    localStorage.setItem('cookie-consent-date', new Date().toISOString());

    // Loads or tears down whichever integrations the choice permits. This is
    // the only thing that acts on consent; the branch that used to sit here
    // did nothing but log that analytics had been "enabled".
    ThirdPartyIntegrations.updateConsent(settings);
  };

  const handleAcceptAll = () => {
    const allEnabled = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setCookieSettings(allEnabled);
    saveCookieSettings(allEnabled, 'accepted');
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
    saveCookieSettings(onlyEssential, 'declined');
    setIsVisible(false);
    onDecline?.();
  };

  const handleCustomize = () => {
    setShowCustomizeModal(true);
  };

  const handleSaveCustomSettings = () => {
    saveCookieSettings(cookieSettings, 'customized');
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
                    We use what we need to keep you signed in and remember your settings. We run no
                    analytics or advertising today — nothing is tracked, and nothing is shared with
                    anyone. The choices below stay yours if that ever changes.{' '}
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
                  Four categories, and what actually happens if you turn each one off. You can
                  change these whenever you like.
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
              
              {COOKIE_CATEGORIES.map(cat => {
                const locked = cat.key === 'essential';
                const accent = CATEGORY_ACCENT[cat.key];
                return (
                  <div key={cat.key} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${accent.bg}`}>
                          <Icon icon={cat.icon} className={`w-4 h-4 ${accent.fg}`} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {cat.name}
                        </h3>
                        {cat.dormant && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10.5px] font-semibold uppercase tracking-wide flex-shrink-0">
                            Not in use
                          </span>
                        )}
                      </div>

                      {/* Essential says it is locked rather than drawing a switch
                          that silently refuses to move. */}
                      {locked ? (
                        <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium flex-shrink-0">
                          Always Active
                        </div>
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={cookieSettings[cat.key]}
                            onChange={() => toggleCookieType(cat.key)}
                            aria-label={`${cat.name} cookies`}
                            className="sr-only peer"
                          />
                          <div className={TOGGLE_TRACK}></div>
                        </label>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{cat.what}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{cat.offEffect}</p>
                  </div>
                );
              })}
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
