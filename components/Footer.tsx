import React, { useState } from 'react';
import FooterPageModal, { type FooterPage } from './FooterPageModal';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  const [activePage, setActivePage] = useState<FooterPage | null>(null);

  // CookieConsent can open footer pages via this event
  React.useEffect(() => {
    const handler = (e: Event) => setActivePage((e as CustomEvent).detail as FooterPage);
    window.addEventListener('open-footer-page', handler);
    return () => window.removeEventListener('open-footer-page', handler);
  }, []);

  const nav = [
    { name: 'Dashboard',  section: 'dashboard' },
    { name: 'Hangul',     section: 'hangul' },
    { name: 'Vocabulary', section: 'vocabulary' },
    { name: 'Grammar',    section: 'grammar' },
    { name: 'Phrases',    section: 'phrases' },
    { name: 'Culture',    section: 'culture' },
    { name: 'Quiz',       section: 'quiz' },
  ];

  const resources: { name: string; page: FooterPage }[] = [
    { name: 'Help Center',  page: 'help' },
    { name: 'Study Guide',  page: 'study-guide' },
    { name: 'Community',    page: 'community' },
  ];

  const company: { name: string; page: FooterPage }[] = [
    { name: 'About Us',         page: 'about' },
    { name: 'Privacy Policy',   page: 'privacy' },
    { name: 'Terms of Service', page: 'terms' },
  ];

  const handleSection = (section: string) => {
    window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: section }));
  };

  const openManageCookies = () => {
    // Re-show the cookie consent banner by clearing the stored choice
    localStorage.removeItem('cookie-consent');
    window.dispatchEvent(new CustomEvent('reopen-cookie-consent'));
  };

  return (
    <>
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">

            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
                  style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
                >K</div>
                <span className="text-lg font-black text-gray-900 dark:text-white">K-Learn</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Interactive Korean learning with spaced repetition, AI conversations, and cultural exploration.
              </p>
              <a
                href="https://www.buymeacoffee.com/klearn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-black rounded-xl transition-colors duration-200"
              >
                ☕ Buy me a coffee
              </a>
            </div>

            {/* Learning */}
            <div>
              <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Learn</p>
              <ul className="space-y-2">
                {nav.map(({ name, section }) => (
                  <li key={name}>
                    <button
                      onClick={() => handleSection(section)}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-200"
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Resources</p>
              <ul className="space-y-2">
                {resources.map(({ name, page }) => (
                  <li key={name}>
                    <button
                      onClick={() => setActivePage(page)}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-200 text-left"
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Company</p>
              <ul className="space-y-2">
                {company.map(({ name, page }) => (
                  <li key={name}>
                    <button
                      onClick={() =>
                        page === 'terms' || page === 'privacy'
                          ? window.open(`/${page}`, '_blank')
                          : setActivePage(page)
                      }
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-200 text-left"
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              © {year} K-Learn Interactive. All rights reserved.
            </p>

            <div className="flex items-center gap-4">
              {[
                { label: 'GitHub',  href: 'https://github.com',  emoji: '🐙' },
                { label: 'Twitter', href: 'https://twitter.com', emoji: '🐦' },
                { label: 'Discord', href: 'https://discord.com', emoji: '💬' },
              ].map(({ label, href, emoji }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-200"
                  aria-label={label}
                >
                  {emoji}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={openManageCookies}
                className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
              >
                🍪 Manage Cookies
              </button>
              <span className="text-gray-200 dark:text-gray-700">|</span>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">v1.0.0</p>
            </div>
          </div>
        </div>
      </footer>

      {activePage && (
        <FooterPageModal page={activePage} onClose={() => setActivePage(null)} />
      )}
    </>
  );
};

export default Footer;
