# Cookie consent — implementation status

**Status: the consent machinery is built and works. Nothing is wired to it.**

The app currently loads no analytics, advertising or session-recording script, and
sets no analytics or marketing cookie. The consent UI is real and its choices are
honoured — but today every category except Essential governs nothing, because no
tracker has been configured. That is the honest summary, and it is what the privacy
policy and the cookie settings page now say.

This document previously claimed the system was "production-ready" with "actual
third-party service integrations", and listed several files that do not exist. It has
been rewritten against the code.

---

## What is actually true

### Real and working

| Piece | File | Notes |
|---|---|---|
| Consent banner + customize modal | `components/CookieConsent.tsx` | The first-visit ask. Four categories with toggles. |
| Category wording | `data/cookieCategories.ts` | One description of each category, shared by the banner and the settings page so they cannot contradict each other. |
| Consent state hook | `hooks/useCookieConsent.ts` | `consentStatus`, `updateConsent`, `resetConsent`, and the `canTrackAnalytics` / `canUseMarketing` / `canSavePreferences` booleans. |
| Cookie clearing | `hooks/useCookieConsent.ts` → `CookieManager.clearCookiesByType` | Called when a category is switched off. This is what makes a withdrawn consent mean something. |
| Integration loaders | `services/thirdPartyIntegrations.ts` | Google Analytics 4, Facebook Pixel and Hotjar loaders are written and consent-gated. All three are dormant — see below. |
| Settings page | `components/CookieSettingsPage.tsx` | The `cookie-settings` section. Reached from the footer's "Manage Cookies", signed in or not. Change or withdraw consent, or clear it entirely. |

### Dormant by design (placeholder IDs)

All three integrations guard on their own placeholder ID and return early:

```ts
if (GoogleAnalytics.measurementId === 'GA_MEASUREMENT_ID') return;  // never loads
if (FacebookPixel.pixelId === 'YOUR_PIXEL_ID') return;              // never loads
if (Hotjar.siteId === 'YOUR_HOTJAR_ID') return;                     // never loads
```

Consequence: **no script tag is ever injected**, so no analytics or marketing cookie is
ever set, whatever the user chooses. Granting consent today changes nothing observable.
The loaders would work the moment a real ID is filled in — the toggles are a switch held
in advance, not a fiction.

### The app sets no cookies at all

`CookieManager.setCookie` is the only code path that writes `document.cookie`, and it is
**never called** from anywhere in the app. Consent itself is stored in `localStorage`
(`cookie-consent`, `cookie-settings`), not in a cookie. Auth uses a JWT held by
`services/apiClient.ts`.

So the four categories currently describe capability, not activity. "Essential" is the
only one with real subject matter, and even that is localStorage rather than cookies.

---

## Testing

**Files this document used to list do not exist:** `components/CookieDemo.tsx`,
`utils/cookieTestUtils.ts`, `test-cookie-customization.js`. The browser-console helpers
it documented (`clearCookieConsent()`, `setCookiePreferences()`, `getCookieStatus()`,
`testRealWorldUsage()`, `showCookieTestFunctions()`) do not exist either.

To see the first-visit banner again, clear the stored choice by hand:

```js
localStorage.removeItem('cookie-consent');
localStorage.removeItem('cookie-settings');
localStorage.removeItem('cookie-consent-date');
location.reload();
```

To change consent without clearing it, use the footer's **Manage Cookies** link — it
opens the settings page (`#cookie-settings`), which works signed in or signed out. The
page's own "Clear my choice and ask again" does the same as the snippet above.

---

## On GDPR

The old version of this file carried a checklist of ticks claiming full GDPR compliance.
That is not a claim this document should make — compliance is a legal judgement about an
operating service, not a property of a component.

What can be said factually: consent is requested before any non-essential category is
enabled, the categories are individually switchable, Essential is identified as
non-optional, the choice persists, it can be withdrawn, and withdrawal clears the
matching cookies. And the strongest fact of all is the simplest one — **the app sets no
analytics or marketing cookies, so there is currently nothing to consent to.**

---

## Before enabling any tracker

Turning on a real ID is the moment most of this document stops being theoretical. In
order:

1. **Decide it is worth it.** The privacy policy, the cookie settings page and the
   landing page all currently tell users there is no tracking. Enabling one means
   editing all three in the same change.
2. **Replace the placeholder ID** in `services/thirdPartyIntegrations.ts`
   (`GA_MEASUREMENT_ID`, `YOUR_PIXEL_ID`, `YOUR_HOTJAR_ID`). Prefer an env var over a
   committed literal.
3. **Clear the `dormant` flag** on that category in `data/cookieCategories.ts` and
   rewrite its `what` line to describe what now actually happens. Both the banner and
   the settings page read from there, so they update together.
4. **Name the service** on the consent surface. Naming a third party is a statement that
   you share data with it; saying nothing while loading its script is the failure mode
   this rewrite exists to prevent.
5. **Verify** in DevTools → Application → Cookies that declining leaves the cookie jar
   empty, and that withdrawing consent afterwards clears what was set.

---

## Related commits

- `8c9bb6a` — legal pages rebuilt; the privacy policy now says no script loads and no
  analytics or marketing cookie is set.
- `6eed74e` — cookie settings page rebuilt; removed Google Analytics, Facebook Pixel and
  Google Ads from a consent screen the app has never contacted.
