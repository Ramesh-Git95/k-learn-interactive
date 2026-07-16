# K-Learn Interactive — Project Guide

Korean language learning web app, **live in production** at https://korean-learn.com.
React SPA (hash-routed sections) + Express/MongoDB backend + Stripe subscriptions.

## Deployment model (important)

- **Backend** → Render free tier (`https://k-learn-interactive.onrender.com/api`) — migrated
  off Railway July 2026. **Auto-deploys on push to `main`** (Render's GitHub integration;
  root directory `backend`). Free tier sleeps after ~15 min idle → first request takes
  ~30–50 s to wake. That's normal, not an outage.
- **Frontend** → Hostinger via FTP. **Manual deploy only:** GitHub → Actions →
  "Deploy to Hostinger" → Run workflow. Pushing to `main` does NOT update the live frontend.
- **Workflow rule:** always `git push origin main` immediately after committing — push is part of "done".
- Secrets live in `backend/.env` locally (gitignored) and in Render environment variables for
  production. Never commit keys.

## Stack

- **Frontend:** React 19 + TypeScript, Vite, TailwindCSS **v4** compiled at build time
  via the `@tailwindcss/vite` plugin (config is CSS-first in `src/index.css` — `@import
  "tailwindcss"`, `@custom-variant dark`, `@theme` for fonts/animations; no
  `tailwind.config.js`). React Context state, hash-based section routing in `App.tsx`
  (no react-router pages).
- **Backend:** Express (CommonJS) + Mongoose/MongoDB Atlas, JWT auth (`middleware/auth.js`).
- **Payments:** Stripe subscriptions (live). **$4/month "Premium", cancel anytime.**
- **AI:** Google Gemini (`gemini-2.5-flash`) proxied through the backend (`backend/routes/ai.js`) —
  the API key never reaches the client.
- **Email:** Resend (`backend/services/emailService.js`), verified domain, `EMAIL_FROM` env var.
  Sends verification, password-reset and welcome emails.

## Payments — how Premium works

Single plan: **$4/month subscription** via Stripe Checkout. No lifetime/one-time tier is sold
anymore (Gumroad was fully removed), but **legacy lifetime users still exist in the DB**:
`subscription.type='premium'` with `currentPeriodEnd: null` and a non-`sub_` id — they keep
access forever and must not be broken.

Flow:
1. Every upgrade button in the app calls `startUpgrade()` from `hooks/useUpgrade.ts`
   (shows a full-screen redirect overlay). Guests are sent to the register modal first.
2. Backend `POST /api/stripe/create-checkout-session` creates a subscription-mode Checkout
   session with `client_reference_id = userId`. Rejects already-premium users.
3. Stripe webhook `POST /api/stripe/webhook` (raw body mounted in `server.js` BEFORE
   `express.json()` — do not reorder) handles:
   - `checkout.session.completed` → activate subscription (idempotent)
   - `customer.subscription.updated` → sync period end / scheduled cancel / past_due grace
   - `customer.subscription.deleted` → revert user to free
   A scheduled cancel can appear as `cancel_at_period_end` OR a `cancel_at` timestamp — both handled.
4. `POST /api/stripe/create-portal-session` opens the Stripe Customer Portal.
   Body `{ flow: 'cancel' }` jumps straight into the cancellation flow (auto-redirects back);
   default opens the general portal (update card / invoices / resume).
5. `POST /api/stripe/sync-subscription` pulls live subscription state from Stripe into the DB;
   the profile calls it on open (self-heals missed webhooks). Stripe is the source of truth.
6. After checkout, Stripe redirects to `/?checkout=success|cancel` — `App.tsx` polls
   `refreshUser` and shows the welcome/cancel toast.

User subscription shape (`backend/models/User.js`): `type` free|premium|pro, `status`,
`stripeCustomerId`, `stripeSubscriptionId`, `currentPeriodStart/End`, `cancelAtPeriodEnd`.
`hasPremiumAccess()` = non-free + active + not expired.

## Free-tier gating

- Limits are defined in `hooks/useFeatureAccess.tsx` (`FEATURE_LIMITS`): quizzes/day, AI chats/day
  (5 free / 50 premium), vocab categories, bookmarks cap, etc. The `pro` tier exists in code but
  is not sold.
- Guests (not logged in) can browse `vocabulary`, `grammar`, `culture` only (see `App.tsx`
  publicSections); everything else prompts sign-in. Progress/bookmarks sync to the backend for
  logged-in users, localStorage otherwise.
- Shared free-content constants live in `constants.ts` (e.g. `FREE_PHRASES_COUNT`) — keep
  App.tsx totals and section components consistent.

## Architecture map (real files)

