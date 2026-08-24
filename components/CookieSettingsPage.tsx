import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useCookieConsent, CookieManager } from '../hooks/useCookieConsent';
import FooterPageModal, { type FooterPage } from './FooterPageModal';

// Cookie settings.
//
// The design's brief is "four categories, each in plain English with the actual
// consequence of switching it off. Essential is shown as locked, not as a fake
// toggle" — and that consequence line is the part that was missing. A toggle
// with no stated effect asks someone to make a decision with nothing to decide
// on.
//
// The design goes further than it knew on one row. Its Marketing entry says
// "there is nothing to switch — this row exists so you can see it is empty",
// which is exactly right, and it turns out to be just as true of Analytics:
// services/thirdPartyIntegrations.ts carries a real Google Analytics loader,
// but measurementId is still the placeholder 'GA_MEASUREMENT_ID' and a guard
// skips loading whenever it is. No script is ever injected and no analytics
// cookie is ever set. The page said "Google Analytics, page view tracking,
// user journey analysis" and the Marketing row named Facebook Pixel and Google
// Ads — third parties this app has never contacted.
//
// The toggles stay, and saving still writes and clears consent, because the
// machinery is real and would work the moment an ID is configured. What changes
// is that the page no longer describes tracking as though it were running.

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

type CategoryKey = keyof CookieSettings;

const CATEGORIES: {
  key: CategoryKey;
  name: string;
  what: string;
  offEffect: string;
  /** Nothing is wired to this category today. */
  dormant?: boolean;
}[] = [
  {
    key: 'essential',
    name: 'Essential',
    what: 'Signing in, your plan, and which review cards are due.',
    offEffect: 'Cannot be switched off — without it the app has no way to know who you are.',
  },
  {
    key: 'preferences',
    name: 'Preferences',
    what: 'Dark mode, and the settings you have chosen inside a section.',
    offEffect: 'Turned off: these go back to their defaults every time you arrive.',
  },
  {
    key: 'analytics',
    name: 'Analytics',
    what: 'Nothing at present. The integration exists but has never been configured, so no analytics script loads and no analytics cookie is set.',
    offEffect: 'Nothing changes either way today. The switch is here so it is yours the day that changes.',
    dormant: true,
  },
  {
    key: 'marketing',
    name: 'Marketing',
    what: 'Nothing. We run no advertising and share nothing with ad networks.',
    offEffect: 'There is nothing to switch off — this row exists so you can see that it is empty.',
    dormant: true,
  },
];

const NEVER = ['No ad networks', 'No selling data', 'No cross-site tracking', 'No third-party profiling'];

const railCard =
  'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

const toast = (type: 'success' | 'info', message: string) =>
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { type, message } }));

