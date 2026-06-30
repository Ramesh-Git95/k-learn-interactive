import React, { useEffect } from 'react';

export type FooterPage = 'help' | 'study-guide' | 'community' | 'about' | 'privacy' | 'terms';

interface Props {
  page: FooterPage;
  onClose: () => void;
}

const PAGES: Record<FooterPage, { title: string; emoji: string; content: React.ReactNode }> = {

  // ─── HELP CENTER ────────────────────────────────────────────────────────────
  help: {
    title: 'Help Center',
    emoji: '🙋',
    content: (
      <div className="space-y-8">
        {[
          {
            q: 'How do I get started?',
            a: 'Create a free account and begin with the Hangul section to learn the Korean alphabet. Once comfortable, move to Vocabulary and Grammar. The Dashboard shows your progress across all sections.',
          },
          {
            q: 'What is the Spaced Repetition System (SRS)?',
            a: 'SRS is a scientifically proven learning method that shows you flashcards at increasing intervals based on how well you know them. Cards you struggle with appear more often; cards you know well appear less often — maximising retention.',
          },
          {
            q: 'How does the AI Chat work?',
            a: 'The AI Chat lets you have real Korean conversations with an AI tutor. It responds naturally in Korean and gently corrects mistakes. Free accounts get 5 conversations per day; Premium gets 50.',
          },
          {
            q: 'How do I upgrade to Premium?',
            a: 'Click any "Get Premium" or "⭐ Upgrade" button in the app. You\'ll be taken to a secure Stripe checkout to subscribe for $4/month. You can cancel anytime from your profile.',
          },
          {
            q: 'My progress isn\'t syncing — what should I do?',
            a: 'Make sure you\'re logged in and click "Sync Now" in the Dashboard. Progress syncs to the cloud when you\'re authenticated. If issues persist, sign out and sign back in.',
          },
          {
            q: 'I forgot my password. How do I reset it?',
            a: 'On the sign-in form, click "Forgot password?" below the Password field. Enter your email and we\'ll send a reset link valid for 1 hour.',
          },
          {
            q: 'How do I cancel my subscription?',
            a: 'Open your Profile and click "Cancel subscription" — you\'ll keep Premium access until the end of your current billing month, then your account returns to the free plan. No long-term commitment, and you can resubscribe anytime.',
          },
          {
            q: 'Which browsers are supported?',
            a: 'K-Learn works on all modern browsers: Chrome, Firefox, Safari, and Edge. For the best experience, keep your browser up to date. The app also works on mobile browsers.',
          },
        ].map(({ q, a }) => (
          <div key={q} className="border-b border-gray-100 dark:border-gray-800 pb-6">
            <h3 className="font-black text-gray-900 dark:text-white mb-2">{q}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
          </div>
        ))}
        <div className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.06), rgba(139,92,246,0.06))' }}>
          <p className="text-sm text-gray-600 dark:text-gray-400">Still need help?</p>
          <a href="mailto:support@k-learn.app" className="font-black text-pink-500 hover:underline text-sm">support@k-learn.app</a>
        </div>
      </div>
    ),
  },

  // ─── STUDY GUIDE ────────────────────────────────────────────────────────────
  'study-guide': {
    title: 'Study Guide',
    emoji: '📖',
    content: (
      <div className="space-y-8">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Korean is one of the most logical languages to learn — once you master Hangul, everything else follows a clear system. Here's how to make the most of K-Learn.
        </p>

        {[
          {
            step: '1',
            title: 'Master Hangul First (Week 1)',
            color: '#EC4899',
            tips: [
              'Hangul has 14 consonants and 10 vowels — you can learn to read in 2–3 days',
              'Use the interactive Hangul section daily for 15 minutes',
              'Focus on pronunciation — Korean is phonetic, so reading = speaking correctly',
              'Add letters you struggle with to SRS for daily review',
            ],
          },
          {
            step: '2',
            title: 'Build Core Vocabulary (Weeks 2–4)',
            color: '#8B5CF6',
            tips: [
              'Start with the Greetings and Numbers categories',
              'Aim for 5–10 new words per day — consistency beats cramming',
              'Always learn words with example sentences, not in isolation',
              'Bookmark words you want to review and use the Bookmark Flashcards',
            ],
          },
          {
            step: '3',
            title: 'Learn Grammar Patterns (Month 2)',
            color: '#06B6D4',
            tips: [
              'Korean grammar is SOV (Subject-Object-Verb) — opposite of English',
              'Learn one pattern per day and immediately use it in AI Chat',
              'Honorifics (존댓말) are essential — use the Honorific Engine section',
              'Don\'t aim for perfection — aim for communication',
            ],
          },
          {
            step: '4',
            title: 'Practice Speaking (Ongoing)',
            color: '#10B981',
            tips: [
              'Use AI Chat every day — even just 2–3 exchanges counts',
              'Study the Common Phrases section before real conversations',
              'Try Scripted Conversations to practise real-life scenarios',
              'TOPIK Prep section helps structure your overall level assessment',
            ],
          },
        ].map(({ step, title, color, tips }) => (
          <div key={step} className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ background: color }}>
                {step}
              </div>
              <h3 className="font-black text-gray-900 dark:text-white">{title}</h3>
            </div>
            <ul className="space-y-2">
              {tips.map(t => (
                <li key={t} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-5">
          <h3 className="font-black text-yellow-800 dark:text-yellow-300 mb-2">💡 Pro Tip</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Study for 20 minutes daily rather than 2 hours once a week. Your streak counter in the Dashboard tracks this — try to keep it going!
          </p>
        </div>
      </div>
    ),
  },

  // ─── COMMUNITY ──────────────────────────────────────────────────────────────
  community: {
    title: 'Community',
    emoji: '🌍',
    content: (
      <div className="space-y-6">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Learning with others accelerates progress. Join the K-Learn community to ask questions, share progress, and practise with fellow learners.
        </p>

        {[
          {
            icon: '💬',
            name: 'Discord Server',
            desc: 'Chat in real time with other Korean learners. Dedicated channels for each level — beginner to advanced. Native speakers drop in regularly.',
            action: 'Join Discord',
            href: 'https://discord.gg/klearn',
            color: '#5865F2',
          },
          {
            icon: '🐦',
            name: 'Twitter / X',
            desc: 'Follow us for daily Korean vocabulary, grammar tips, and cultural facts. Share your progress with #KLearnKorean.',
            action: 'Follow @KLearnApp',
            href: 'https://twitter.com/klearn',
            color: '#000000',
          },
          {
            icon: '🐙',
            name: 'GitHub',
            desc: 'K-Learn is open to community contributions. Found a bug? Have a feature idea? Open an issue or submit a pull request.',
            action: 'View on GitHub',
            href: 'https://github.com/klearn',
            color: '#333333',
          },
        ].map(({ icon, name, desc, action, href, color }) => (
          <div key={name} className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex gap-4 items-start">
            <div className="text-3xl flex-shrink-0">{icon}</div>
            <div className="flex-1">
              <h3 className="font-black text-gray-900 dark:text-white mb-1">{name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{desc}</p>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-1.5 rounded-xl text-white text-xs font-black hover:opacity-90 transition-opacity"
                style={{ background: color }}
              >
                {action} →
              </a>
            </div>
          </div>
        ))}

        <div className="rounded-2xl p-5 text-center border border-pink-100 dark:border-pink-800/30" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.04), rgba(139,92,246,0.04))' }}>
          <p className="text-sm font-black text-gray-900 dark:text-white mb-1">Community Guidelines</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Be kind and respectful. Mistakes are how we learn. All levels welcome.</p>
        </div>
      </div>
    ),
  },

  // ─── ABOUT US ───────────────────────────────────────────────────────────────
  about: {
    title: 'About K-Learn',
    emoji: '🇰🇷',
    content: (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}>K</div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Making Korean Accessible</h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg mx-auto">
            K-Learn was built out of a genuine love for the Korean language and frustration with expensive, subscription-heavy language apps. We believe effective language learning tools should be affordable and accessible.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { n: '94+', label: 'Vocabulary words' },
            { n: '7',   label: 'Grammar patterns' },
            { n: '24',  label: 'Culture cards' },
          ].map(({ n, label }) => (
            <div key={label} className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
              <div className="text-2xl font-black text-pink-500 mb-1">{n}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {[
            { icon: '🧠', title: 'Science-backed learning', desc: 'Our Spaced Repetition System uses the SM-2 algorithm — the same method used by millions of successful language learners worldwide.' },
            { icon: '🤖', title: 'AI-powered practice', desc: 'Powered by Google Gemini AI, our conversation practice gives you a patient, always-available tutor that responds naturally in Korean.' },
            { icon: '🎨', title: 'Culture, not just language', desc: 'Language and culture are inseparable. K-Learn includes deep cultural content — from K-pop to Korean etiquette — to give context to everything you learn.' },
            { icon: '💳', title: 'One payment, lifetime access', desc: 'We hate subscription fatigue. Pay once, use forever. No monthly fees, no paywalls after the fact.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="text-2xl flex-shrink-0">{icon}</div>
              <div>
                <h4 className="font-black text-gray-900 dark:text-white text-sm mb-1">{title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-5 text-center border border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Questions or feedback?</p>
          <a href="mailto:hello@k-learn.app" className="font-black text-pink-500 hover:underline text-sm">hello@k-learn.app</a>
        </div>
      </div>
    ),
  },

  // ─── PRIVACY POLICY ─────────────────────────────────────────────────────────
  privacy: {
    title: 'Privacy Policy',
    emoji: '🔒',
    content: (
      <div className="space-y-6 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        <p className="text-xs text-gray-400">Last updated: May 2025</p>

        {[
          {
            title: '1. Who We Are',
            body: 'K-Learn Interactive ("K-Learn", "we", "us", "our") operates the K-Learn Korean language learning platform. Our contact email is privacy@k-learn.app.',
          },
          {
            title: '2. Data We Collect',
            body: (
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Account data:</strong> Name, email address, hashed password</li>
                <li><strong>Learning data:</strong> Progress, quiz scores, SRS card reviews, bookmarks, study streaks</li>
                <li><strong>Technical data:</strong> Browser type, IP address (for security only), device type</li>
                <li><strong>Cookie data:</strong> Only categories you consent to (see Section 6)</li>
              </ul>
            ),
          },
          {
            title: '3. How We Use Your Data',
            body: (
              <ul className="space-y-1 list-disc list-inside">
                <li>Provide and improve the K-Learn service</li>
                <li>Sync your learning progress across devices</li>
                <li>Send transactional emails (account verification, password reset)</li>
                <li>Detect and prevent security threats</li>
              </ul>
            ),
          },
          {
            title: '4. Legal Basis (GDPR)',
            body: 'We process your data on the following bases: (a) Contract performance — to provide the service you signed up for; (b) Legitimate interests — for security and fraud prevention; (c) Consent — for analytics and marketing cookies, which you can withdraw at any time.',
          },
          {
            title: '5. Data Sharing',
            body: 'We do not sell your personal data. We share data only with essential service providers: MongoDB Atlas (database hosting, EU region), Google (Gemini AI — messages only, not account data), and Stripe (payment processing — handles your card details and subscription; we never see or store your card number).',
          },
          {
            title: '6. Cookies',
            body: 'We use essential cookies for authentication and security. Analytics, marketing, and preference cookies are only set with your explicit consent. You can change your preferences at any time via the "Manage Cookies" link in the footer.',
          },
          {
            title: '7. Your Rights (GDPR)',
            body: (
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate data</li>
                <li><strong>Erasure:</strong> Delete your account and all associated data</li>
                <li><strong>Portability:</strong> Export your learning data in JSON format</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Withdraw consent:</strong> Change cookie preferences any time</li>
              </ul>
            ),
          },
          {
            title: '8. Data Retention',
            body: 'We retain your account data for as long as your account is active. If you delete your account, all personal data is permanently deleted within 30 days. Anonymised, aggregated learning statistics may be retained for service improvement.',
          },
          {
            title: '9. Contact & Complaints',
            body: 'For any privacy requests, contact us at privacy@k-learn.app. If you are in the EU and believe we have not handled your data lawfully, you have the right to lodge a complaint with your local Data Protection Authority.',
          },
        ].map(({ title, body }) => (
          <div key={title}>
            <h3 className="font-black text-gray-900 dark:text-white mb-2">{title}</h3>
            {typeof body === 'string' ? <p>{body}</p> : body}
          </div>
        ))}
      </div>
    ),
  },

  // ─── TERMS OF SERVICE ───────────────────────────────────────────────────────
  terms: {
    title: 'Terms of Service',
    emoji: '📋',
    content: (
      <div className="space-y-6 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        <p className="text-xs text-gray-400">Last updated: May 2025</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: 'By creating an account or using K-Learn Interactive, you agree to these Terms of Service. If you do not agree, please do not use the service.',
          },
          {
            title: '2. Your Account',
            body: 'You are responsible for maintaining the confidentiality of your password. You must be at least 13 years old to use K-Learn. You agree to provide accurate information when registering.',
          },
          {
            title: '3. Free & Premium Plans',
            body: 'K-Learn offers a free tier with limited features and a Premium tier with full access. Premium is a $4/month subscription processed securely via Stripe. Your account is upgraded as soon as payment is confirmed, and renews monthly until you cancel.',
          },
          {
            title: '4. Cancellation',
            body: 'You can cancel your Premium subscription at any time from your Profile. Your access continues until the end of the current billing month, after which the account returns to the free plan. For billing questions, contact us at support@k-learn.app.',
          },
          {
            title: '5. Acceptable Use',
            body: (
              <div>
                <p className="mb-2">You agree not to:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Attempt to circumvent account or feature restrictions</li>
                  <li>Share your account credentials with others</li>
                  <li>Use automated tools to abuse the AI Chat feature</li>
                  <li>Reverse engineer or copy the platform</li>
                  <li>Use K-Learn for any unlawful purpose</li>
                </ul>
              </div>
            ),
          },
          {
            title: '6. Intellectual Property',
            body: 'All content, design, and code on K-Learn is owned by K-Learn Interactive. Korean language data (vocabulary, grammar, phrases) is curated educational content. You may use it for personal learning only — not for commercial redistribution.',
          },
          {
            title: '7. AI-Generated Content',
            body: 'AI Chat responses are generated by Google Gemini AI. While we aim for accuracy, AI can make mistakes. Do not rely solely on AI Chat for critical language decisions. Always verify with authoritative Korean language sources.',
          },
          {
            title: '8. Service Availability',
            body: 'We aim for 99.9% uptime but do not guarantee uninterrupted service. We may perform maintenance, which we will try to schedule during low-usage hours. We are not liable for any losses due to service downtime.',
          },
          {
            title: '9. Termination',
            body: 'You may delete your account at any time. We reserve the right to suspend accounts that violate these terms. Premium users whose accounts are terminated for violations are not entitled to a refund.',
          },
          {
            title: '10. Changes to Terms',
            body: 'We may update these terms from time to time. Significant changes will be notified by email. Continued use of K-Learn after changes constitutes acceptance of the new terms.',
          },
          {
            title: '11. Contact',
            body: 'For terms-related questions, contact legal@k-learn.app.',
          },
        ].map(({ title, body }) => (
          <div key={title}>
            <h3 className="font-black text-gray-900 dark:text-white mb-2">{title}</h3>
            {typeof body === 'string' ? <p>{body}</p> : body}
          </div>
        ))}
      </div>
    ),
  },
};

const FooterPageModal: React.FC<Props> = ({ page, onClose }) => {
  const { title, emoji, content } = PAGES[page];

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 60%, #06B6D4 100%)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{emoji}</span>
            <h2 className="text-xl font-black text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm transition-colors"
            aria-label="Close"
          >✕</button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {content}
        </div>
      </div>
    </div>
  );
};

export default FooterPageModal;
