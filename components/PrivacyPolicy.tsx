import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div
          className="rounded-3xl p-8 mb-8 text-center"
          style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 60%, #EC4899 100%)' }}
        >
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
          <p className="text-white/70 mt-2 text-sm">Last updated: May 2025</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 space-y-8 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">1. Introduction</h2>
            <p>K-Learn Interactive ("we", "us", "our") respects your privacy. This policy explains what data we collect, how we use it, and your rights regarding your personal information when you use <strong>korean-learn.com</strong>.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">2. Data We Collect</h2>
            <div className="space-y-4">
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">Account Information</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Name and email address (provided at registration)</li>
                  <li>Encrypted password (never stored in plain text)</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">Learning Data</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Lessons completed, quiz scores, XP points, streaks</li>
                  <li>Spaced repetition flashcard progress</li>
                  <li>Bookmarked vocabulary and phrases</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">Payment Information</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>We do not store payment card details</li>
                  <li>Subscriptions are processed securely by Stripe — their privacy policy applies</li>
                  <li>We receive your subscription status and billing period from Stripe</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">Usage Data</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Pages visited and features used within the app</li>
                  <li>Browser type and device information</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">3. How We Use Your Data</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>To provide and personalise your learning experience</li>
              <li>To send account-related emails (verification, password reset)</li>
              <li>To process and confirm premium upgrades</li>
              <li>To track your learning progress across devices</li>
              <li>To improve the Service based on usage patterns</li>
            </ul>
            <p className="mt-3">We do <strong>not</strong> sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services to operate K-Learn:</p>
            <div className="space-y-2">
              {[
                { name: 'MongoDB Atlas', purpose: 'Database — stores your account and learning data' },
                { name: 'Railway', purpose: 'Backend hosting — runs the application server' },
                { name: 'Stripe', purpose: 'Payment processing for Premium subscriptions' },
                { name: 'Resend', purpose: 'Transactional emails (verification, password reset)' },
                { name: 'Google Gemini AI', purpose: 'AI conversation practice and example generation' },
              ].map(({ name, purpose }) => (
                <div key={name} className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <span className="font-black text-gray-900 dark:text-white w-32 flex-shrink-0">{name}</span>
                  <span>{purpose}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">5. Data Storage and Security</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Your data is stored in MongoDB Atlas (cloud database) with encryption at rest.</li>
              <li>Passwords are hashed using bcrypt — we cannot see your password.</li>
              <li>All data is transmitted over HTTPS.</li>
              <li>Authentication uses JWT tokens with expiration.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">6. Cookies and Local Storage</h2>
            <p>We use browser localStorage to store:</p>
            <ul className="space-y-2 list-disc list-inside mt-2">
              <li>Your authentication token (so you stay logged in)</li>
              <li>Theme preference (dark/light mode)</li>
              <li>Onboarding status</li>
            </ul>
            <p className="mt-2">No third-party advertising cookies are used.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">7. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. You may request deletion of your account and all associated data by contacting us. Pending purchase records are automatically deleted after 30 days.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">8. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Export your learning data</li>
            </ul>
            <p className="mt-2">To exercise these rights, email us at <strong>support@korean-learn.com</strong>.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">9. Children's Privacy</h2>
            <p>K-Learn Interactive is not directed at children under 13. We do not knowingly collect data from children under 13. If you believe a child has provided us with personal information, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">11. Contact Us</h2>
            <p>For privacy-related questions or data requests, contact: <strong>support@korean-learn.com</strong></p>
          </section>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.history.back()}
            className="text-sm text-violet-600 dark:text-violet-400 hover:underline font-bold"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