const CookieSettingsPage: React.FC = () => {
  const { consentStatus, updateConsent, resetConsent } = useCookieConsent();
  const [settings, setSettings] = useState<CookieSettings>(consentStatus.settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [legal, setLegal] = useState<FooterPage | null>(null);

  useEffect(() => {
    setSettings(consentStatus.settings);
    setHasChanges(false);
  }, [consentStatus.settings]);

  const toggle = (key: CategoryKey) => {
    if (key === 'essential') return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setHasChanges(JSON.stringify(next) !== JSON.stringify(consentStatus.settings));
  };

  // Clearing on save is what makes a withdrawn consent mean something, so it
  // survives unchanged from the previous version.
  const persist = (next: CookieSettings, kind: 'accepted' | 'declined' | 'customized', message: string) => {
    updateConsent(next, kind);
    (Object.keys(next) as CategoryKey[]).forEach(key => {
      if (!next[key] && consentStatus.settings[key]) CookieManager.clearCookiesByType(key);
    });
    setSettings(next);
    setHasChanges(false);
    toast('success', message);
  };

  const saveChoices = () => persist(settings, 'customized', 'Your cookie choices are saved.');
  const acceptAll = () =>
    persist({ essential: true, analytics: true, marketing: true, preferences: true }, 'accepted', 'All categories allowed.');
  const essentialOnly = () =>
    persist({ essential: true, analytics: false, marketing: false, preferences: false }, 'declined', 'Essential cookies only.');

  const startOver = () => {
    resetConsent();
    (['analytics', 'marketing', 'preferences'] as CategoryKey[]).forEach(k => CookieManager.clearCookiesByType(k));
    setHasChanges(false);
    toast('info', 'Cleared. You will be asked again on your next visit.');
  };

  const statusLabel =
    consentStatus.consentType === 'accepted' ? 'All categories allowed'
    : consentStatus.consentType === 'declined' ? 'Essential only'
    : consentStatus.consentType === 'customized' ? 'Your own selection'
    : 'Not set yet';

  return (
    <div className="mx-auto max-w-6xl">
      {legal && <FooterPageModal page={legal} onClose={() => setLegal(null)} />}

      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[12.5px]">
            <span className="font-medium text-[#4A5566] dark:text-gray-400">Account</span>
            <span className="text-[#4A5566] dark:text-gray-600">/</span>
            <span className="font-semibold text-[#C13F22] dark:text-[#F5825E]">Cookie settings</span>
          </div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            Cookies and data
          </h1>
          <p className="mt-1.5 text-[13.5px] text-[#4A5566] dark:text-gray-400">
            Currently: {statusLabel}
          </p>
        </div>
        <button
          onClick={saveChoices}
          disabled={!hasChanges}
          className="flex h-11 flex-none items-center rounded-[10px] px-5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          style={{ background: '#C13F22' }}
        >
          {hasChanges ? 'Save choices' : 'Saved'}
        </button>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="order-1 w-full min-w-0 flex-1">
          <p className="mb-4 max-w-[64ch] text-[14.5px] leading-[1.6] text-[#3E4A5A] dark:text-gray-400">
            Four categories, and what actually happens if you turn each one off. You can change these
            whenever you like — nothing here is permanent.
          </p>

          <div className="flex flex-col gap-3">
            {CATEGORIES.map(cat => {
              const locked = cat.key === 'essential';
              const on = settings[cat.key];
              return (
                <div key={cat.key} className="kl-card flex items-start gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-semibold text-[#16202F] dark:text-white">{cat.name}</span>
                      {cat.dormant && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide"
                          style={{ background: 'rgba(20,32,47,0.07)', color: '#4A5566' }}
                        >
                          Not in use
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-300">{cat.what}</p>
                    <p className="mt-1.5 text-[12.5px] leading-[1.5] text-[#4A5566] dark:text-gray-500">
                      {cat.offEffect}
                    </p>
                  </div>

                  {/* Essential is stated as locked rather than drawn as a switch
                      that silently refuses — a control that does nothing when
                      pressed is worse than no control. */}
                  {locked ? (
                    <span className="flex flex-none items-center gap-1.5 rounded-[9px] px-3 py-2 text-[12px] font-semibold text-[#4A5566] dark:text-gray-400"
                      style={{ background: 'rgba(20,32,47,0.06)' }}
                    >
                      <Lock className="h-3.5 w-3.5" /> Always on
                    </span>
                  ) : (
                    <button
                      onClick={() => toggle(cat.key)}
                      role="switch"
                      aria-checked={on}
                      aria-label={`${cat.name} cookies`}
                      className="relative h-7 w-12 flex-none rounded-full transition-colors"
                      style={{ background: on ? '#2E6B59' : 'rgba(20,32,47,0.22)' }}
                    >
                      <span
                        className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all"
                        style={{ left: on ? 26 : 4 }}
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={acceptAll}
              className="flex h-11 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
            >
              Allow all
            </button>
            <button
              onClick={essentialOnly}
              className="flex h-11 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
            >
              Essential only
            </button>
            <button
              onClick={startOver}
              className="text-[12.5px] font-semibold text-[#4A5566] transition-colors hover:text-[#C13F22] dark:text-gray-500"
            >
              Clear my choice and ask again
            </button>
          </div>
        </div>

        {/* ── Rail ── */}
        <div className="order-2 w-full flex-none lg:w-[290px]">
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">What we never do</div>
            <div className="flex flex-col gap-2">
              {NEVER.map(n => (
                <div key={n} className="flex items-baseline gap-2 text-[13.5px] text-[#3E4A5A] dark:text-gray-400">
                  <span style={{ color: '#2E6B59' }}>·</span>
                  {n}
                </div>
              ))}
            </div>
          </div>

          {/* The design offers "export or delete". Deletion is real and lives in
              the profile; there is no export route, so it is not offered here. */}
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Your data</div>
            <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
              You can delete your account and everything attached to it from your profile, whenever
              you like. Deletion is immediate and cannot be undone.
            </p>
          </div>

          <div className={railCard}>
            <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Read more</div>
            <div className="flex flex-col gap-2">
              {([['privacy', 'Privacy Policy'], ['terms', 'Terms of Service']] as [FooterPage, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setLegal(id)}
                  className="text-left text-[13.5px] font-medium text-[#C13F22] transition-opacity hover:opacity-70 dark:text-[#F5825E]"
                >
                  {label} →
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieSettingsPage;
