# K-Learn Interactive — Product Roadmap

## Competitive position vs Duolingo

| Advantage | K-Learn | Duolingo |
|---|---|---|
| Pricing | One-time lifetime payment | $84–168/year |
| Language focus | Korean-only depth | 40+ languages, shallow Korean |
| AI conversations | Gemini free-form chat | Scripted dialogue trees |
| Flashcards | Custom SRS decks (SM-2) | Locked content path |
| Exam prep | TOPIK built in | None |
| Stress | Self-paced, no guilt | Streak anxiety, hearts system |

**Hero pitch:** *"The only Korean learning app built for K-drama fans. Pay once, learn forever."*

---

## What's live in production

- ✅ Railway backend + Hostinger frontend
- ✅ Email verification (Resend), password reset
- ✅ Gumroad Lifetime Access — auto-upgrade via ping, claim by purchase email (with code verification), license key fallback
- ✅ GitHub Actions auto-deploy to Hostinger (manual trigger)
- ✅ SRS with SM-2 algorithm + custom decks
- ✅ AI conversations (Google Gemini)
- ✅ TOPIK prep section
- ✅ Honorifics engine
- ✅ Vocabulary, Grammar, Phrases, Culture, Quiz sections
- ✅ Terms of Service + Privacy Policy pages
- ✅ Examples and SRS gated behind login on vocab cards

---

## Feature Roadmap

### 🎬 Step 1 — K-Drama Vocabulary Packs (NEXT)
Vocab sets curated from popular K-dramas. Each card shows the show name, episode context, Korean word, English translation, romanization, and an example sentence from the show. Cards plug into the existing SRS system. New "K-Drama" nav section.

**Target dramas:** Squid Game, Crash Landing on You, My Mister, Goblin, Itaewon Class, Extraordinary Attorney Woo

**Why first:** Biggest viral potential. K-drama fans are already motivated to learn Korean. No big platform can replicate this curation quickly.

---

### 🎤 Step 2 — Pronunciation Scoring
Web Speech API (browser-native, free) listens to the user speak Korean and scores how close they are. Works on vocabulary cards and phrase practice.

---

### 🎵 Step 3 — K-Pop Lyrics Mode
Annotated K-pop lyrics (BTS, BLACKPINK, NewJeans, aespa) with word-by-word breakdown. Tap any word to see the definition and add it to SRS.

---

### 🏆 Step 4 — TOPIK Level Assessment
Quiz-based estimation of the user's TOPIK level (1–6) with a downloadable certificate. Makes K-Learn the serious learner's choice.

---

### 📖 Step 5 — Reading Passages
Short Korean texts (news headlines, drama excerpts, simple stories) with tap-to-translate on any word. Bridges the gap between beginner and intermediate.

---

### 👫 Step 6 — Study Partner Streaks
Shared streak with a friend. Language learning with accountability has higher retention than solo learning.

---

## Notes for future AI sessions
- Frontend: React 19 + TypeScript + Vite + TailwindCSS 4, deployed on Hostinger
- Backend: Node.js + Express + MongoDB Atlas, deployed on Railway
- Routing: hash-based internally (`#dashboard`, `#vocabulary` etc.), special paths handled via `window.location.pathname` checks in App.tsx (see `/verify-email`, `/terms`, `/privacy`)
- Payments: Gumroad ping webhook → `PendingUpgrade` model → auto-upgrade or claim flow
- Email: Resend SDK (not nodemailer — Railway blocks SMTP)
- Deploy: `git push` → GitHub Actions → manual "Run workflow" → FTP to Hostinger
