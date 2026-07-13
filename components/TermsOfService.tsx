import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div
          className="rounded-3xl p-8 mb-8 text-center"
          style={{ background: 'var(--brand-gradient-hero)' }}
        >
          <div className="text-4xl mb-3">📋</div>
          <h1 className="text-3xl font-black text-white">Terms of Service</h1>
          <p className="text-white/70 mt-2 text-sm">Last updated: May 2025</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 space-y-8 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or using K-Learn Interactive ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">2. Description of Service</h2>
            <p>K-Learn Interactive is an online Korean language learning platform providing vocabulary lessons, grammar guides, AI-powered conversation practice, spaced repetition flashcards, and cultural content. The Service is available at <strong>korean-learn.com</strong>.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">3. User Accounts</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the security of your password.</li>
              <li>You must be at least 13 years old to use the Service.</li>
              <li>One account per person. Do not share your account credentials.</li>
              <li>We reserve the right to suspend accounts that violate these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">4. Subscriptions and Payments</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>K-Learn offers a free tier and a paid Premium plan ($4/month).</li>
              <li>Premium is a recurring monthly subscription processed securely through Stripe, renewing each month until cancelled.</li>
              <li>You can cancel anytime from your Profile; access continues until the end of the current billing period, after which the account returns to the free plan.</li>
              <li>Prices are listed in USD and may change with notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">5. Acceptable Use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to reverse-engineer, scrape, or copy content from the platform.</li>
              <li>Share your premium access with others.</li>
              <li>Use automated tools or bots to access the Service.</li>
              <li>Upload or transmit harmful, offensive, or malicious content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">6. Intellectual Property</h2>
            <p>All content on K-Learn Interactive — including lessons, flashcards, UI design, and AI-generated examples — is owned by K-Learn Interactive. You may not reproduce or distribute this content without written permission.</p>
            <p className="mt-2">Your personal learning data (progress, SRS cards you create) belongs to you.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">7. AI-Powered Features</h2>
            <p>K-Learn uses Google Gemini AI for conversation practice and example generation. AI responses are provided for educational purposes and may occasionally contain inaccuracies. Do not rely on AI responses as authoritative language instruction.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">8. Disclaimer of Warranties</h2>
            <p>The Service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access or that the Service will be error-free. We are not responsible for any learning outcomes.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, K-Learn Interactive shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">10. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of the Service after changes constitutes acceptance. We will notify users of significant changes via email.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">11. Contact</h2>
            <p>For any questions about these terms, contact us at: <strong>support@korean-learn.com</strong></p>
          </section>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.history.back()}
            className="text-sm text-[#2E6B59] dark:text-[#6BA88F] hover:underline font-bold"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
