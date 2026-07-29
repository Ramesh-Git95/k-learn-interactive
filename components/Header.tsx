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

// Shorter, English-led nav labels for the calm header — display only, the
// underlying Section ids and titles elsewhere are untouched.
const NAV_LABEL: Partial<Record<Section, string>> = {
  conversation: 'AI Chat',
  srs: 'Spaced Rep.',
  'topik-test': 'Level Test',
  kpop: 'K-Pop',
  typing: 'Typing',
};
const navLabel = (id: Section, fallback: string) => NAV_LABEL[id] ?? fallback;

// Sections a logged-out guest can open without an account. Used to badge the
// nav items with a small "Free" pill so guests see what's explorable.
const GUEST_FREE_SECTIONS: Section[] = ['vocabulary', 'grammar', 'culture'];

const FreePill = () => (
  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#2E6B59] text-white leading-none">
    Free
  </span>
);

const NewPill = () => (
  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#C13F22] text-white leading-none tracking-[0.04em]">
    NEW
  </span>
);

// Primary nav tab — no icon; the label carries it (clarity pass).
interface NavItemProps { title: string; isActive: boolean; onClick: () => void; showFree?: boolean; }
const NavItem: React.FC<NavItemProps> = ({ title, isActive, onClick, showFree }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 h-9 px-3.5 rounded-[10px] text-[13.5px] transition-colors duration-200 ${
      isActive
        ? 'text-white font-semibold shadow-sm'
        : 'text-[#4A5566] dark:text-gray-400 font-medium hover:text-[#16202F] dark:hover:text-gray-100 hover:bg-[#16202F]/[0.04] dark:hover:bg-gray-800'
    }`}
    style={isActive ? { background: 'var(--brand-gradient)' } : {}}
    aria-current={isActive ? 'page' : undefined}
  >
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
    ? { label: '⭐ Premium', cls: 'bg-[#E4572E]/10 dark:bg-[#E4572E]/20 text-[#C13F22] dark:text-[#F07A55]' }
    : { label: 'Free plan', cls: 'bg-[#16202F]/[0.06] dark:bg-gray-800 text-[#4A5566] dark:text-gray-400' };

  const activeInMega = megaMenuGroups.flatMap(g => g.items).some(s => s.id === activeSection);

  return (
    <>
      <style>{`
        .dropdown-enter { animation: dropIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards; }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .mobile-menu-enter { animation: slideDown 0.2s cubic-bezier(0.4,0,0.2,1) forwards; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .theme-btn:hover svg { transform: rotate(20deg); }
        .theme-btn svg { transition: transform 0.3s ease; }
      `}</style>

      <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        isScrolled
          ? 'border-[#16202F]/[0.12] dark:border-gray-800 bg-[#FFFCF4]/95 dark:bg-gray-950/95 backdrop-blur-xl shadow-sm'
          : 'border-[#16202F]/[0.08] dark:border-gray-800/60 bg-[#FFFCF4]/85 dark:bg-gray-950/85 backdrop-blur-md'
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
              <span className="font-display text-[19px] font-bold tracking-[-0.02em] text-[#16202F] dark:text-white">
                K-Learn
              </span>
            </button>

            {/* ── Desktop Nav ───────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {primarySections.map(s => (
                <NavItem key={s.id} title={navLabel(s.id, s.title)} isActive={activeSection === s.id} onClick={() => handleNav(s.id)} showFree={!isAuthenticated && GUEST_FREE_SECTIONS.includes(s.id)} />
              ))}

              {/* Mega menu */}
              <div ref={moreMenuRef} className="relative">
                <button
                  onClick={() => setShowMoreMenu(v => !v)}
                  className={`flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] text-[13.5px] transition-colors duration-200 ${
                    activeInMega
                      ? 'text-white font-semibold shadow-sm'
                      : 'text-[#4A5566] dark:text-gray-400 font-medium hover:text-[#16202F] dark:hover:text-gray-100 hover:bg-[#16202F]/[0.04] dark:hover:bg-gray-800'
                  }`}
                  style={activeInMega ? { background: 'var(--brand-gradient)' } : {}}
                >
                  <span>More</span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showMoreMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showMoreMenu && (
                  <div className="dropdown-enter absolute top-full left-0 mt-2 bg-[#FFFCF4] dark:bg-gray-900 rounded-2xl shadow-2xl border border-[#16202F]/[0.12] dark:border-gray-800 z-50 overflow-hidden"
                    style={{ minWidth: '560px' }}
                  >
                    <div className="grid grid-cols-3 divide-x divide-[#16202F]/[0.1] dark:divide-gray-800">
                      {megaMenuGroups.map(group => (
                        <div key={group.label} className="py-4 px-2.5">
                          <div className="px-3 pb-2.5 text-[11px] font-semibold text-[#4A5566] dark:text-gray-500 tracking-[0.14em]">
                            {group.label}
                          </div>
                          {group.items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleNav(item.id as Section)}
                              className={`w-full px-3 py-2.5 rounded-[10px] text-left flex items-center gap-2 text-sm font-medium transition-colors duration-150 ${
                                activeSection === item.id
                                  ? 'bg-[#E4572E]/10 dark:bg-[#E4572E]/15 text-[#C13F22] dark:text-[#F07A55]'
                                  : 'text-[#16202F] dark:text-gray-300 hover:bg-[#16202F]/[0.04] dark:hover:bg-gray-800'
                              }`}
                            >
                              <span className="flex-1">{navLabel(item.id as Section, item.title)}</span>
                              {!isAuthenticated && GUEST_FREE_SECTIONS.includes(item.id as Section) && <FreePill />}
                              {item._isNew && <NewPill />}
                              {activeSection === item.id && !item._isNew && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C13F22]" />
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
                className="hidden sm:flex items-center gap-2 h-[38px] px-3 bg-[#16202F]/[0.05] dark:bg-gray-800 hover:bg-[#16202F]/[0.08] dark:hover:bg-gray-700 rounded-[10px] text-sm text-[#4A5566] dark:text-gray-400 transition-colors duration-200"
                aria-label="Search (Ctrl+K)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden lg:block">Search</span>
                <kbd className="hidden lg:block px-1.5 py-0.5 text-[11px] bg-[#FFFCF4] dark:bg-gray-900 rounded-[5px] border border-[#16202F]/[0.14] dark:border-gray-700 font-mono">⌘K</kbd>
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="theme-btn p-2 rounded-[10px] text-[#4A5566] dark:text-gray-400 hover:bg-[#16202F]/[0.04] dark:hover:bg-gray-800 transition-colors duration-200"
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
                    className="px-4 h-[38px] text-sm font-semibold text-[#4A5566] dark:text-gray-400 hover:text-[#16202F] dark:hover:text-white transition-colors duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={openRegister}
                    className="px-4 h-[38px] text-sm font-bold text-white rounded-[10px] shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-px"
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
                    className="flex items-center gap-2 p-1 rounded-[10px] hover:bg-[#16202F]/[0.04] dark:hover:bg-gray-800 transition-colors duration-200"
                    aria-label="User menu"
                    aria-expanded={showUserMenu}
                  >
                    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white font-bold text-sm shadow" style={{ background: 'var(--brand-gradient)' }}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <svg className={`hidden sm:block w-3.5 h-3.5 text-[#4A5566] dark:text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="dropdown-enter absolute top-full right-0 mt-2 w-60 bg-[#FFFCF4] dark:bg-gray-900 rounded-2xl shadow-xl border border-[#16202F]/[0.12] dark:border-gray-800 overflow-hidden z-50">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-[#16202F]/[0.1] dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow" style={{ background: 'var(--brand-gradient)' }}>
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#16202F] dark:text-white truncate">{user?.name}</p>
                            <p className="text-xs text-[#4A5566] dark:text-gray-400 truncate">{user?.email}</p>
                          </div>
                        </div>
                        <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${tierBadge.cls}`}>
                          {tierBadge.label}
                        </span>
                      </div>

                      {/* Upgrade banner for free users */}
                      {subscriptionTier === 'free' && (
                        <button
                          className="flex items-center gap-3 px-4 py-3 border-b border-[#16202F]/[0.1] dark:border-gray-800 transition-opacity duration-200 hover:opacity-90 w-full text-left"
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

                      {/* Menu items — consistent stroked line icons */}
                      <div className="py-1">
                        <button
                          onClick={() => { setShowUserMenu(false); setActiveSection('profile'); }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-[#16202F] dark:text-gray-300 hover:bg-[#16202F]/[0.04] dark:hover:bg-gray-800 transition-colors duration-150"
                        >
                          <svg className="w-[18px] h-[18px] flex-shrink-0 text-[#4A5566] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => { setShowUserMenu(false); setActiveSection('dashboard'); }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-[#16202F] dark:text-gray-300 hover:bg-[#16202F]/[0.04] dark:hover:bg-gray-800 transition-colors duration-150"
                        >
                          <svg className="w-[18px] h-[18px] flex-shrink-0 text-[#4A5566] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>Dashboard</span>
                        </button>
                        <button
                          onClick={handleSync}
                          disabled={isSyncing}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-[#16202F] dark:text-gray-300 hover:bg-[#16202F]/[0.04] dark:hover:bg-gray-800 transition-colors duration-150 disabled:opacity-40"
                        >
                          <svg className={`w-[18px] h-[18px] flex-shrink-0 text-[#4A5566] dark:text-gray-400 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>{isSyncing ? 'Syncing…' : 'Sync Progress'}</span>
                        </button>
                      </div>

                      {/* Sign out + Delete account */}
                      <div className="border-t border-[#16202F]/[0.1] dark:border-gray-800 py-1">
                        <button
                          onClick={async () => { setShowUserMenu(false); await logout(); showToast('Signed out successfully', 'info'); }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-[#C13F22] hover:bg-[#C13F22]/[0.06] dark:hover:bg-red-900/20 transition-colors duration-150"
                        >
                          <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Sign Out</span>
                        </button>
                        <button
                          onClick={() => { setShowUserMenu(false); setShowDeleteModal(true); }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-[#4A5566] dark:text-gray-500 hover:bg-[#C13F22]/[0.06] dark:hover:bg-red-900/20 hover:text-[#C13F22] transition-colors duration-150"
                        >
                          <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
                className="md:hidden p-2 rounded-[10px] text-[#4A5566] dark:text-gray-400 hover:bg-[#16202F]/[0.04] dark:hover:bg-gray-800 transition-colors duration-200"
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
          <div className="mobile-menu-enter md:hidden border-t border-[#16202F]/[0.1] dark:border-gray-800 bg-[#FFFCF4]/98 dark:bg-gray-950/98 backdrop-blur-xl overflow-y-auto"
            style={{ maxHeight: 'calc(100dvh - 66px)' }}>
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {/* Primary sections */}
              {primarySections.map(({ id, title }) => (
                <button
                  key={id}
                  onClick={() => handleNav(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    activeSection === id
                      ? 'text-white font-semibold shadow-md'
                      : 'text-[#16202F] dark:text-gray-300 font-medium hover:bg-[#16202F]/[0.04] dark:hover:bg-gray-800'
                  }`}
                  style={activeSection === id ? { background: 'var(--brand-gradient)' } : {}}
                >
                  <span>{navLabel(id, title)}</span>
                  {!isAuthenticated && GUEST_FREE_SECTIONS.includes(id) && activeSection !== id && (
                    <span className="ml-auto"><FreePill /></span>
                  )}
                  {activeSection === id && <span className="ml-auto w-2 h-2 rounded-full bg-white/70" />}
                </button>
              ))}

              {/* Grouped sections */}
              {megaMenuGroups.map(group => (
                <div key={group.label}>
                  <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-[#4A5566] dark:text-gray-500 tracking-[0.14em]">
                    {group.label}
                  </div>
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id as Section)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                        activeSection === item.id
                          ? 'text-white font-semibold shadow-md'
                          : 'text-[#16202F] dark:text-gray-300 font-medium hover:bg-[#16202F]/[0.04] dark:hover:bg-gray-800'
                      }`}
                      style={activeSection === item.id ? { background: 'var(--brand-gradient)' } : {}}
                    >
                      <span className="flex-1 text-left">{navLabel(item.id as Section, item.title)}</span>
                      {!isAuthenticated && GUEST_FREE_SECTIONS.includes(item.id as Section) && activeSection !== item.id && (
                        <FreePill />
                      )}
                      {item._isNew && activeSection !== item.id && <NewPill />}
                      {activeSection === item.id && <span className="w-2 h-2 rounded-full bg-white/70" />}
                    </button>
                  ))}
                </div>
              ))}

              {/* Mobile auth */}
              {!isAuthenticated && (
                <div className="flex gap-3 pt-3 border-t border-[#16202F]/[0.1] dark:border-gray-800">
                  <button
                    onClick={() => { openLogin(); setIsMenuOpen(false); }}
                    className="flex-1 py-3 text-sm font-semibold text-[#4A5566] dark:text-gray-400 border border-[#16202F]/[0.18] dark:border-gray-700 rounded-xl hover:border-[#E4572E] hover:text-[#E4572E] transition-colors duration-200"
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
