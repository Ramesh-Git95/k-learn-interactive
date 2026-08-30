// The four cookie categories, described once.
//
// These lines used to be hardcoded twice — in the consent banner's customize
// modal and again in the settings page. When the settings page was corrected
// (6eed74e) the banner was not, so the two surfaces disagreed about what this
// app does: the page said Analytics was dormant while the banner still told
// visitors it was "collecting and reporting information" for "user behaviour
// analysis, A/B testing". The banner is the surface everyone actually sees.
//
// One array, both surfaces. They cannot drift again.
//
// On `dormant`: services/thirdPartyIntegrations.ts carries real Google
// Analytics, Facebook Pixel and Hotjar loaders, but each guards on its own
// placeholder ID ('GA_MEASUREMENT_ID', 'YOUR_PIXEL_ID', 'YOUR_HOTJAR_ID') and
// returns early, so no script is ever injected and no analytics or marketing
// cookie is ever set. The toggles stay because the machinery works the moment
// an ID is configured — the switch is yours in advance rather than a fiction
// now. If you configure one, clear its `dormant` flag in the same change.

export interface CookieCategory {
  key: 'essential' | 'analytics' | 'marketing' | 'preferences';
  name: string;
  /** What this category actually covers today. */
  what: string;
  /** What actually changes if it is switched off. */
  offEffect: string;
  /** Nothing is wired to this category today. */
  dormant?: boolean;
  /** Icon name for the banner's modal. Narrowed to the names Icon accepts. */
  icon: 'check' | 'settings' | 'chart' | 'star';
}

export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    key: 'essential',
    name: 'Essential',
    what: 'Signing in, your plan, and which review cards are due.',
    offEffect: 'Cannot be switched off — without it the app has no way to know who you are.',
    icon: 'check',
  },
  {
    key: 'preferences',
    name: 'Preferences',
    what: 'Dark mode, and the settings you have chosen inside a section.',
    offEffect: 'Turned off: these go back to their defaults every time you arrive.',
    icon: 'settings',
  },
  {
    key: 'analytics',
    name: 'Analytics',
    what: 'Nothing at present. The integration exists but has never been configured, so no analytics script loads and no analytics cookie is set.',
    offEffect: 'Nothing changes either way today. The switch is here so it is yours the day that changes.',
    dormant: true,
    icon: 'chart',
  },
  {
    key: 'marketing',
    name: 'Marketing',
    what: 'Nothing. We run no advertising and share nothing with ad networks.',
    offEffect: 'There is nothing to switch off — this row exists so you can see that it is empty.',
    dormant: true,
    icon: 'star',
  },
];
