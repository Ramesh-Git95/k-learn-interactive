import React, { useState, useEffect, useRef } from 'react';
import type { Section } from '../types';
import { SECTIONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useToastContext } from '../contexts/ToastContext';
import { useProgress } from '../contexts/ProgressContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import SpotlightSearch from './SpotlightSearch';
import DeleteAccountModal from './DeleteAccountModal';
import { useUpgrade } from '../hooks/useUpgrade';


interface HeaderProps {
  activeSection: Section | null;
  setActiveSection: (section: Section) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const primarySections = SECTIONS.filter(s => ['dashboard', 'hangul', 'vocabulary', 'conversation'].includes(s.id));

const megaMenuGroups = [
  {
    label: 'LEARN',
    items: [
      ...SECTIONS.filter(s => ['grammar', 'phrases', 'topik', 'honorifics'].includes(s.id)),
      { ...SECTIONS.find(s => s.id === 'topik-test')!, _isNew: true },
    ],
  },
  {
    label: 'PRACTICE',
    items: [
      ...SECTIONS.filter(s => ['quiz', 'typing', 'srs', 'bookmarks'].includes(s.id)),
      { ...SECTIONS.find(s => s.id === 'reading')!, _isNew: true },
      { ...SECTIONS.find(s => s.id === 'writing')!, _isNew: true },
    ],
  },
  {
    label: 'CULTURE',
    items: [
      ...SECTIONS.filter(s => ['culture', 'culture-cards'].includes(s.id)),
      { ...SECTIONS.find(s => s.id === 'kdrama')!, _isNew: false },
      { ...SECTIONS.find(s => s.id === 'kpop')!,   _isNew: true  },
    ],
  },
] as { label: string; items: (typeof SECTIONS[number] & { _isNew?: boolean })[] }[];

const isKoreanChar = (s: string) => s.length <= 2 && /[㄰-㆏가-힣]/.test(s);

// Sections a logged-out guest can open without an account. Used to badge the
// nav items with a small "Free" pill so guests see what's explorable.
const GUEST_FREE_SECTIONS: Section[] = ['vocabulary', 'grammar', 'culture'];

const FreePill = () => (
  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500 text-white leading-none">
    Free
  </span>
);

interface NavItemProps { id: Section; title: string; icon: string; isActive: boolean; onClick: () => void; showFree?: boolean; }
const NavItem: React.FC<NavItemProps> = ({ title, icon, isActive, onClick, showFree }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'text-white shadow-md'
        : 'text-gray-600 dark:text-gray-400 hover:text-[#E4572E] dark:hover:text-[#F07A55] hover:bg-[#E4572E]/10 dark:hover:bg-gray-800'
    }`}
    style={isActive ? { background: 'var(--brand-gradient)' } : {}}
    aria-current={isActive ? 'page' : undefined}
  >
    <span
      className="text-base leading-none font-black"
      style={!isActive && isKoreanChar(icon) ? {
        background: 'var(--brand-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      } : {}}
    >
      {icon}
    </span>
    <span>{title}</span>
    {showFree && <FreePill />}
  </button>
);

const Header: React.FC<HeaderProps> = ({ activeSection, setActiveSection, theme, toggleTheme }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const { showToast } = useToastContext();
  const { syncLocalData, isSyncing } = useProgress();
  const { subscriptionTier } = useFeatureAccess();
  const { startUpgrade } = useUpgrade();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isMenuOpen, setIsMenuOpen]           = useState(false);
  const [isScrolled, setIsScrolled]           = useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);
  const [showSpotlight, setShowSpotlight]     = useState(false);
  const [showUserMenu, setShowUserMenu]       = useState(false);
  const [intendedDest, setIntendedDest]       = useState<Section | null>(null);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNav = (section: Section) => {
    if (isAuthenticated) {
      setActiveSection(section);
      setIsMenuOpen(false);
      setShowMoreMenu(false);
    } else {
      const pub: Section[] = ['vocabulary', 'grammar', 'culture'];
      if (pub.includes(section)) {
        setActiveSection(section);
        setIsMenuOpen(false);
        setShowMoreMenu(false);
        showToast(`Exploring ${section}! Sign up to save your progress.`, 'info');
      } else {
        setIntendedDest(section);
        showToast(`Sign up to access ${section.charAt(0).toUpperCase() + section.slice(1)}`, 'info');
        openRegister();
      }
    }
  };

  const handleLogo = () => {
    if (isAuthenticated) {
      setActiveSection('dashboard');
    } else {
      // @ts-ignore – null is valid for the landing page state
      setActiveSection(null);
    }
  };

  const handleSync = async () => {
    setShowUserMenu(false);
    try {
      await syncLocalData();
      showToast('Progress synced!', 'success');
    } catch {
      showToast('Sync failed. Try again.', 'error');
    }
  };

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated && intendedDest) {
      setActiveSection(intendedDest);
      setIntendedDest(null);
      showToast(`Welcome! Navigating to ${intendedDest}`, 'success');
    }
  }, [isAuthenticated, intendedDest]);

  useEffect(() => {
    const onAuthModal = (e: CustomEvent) => {
      e.detail === 'register' ? openRegister() : openLogin();
    };
    window.addEventListener('open-auth-modal', onAuthModal as EventListener);
    return () => {
      window.removeEventListener('open-auth-modal', onAuthModal as EventListener);
    };
  }, [openRegister, openLogin]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSpotlight(true); }
      if (e.key === 'Escape') { setIsMenuOpen(false); setShowMoreMenu(false); setShowUserMenu(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (showMoreMenu && moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setShowMoreMenu(false);
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showMoreMenu, showUserMenu]);

  const tierBadge = subscriptionTier === 'premium'
    ? { label: '⭐ Premium', cls: 'bg-gradient-to-r from-[#FBEAE3] to-[#E9F1EC] dark:from-[#E4572E]/20 dark:to-[#3F8571]/20 text-[#C13F22] dark:text-[#F07A55]' }
    : { label: '🆓 Free', cls: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' };

  return (
    <>
      <style>{`
        .header-gradient-border::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #E4572E 30%, #3F8571 70%, transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .header-gradient-border.scrolled::after { opacity: 1; }
        .nav-more-btn.active { background: var(--brand-gradient); color: white; }
        .user-avatar {
          background: var(--brand-gradient);
        }
        .dropdown-enter {
          animation: dropIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .mobile-menu-enter {
          animation: slideDown 0.2s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .theme-btn:hover svg { transform: rotate(20deg); }
        .theme-btn svg { transition: transform 0.3s ease; }
      `}</style>

      <header className={`header-gradient-border sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'scrolled bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl shadow-sm'
          : 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[66px]">

            {/* ── Logo ──────────────────────────────────────── */}
            <button
              onClick={handleLogo}
              className="flex items-center gap-2.5 group flex-shrink-0"
              aria-label="K-Learn home"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md group-hover:scale-105 transition-transform duration-200" style={{ background: 'var(--brand-gradient)', fontFamily: 'Pretendard Variable, sans-serif' }}>
                한
              </div>
              <span className="text-xl font-black tracking-tight" style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                K-Learn
              </span>
            </button>

            {/* ── Desktop Nav ───────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {primarySections.map(s => (
                <NavItem key={s.id} id={s.id} title={s.title} icon={s.icon} isActive={activeSection === s.id} onClick={() => handleNav(s.id)} showFree={!isAuthenticated && GUEST_FREE_SECTIONS.includes(s.id)} />
              ))}

              {/* Mega menu */}
              <div ref={moreMenuRef} className="relative">
                <button
                  onClick={() => setShowMoreMenu(v => !v)}
                  className={`nav-more-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    megaMenuGroups.flatMap(g => g.items).some(s => s.id === activeSection)
                      ? 'active shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-[#E4572E] dark:hover:text-[#F07A55] hover:bg-[#E4572E]/10 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>More</span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showMoreMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showMoreMenu && (
                  <div className="dropdown-enter absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden"
                    style={{ minWidth: '560px' }}
                  >
                    <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800">
                      {megaMenuGroups.map(group => (
                        <div key={group.label} className="py-3 px-2">
                          <div className="px-3 pb-2 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                            {group.label}
                          </div>
                          {group.items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleNav(item.id as Section)}
                              className={`w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 text-sm font-medium transition-colors duration-150 ${
                                activeSection === item.id
                                  ? 'bg-[#E4572E]/10 dark:bg-[#E4572E]/15 text-[#C13F22] dark:text-[#F07A55]'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                            >
                              <span className="text-base w-5 text-center">{item.icon}</span>
                              <span className="flex-1">{item.title}</span>
                              {!isAuthenticated && GUEST_FREE_SECTIONS.includes(item.id as Section) && (
                                <FreePill />
                              )}
                              {item._isNew && (
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white leading-none" style={{ background: 'var(--brand-gradient)' }}>
                                  NEW
                                </span>
                              )}
                              {activeSection === item.id && !item._isNew && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#E4572E]" />
                              )}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* ── Right Controls ────────────────────────────── */}
            <div className="flex items-center gap-2">

              {/* Search */}
              <button
                onClick={() => setShowSpotlight(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200"
                aria-label="Search (Ctrl+K)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden lg:block">Search</span>
                <kbd className="hidden lg:block px-1.5 py-0.5 text-xs bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 font-mono">⌘K</kbd>
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="theme-btn p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Auth: logged out */}
              {!isAuthenticated && (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={openLogin}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-[#E4572E] dark:hover:text-[#F07A55] transition-colors duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={openRegister}
                    className="px-4 py-2 text-sm font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-px"
                    style={{ background: 'var(--brand-gradient)' }}
                  >
                    Get Started
                  </button>
                </div>
              )}

              {/* Auth: logged in — user menu */}
              {isAuthenticated && (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setShowUserMenu(v => !v)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    aria-label="User menu"
                    aria-expanded={showUserMenu}
                  >
                    <div className="user-avatar w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <svg className={`hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="dropdown-enter absolute top-full right-0 mt-2 w-60 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="user-avatar w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                          </div>
                        </div>
                        <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${tierBadge.cls}`}>
                          {tierBadge.label}
                        </span>
                      </div>

                      {/* Upgrade banner for free users */}
                      {subscriptionTier === 'free' && (
                        <button
                          className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 transition-opacity duration-200 hover:opacity-90 w-full text-left"
                          style={{ background: 'linear-gradient(160deg, #1B2637, #0D141F)' }}
                          onClick={() => { setShowUserMenu(false); startUpgrade(); }}
                        >
                          <span className="text-xl">🚀</span>
                          <div>
                            <div className="text-sm font-bold text-white">Get Premium</div>
                            <div className="text-xs text-gray-400">$4/month · cancel anytime</div>
                          </div>
                          <svg className="w-4 h-4 text-[#F07A55] ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}

                      {/* Menu items */}
                      <div className="py-1">
                        {[
                          { label: 'Profile',      icon: '👤', section: 'profile'      as Section },
                          { label: 'Dashboard',    icon: '📊', section: 'dashboard'    as Section },
                        ].map(item => (
                          <button
                            key={item.label}
                            onClick={() => { setShowUserMenu(false); setActiveSection(item.section); }}
                            className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                          >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        ))}
                        <button
                          onClick={handleSync}
                          disabled={isSyncing}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 disabled:opacity-40"
                        >
                          <span className={isSyncing ? 'animate-spin inline-block' : ''}>🔄</span>
                          <span>{isSyncing ? 'Syncing…' : 'Sync Progress'}</span>
                        </button>
                      </div>

                      {/* Sign out + Delete account */}
                      <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                        <button
                          onClick={async () => { setShowUserMenu(false); await logout(); showToast('Signed out successfully', 'info'); }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                        >
                          <span>🚪</span>
                          <span>Sign Out</span>
                        </button>
                        <button
                          onClick={() => { setShowUserMenu(false); setShowDeleteModal(true); }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors duration-150"
                        >
                          <span>🗑️</span>
                          <span>Delete Account</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsMenuOpen(v => !v)}
                className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ──────────────────────────────────── */}
        {isMenuOpen && (
          <div className="mobile-menu-enter md:hidden border-t border-gray-100 dark:border-gray-800 bg-white/98 dark:bg-gray-950/98 backdrop-blur-xl overflow-y-auto"
            style={{ maxHeight: 'calc(100dvh - 66px)' }}>
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {/* Primary sections */}
              {primarySections.map(({ id, title, icon }) => (
                <button
                  key={id}
                  onClick={() => handleNav(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeSection === id
                      ? 'text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  style={activeSection === id ? { background: 'var(--brand-gradient)' } : {}}
                >
                  <span className="text-lg">{icon}</span>
                  <span>{title}</span>
                  {!isAuthenticated && GUEST_FREE_SECTIONS.includes(id) && activeSection !== id && (
                    <span className="ml-auto"><FreePill /></span>
                  )}
                  {activeSection === id && <span className="ml-auto w-2 h-2 rounded-full bg-white/70" />}
                </button>
              ))}

              {/* Grouped sections */}
              {megaMenuGroups.map(group => (
                <div key={group.label}>
                  <div className="px-4 pt-3 pb-1 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                    {group.label}
                  </div>
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id as Section)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        activeSection === item.id
                          ? 'text-white shadow-md'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      style={activeSection === item.id ? { background: 'var(--brand-gradient)' } : {}}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="flex-1">{item.title}</span>
                      {!isAuthenticated && GUEST_FREE_SECTIONS.includes(item.id as Section) && activeSection !== item.id && (
                        <FreePill />
                      )}
                      {item._isNew && activeSection !== item.id && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white leading-none" style={{ background: 'var(--brand-gradient)' }}>
                          NEW
                        </span>
                      )}
                      {activeSection === item.id && <span className="ml-auto w-2 h-2 rounded-full bg-white/70" />}
                    </button>
                  ))}
                </div>
              ))}

              {/* Mobile auth */}
              {!isAuthenticated && (
                <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => { openLogin(); setIsMenuOpen(false); }}
                    className="flex-1 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#E4572E] hover:text-[#E4572E] transition-colors duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { openRegister(); setIsMenuOpen(false); }}
                    className="flex-1 py-3 text-sm font-bold text-white rounded-xl shadow-md"
                    style={{ background: 'var(--brand-gradient)' }}
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Spotlight Search */}
        <SpotlightSearch
          isOpen={showSpotlight}
          onClose={() => setShowSpotlight(false)}
          onNavigate={(section) => { handleNav(section); setShowSpotlight(false); }}
        />
      </header>

      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
      )}
    </>
  );
};

export default Header;