- `App.tsx` — provider tree (Auth → AuthModal → Progress → SRS → UpgradeModal), section
  routing via URL hash, SRS study-session overlay, checkout-return handling.
- `components/` — one component per section (`Enhanced*` naming is historical; the non-Enhanced
  duplicates were deleted). Key ones: `LandingPage`, `Dashboard`, `UserProfile` (subscription
  card + FOMO upgrade module), `AuthenticatedQuizSection` (the live quiz), `ConversationSection`/
  `ConversationBot` (AI chat), `SRSManager`/`SRSStudySession`, `TopikPrepSection`/`TopikAssessment`,
  `KDramaSection`/`KPopSection`/`ReadingSection`, `HonorificEngine`/`CultureCards`/`TypingDojo`.
- `contexts/` — Auth, AuthModal, Progress, Toast, SRS (single `useSRS` instance via `SRSProvider`),
  UpgradeModal.
- `hooks/` — `useUpgrade` (ALL upgrade buttons route through this), `useFeatureAccess`,
  `useSRS`, `useDailyActivity`, `useLocalStorage`, `useSpeechRecognition`.
- `services/` — `apiClient.ts` (HTTP + auth token), `geminiService.ts` (chat/translate calls),
  `spacedRepetition.ts` (SM-2 engine), `progressService.ts`.
- `backend/routes/` — `auth.js` (register/login/verify/reset/delete — deletion cascades SRS decks
  and cancels the Stripe sub), `users.js`, `progress.js`, `srs.js` (sync strips client `_id`s),
  `ai.js`, `stripe.js`.

## Environment variables

Frontend build (set in `.github/workflows/deploy.yml`): `VITE_API_URL`.
Backend (Render + local `backend/.env`): `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`,
`FRONTEND_URL` (= https://korean-learn.com), `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` ($4/mo
recurring price), `STRIPE_WEBHOOK_SECRET`, `GEMINI_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`.

## Gotchas & conventions

- **Stripe webhook needs the raw body** — `express.raw` for `/api/stripe/webhook` is mounted
  before `express.json()` in `server.js`. Breaking this silently kills signature verification.
- **Unstable context functions:** `canAccess`, `refreshUser`, `showToast` etc. are recreated
  every render. Never put them in `useEffect`/`useCallback` dependency arrays — derive stable
  booleans or hold them in refs (this caused real production loop bugs).
- Speech synthesis: always `speechSynthesis.cancel()` before `speak()`.
- SRS decks are identified by their own `id` field, not Mongo `_id`; `/srs/sync` strips
  client-supplied `_id`s.
- All UI copy says **"$4/month · cancel anytime"** (often with a "less than a coffee ☕" anchor).
  No "lifetime", "one-time" or "Gumroad" anywhere.
- Frontend typecheck must stay at **0 errors**: `npx tsc --noEmit -p tsconfig.json`.

## Tailwind v4 notes (migrated off the Play CDN)

- Config is **CSS-first** in `src/index.css`; there is no `tailwind.config.js`/`postcss.config.js`.
  Dark mode = `@custom-variant dark (&:where(.dark, .dark *))` (NOT a JS `darkMode:'class'`).
  Custom fonts/animations live in `@theme`; a base layer restores the v3 default border color.
- **v4 breaking changes to watch when editing classes:** opacity utilities `bg-opacity-*` /
  `ring-opacity-*` were removed — use slash syntax (`bg-black/50`). Default `border` color is now
  `currentColor` (we pin it back to gray-200 in a base layer). `outline-none` changed meaning.
- Avoid `*/` sequences inside CSS comments in `index.css` (e.g. writing `han-*/dm-*`) — it closes
  the comment early and silently corrupts the following `@theme` block.

## Deferred / known limitations

- **Hash routing** means only the homepage is crawlable/indexable (SEO limitation; sitemap
  contains one URL; FAQPage JSON-LD in index.html partially compensates — keep it in sync
  with the FAQ array in `components/LandingPage.tsx`).

## Resolved former limitations (July 2026 — don't re-fix)

- AI chat **has conversation memory**: `ConversationBot` sends the last 8 turns; the backend
  (`routes/ai.js` `sanitizeHistory`) re-validates/caps them before Gemini.
- AI daily limits are **server-enforced** (`routes/ai.js` CHAT_LIMITS + `GET /api/ai/quota`);
  the client counter is display-only. Keep CHAT_LIMITS in sync with `useFeatureAccess.tsx`.
- **Failed-payment banner exists**: app-wide `components/PastDueBanner.tsx` (rendered beside
  EmailVerificationBanner in App.tsx) plus a matching banner in UserProfile — both open the
  Stripe portal when `subscription.status === 'past_due'`.
