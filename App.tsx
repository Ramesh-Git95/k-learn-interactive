import React, { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import type { Section, Bookmark } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { ToastProvider, useToastContext } from './contexts/ToastContext';
import { ProgressProvider } from './contexts/ProgressContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import MiniLearningPath from './components/MiniLearningPath';
import FloatingProgress from './components/FloatingProgress';
import Breadcrumb from './components/Breadcrumb';
import { AppBootSkeleton } from './components/Skeleton';
import ToastContainer from './components/ToastContainer';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import PastDueBanner from './components/PastDueBanner';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import GuestFreeBanner from './components/GuestFreeBanner';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { apiClient } from './services/apiClient';
import useLocalStorage from './hooks/useLocalStorage';
import { SRSProvider, useSRSContext } from './contexts/SRSContext';
import { LS_THEME_KEY, FREE_PHRASES_COUNT } from './constants';
import { UpgradeModalProvider } from './contexts/UpgradeModalContext';
import { useFeatureAccess } from './hooks/useFeatureAccess';
import { vocabulary, grammarPatterns, commonPhrases, cultureTips, hangulCharacters, koreanRegions, dailyLifeTopics, modernKoreaTopics } from './data/koreanData';
import { useProgress } from './contexts/ProgressContext';

// ── Code-split sections (performance) ────────────────────────────────────────
// Each section loads on demand as its own chunk, keeping the initial bundle to
// the shell (header + dashboard + landing). Data files imported only by one
// section (kpopData, kdramaData, TOPIK banks, reading passages) move into that
// section's chunk automatically.
const EnhancedHangulSection    = React.lazy(() => import('./components/EnhancedHangulSection'));
const VocabularySection        = React.lazy(() => import('./components/VocabularySection'));
const EnhancedGrammarSection   = React.lazy(() => import('./components/EnhancedGrammarSection'));
const EnhancedPhrasesSection   = React.lazy(() => import('./components/EnhancedPhrasesSection'));
const EnhancedCultureHub       = React.lazy(() => import('./components/EnhancedCultureHub'));
const AuthenticatedQuizSection = React.lazy(() => import('./components/AuthenticatedQuizSection'));
const UserProfile              = React.lazy(() => import('./components/UserProfile'));
const ConversationSection      = React.lazy(() => import('./components/ConversationSection'));
const BookmarkList             = React.lazy(() => import('./components/BookmarkList'));
const SRSManager               = React.lazy(() => import('./components/SRSManager'));
const SRSStudySession          = React.lazy(() => import('./components/SRSStudySession'));
const TopikPrepSection         = React.lazy(() => import('./components/TopikPrepSection'));
const TopikAssessment          = React.lazy(() => import('./components/TopikAssessment'));
const ReadingSection           = React.lazy(() => import('./components/ReadingSection'));
const WritingSection           = React.lazy(() => import('./components/WritingSection'));
const HonorificEngine          = React.lazy(() => import('./components/HonorificEngine'));
const CultureCards             = React.lazy(() => import('./components/CultureCards'));
const TypingDojo               = React.lazy(() => import('./components/TypingDojo'));
const KDramaSection            = React.lazy(() => import('./components/KDramaSection'));
const KPopSection              = React.lazy(() => import('./components/KPopSection'));
const EmailVerification        = React.lazy(() => import('./components/EmailVerification'));
const TermsOfService           = React.lazy(() => import('./components/TermsOfService'));
const PrivacyPolicy            = React.lazy(() => import('./components/PrivacyPolicy'));
const OnboardingWizard         = React.lazy(() => import('./components/OnboardingWizard'));
const NotFound                 = React.lazy(() => import('./components/NotFound'));

// Lightweight fallback shown while a section chunk downloads.
const SectionLoader = () => (
  <div className="flex items-center justify-center py-24" role="status" aria-label="Loading section">
    <div className="w-10 h-10 rounded-full border-4 border-gray-200 dark:border-gray-700 animate-spin" style={{ borderTopColor: '#E4572E' }} />
  </div>
);

// Load cookie testing utilities in development
// Commented out temporarily - these files are optional for production
// if (import.meta.env.DEV) {
//   import('./utils/cookieTestUtils');
//   import('./utils/tourTestUtils');
// }

// Main App component that needs to be inside AuthProvider
const AppContent: React.FC = () => {
  const { user, isLoading: authLoading, hasPremiumAccess, isAuthenticated, refreshUser } = useAuth();
  const { showToast } = useToastContext();
  const { getLimit } = useFeatureAccess();
  const { actions: srsActions } = useSRSContext();
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>(LS_THEME_KEY, 'light');
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Initialize activeSection as null for landing page, dashboard for authenticated users
  const [activeSection, _setActiveSection] = useState<Section | null>(null);
  const activeSectionRef = React.useRef<Section | null>(null);

  // Section swaps animate via the View Transitions API — a native cross-fade
  // that makes hash routing feel app-like. Progressive enhancement: instant
  // swap on unsupported browsers or when the user prefers reduced motion.
  const setActiveSection = useCallback((section: Section | null) => {
    // Nav clicks also write location.hash, whose hashchange listener echoes
    // this call with the same section — without this guard the echo starts a
    // second transition that aborts the first (AbortError + double-fade).
    if (section === activeSectionRef.current) return;
    activeSectionRef.current = section;

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
    };
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduceMotion) {
      _setActiveSection(section);
      return;
    }
    const vt = doc.startViewTransition(() => {
      flushSync(() => _setActiveSection(section));
    });
    // If a rapid follow-up navigation skips this transition, its promises
    // reject with AbortError — expected behavior, not an error.
    vt.ready.catch(() => {});
    vt.finished.catch(() => {});
  }, []);

  // Initialize dashboard for authenticated users only on first load
  useEffect(() => {
    if (user && activeSection === null) {
      setActiveSection('dashboard');
    }
  }, [user]);

  // Show onboarding wizard for genuinely new users only. The 'done' flag lives
  // in localStorage, so clearing browser storage (or a new device) used to make a
  // returning user look brand-new and re-run onboarding — minting a DUPLICATE
  // "Starter Deck" every time. We now gate on the durable source of truth: the
  // account's decks in the DB. Only an account with zero decks gets the wizard.
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear 'pending' on logout so the wizard can show again next login if it
      // was never actually completed.
      if (localStorage.getItem('k-learn-onboarding') === 'pending') {
        localStorage.removeItem('k-learn-onboarding');
      }
      setShowOnboarding(false);
      return;
    }

    // Already decided (completed or in progress) — never re-run.
    if (localStorage.getItem('k-learn-onboarding')) return;

    let cancelled = false;
    (async () => {
      const res = await apiClient.getSRSDecks();
      if (cancelled) return;
      const hasDecks = res.success && Array.isArray(res.data?.decks) && res.data.decks.length > 0;
      if (hasDecks) {
        // Returning user (decks survive a storage wipe) — record completion so we
        // don't check again, and never re-onboard.
        localStorage.setItem('k-learn-onboarding', 'done');
        setShowOnboarding(false);
      } else if (res.success) {
        // Genuinely empty account → run the starter-deck wizard.
        localStorage.setItem('k-learn-onboarding', 'pending');
        setShowOnboarding(true);
      }
      // On network error, do nothing — better to skip onboarding than risk a dup.
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Auto-open login modal after a successful password reset redirect
  useEffect(() => {
    if (sessionStorage.getItem('open-login-after-reset')) {
      sessionStorage.removeItem('open-login-after-reset');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
      }, 300);
    }
  }, []);

  // After returning from Stripe Checkout (?checkout=success), poll refreshUser
  // until the webhook has upgraded the account (up to 10 × 2s), then celebrate.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (!checkout || !isAuthenticated) return;
    window.history.replaceState({}, '', window.location.pathname + window.location.hash);

    if (checkout === 'cancel') {
      showToast('Checkout cancelled — you can upgrade anytime from your profile.', 'info');
      return;
    }
    if (checkout === 'success') {
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await refreshUser();
        if (hasPremiumAccess() || attempts >= 10) {
          clearInterval(poll);
          if (hasPremiumAccess()) {
            showToast('🎉 Welcome to Premium! Your account has been upgraded.', 'success');
          }
        }
      }, 2000);
      return () => clearInterval(poll);
    }
  }, [isAuthenticated]);

  // Global tab-return refresh — catches an upgrade completed in another tab/device
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !hasPremiumAccess()) {
        refreshUser();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isAuthenticated, hasPremiumAccess, refreshUser]);

  // Separate effect to handle activeSection validation for unauthenticated users
  useEffect(() => {
    if (!user && activeSection) {
      const publicSections: Section[] = ['vocabulary', 'grammar', 'culture'];
      if (!publicSections.includes(activeSection)) {
        setActiveSection(null);
      }
    }
  }, [user, activeSection]);
  
  // Custom setActiveSection that also updates URL hash
  const handleSetActiveSection = (section: Section) => {
    setActiveSection(section);
    window.location.hash = section;
  };

  // Remember the last learning surface (any navigation path) for the
  // dashboard's "Continue where you left off" card.
  useEffect(() => {
    if (activeSection && activeSection !== 'dashboard' && activeSection !== 'profile') {
      try { localStorage.setItem('kl-last-section', activeSection); } catch { /* ignore */ }
    }
  }, [activeSection]);
  const [isLoading, setIsLoading] = useState(true);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  
  // Use ProgressContext instead of localStorage
  const { 
    progress, 
    bookmarks, 
    updateProgress, 
    addBookmark, 
    removeBookmark,
    isLoading: progressLoading,
    isSyncing 
  } = useProgress();
  
  // SRS State
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [isStudying, setIsStudying] = useState(false);

  // Listen for footer navigation events
  useEffect(() => {
    const handleFooterNavigation = (event: CustomEvent) => {
      handleSetActiveSection(event.detail as Section);
    };

    window.addEventListener('navigate-to-section', handleFooterNavigation as EventListener);
    
    return () => {
      window.removeEventListener('navigate-to-section', handleFooterNavigation as EventListener);
    };
  }, []);

  // Handle URL hash for navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && ['dashboard', 'hangul', 'vocabulary', 'grammar', 'phrases', 'culture', 'quiz', 'conversation', 'bookmarks', 'srs', 'profile', 'cookie-demo', 'topik', 'topik-test', 'honorifics', 'culture-cards', 'typing', 'writing', 'kdrama', 'kpop', 'reading'].includes(hash as Section)) {
        setActiveSection(hash as Section);
      }
    };

    // Check initial hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove any existing dark class first
    root.classList.remove('dark');
    
    // Add smooth transition class during theme change
    setIsThemeTransitioning(true);
    root.style.setProperty('--theme-transition-duration', '300ms');
    
    // Apply theme class
    if (theme === 'dark') {
      root.classList.add('dark');
    }
    
    // Update body background for better coverage
    document.body.style.backgroundColor = theme === 'dark' ? '#1a202c' : '#ffffff';
    
    // Remove transition class after animation completes
    const timer = setTimeout(() => {
      setIsThemeTransitioning(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [theme]);

  // Enhanced loading — resolve as soon as auth + progress are ready
  useEffect(() => {
    if (!authLoading && !progressLoading) setIsLoading(false);
  }, [authLoading, progressLoading]);

  // Special routes — placed after all hooks to satisfy Rules of Hooks
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/verify-email')) {
    return <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}><React.Suspense fallback={<AppBootSkeleton />}><EmailVerification /></React.Suspense></div>;
  }
  if (currentPath === '/terms') {
    return <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}><React.Suspense fallback={<AppBootSkeleton />}><TermsOfService /></React.Suspense></div>;
  }
  if (currentPath === '/privacy') {
    return <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}><React.Suspense fallback={<AppBootSkeleton />}><PrivacyPolicy /></React.Suspense></div>;
  }

  const toggleTheme = () => {
    // Add haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Force localStorage update
    localStorage.setItem(LS_THEME_KEY, JSON.stringify(newTheme));
  };

  const toggleBookmark = useCallback(async (itemToToggle: Bookmark) => {
    const isBookmarked = bookmarks.some(b => b.korean === itemToToggle.korean);

    if (isBookmarked) {
      await removeBookmark(itemToToggle.korean);
      return;
    }

    const limit = getLimit('bookmarksLimit') as number;
    if (limit !== Infinity && bookmarks.length >= limit) {
      showToast(`Free plan allows ${limit} bookmarks. Upgrade to save unlimited.`, 'warning');
      return;
    }
    await addBookmark(itemToToggle);
  }, [bookmarks, addBookmark, removeBookmark, isAuthenticated, getLimit, showToast]);

  const toggleProgress = useCallback(async (key: string) => {
    const currentValue = progress[key] || false;
    const newValue = !currentValue;
    
    await updateProgress(key, newValue);

    // Auto-complete section when all items are completed
    if (newValue) {
      let sectionKey = '';
      
      if (key.startsWith('hangul_char_')) {
        sectionKey = 'hangul';
      } else if (key.startsWith('vocab_item_')) {
        sectionKey = 'vocabulary';
      } else if (key.startsWith('grammar_pattern_')) {
        sectionKey = 'grammar';
      } else if (key.startsWith('phrase_')) {
        sectionKey = 'phrases';
      } else if (key.startsWith('culture_tip_') || key.startsWith('region_') || key.startsWith('daily_life_') || key.startsWith('modern_korea_')) {
        sectionKey = 'culture';
      } else if (key.startsWith('quiz_completed_')) {
        sectionKey = 'quiz';
      }
      
      if (sectionKey) {
        const totalItems = getSectionTotalItems(sectionKey as Section);
        const completedItems = getSectionCompletedItems(sectionKey as Section, {...progress, [key]: newValue});
        
        if (completedItems >= totalItems) {
          await updateProgress(`section_${sectionKey}`, true);
        }
      }
    }
  }, [progress, updateProgress, isAuthenticated]);

  // Helper functions for progress tracking
  const getSectionTotalItems = (section: Section): number => {
    const premium = hasPremiumAccess();
    switch (section) {
      case 'hangul': return hangulCharacters.length;
      case 'vocabulary': {
        if (!premium) return vocabulary.slice(0, 3).reduce((t: number, c: any) => t + c.items.length, 0);
        return vocabulary.reduce((t: number, c: any) => t + c.items.length, 0);
      }
      case 'grammar': {
        if (!premium) return Math.ceil(grammarPatterns.length * 0.6);
        return grammarPatterns.length;
      }
      case 'phrases': {
        if (!premium) return Math.min(FREE_PHRASES_COUNT, commonPhrases.length);
        return commonPhrases.length;
      }
      case 'culture': {
        // Free users can only interact with the first 5 culture tips
        if (!premium) return 5;
        let total = cultureTips.length + koreanRegions.length;
        dailyLifeTopics.forEach(topic => { total += topic.sections.length; });
        modernKoreaTopics.forEach(topic => { total += topic.sections.length; });
        return total;
      }
      case 'quiz': return 10;
      default: return 0;
    }
  };

  const getSectionCompletedItems = (section: Section, progressData?: { [key: string]: boolean }): number => {
    const currentProgress = progressData || progress;
    switch (section) {
      case 'hangul': {
        // Count studied Hangul characters
        const studiedChars = Object.keys(currentProgress).filter(key => 
          key.startsWith('hangul_char_') && currentProgress[key] === true
        );
        return studiedChars.length;
      }
      case 'vocabulary': {
        // Count studied vocabulary items
        const studiedItems = Object.keys(currentProgress).filter(key => 
          key.startsWith('vocab_item_') && currentProgress[key] === true
        );
        return studiedItems.length;
      }
      case 'grammar': {
        // Count completed grammar patterns
        const completedPatterns = Object.keys(currentProgress).filter(key => 
          key.startsWith('grammar_pattern_') && currentProgress[key] === true
        );
        return completedPatterns.length;
      }
      case 'phrases': {
        // Count studied phrases
        const studiedPhrases = Object.keys(currentProgress).filter(key => 
          key.startsWith('phrase_') && currentProgress[key] === true
        );
        return studiedPhrases.length;
      }
      case 'culture': {
        // Count all completed culture activities:
        // 1. Read culture tips
        const readTips = Object.keys(currentProgress).filter(key => 
          key.startsWith('culture_tip_') && currentProgress[key] === true
        );
        
        // 2. Explored regions
        const exploredRegions = Object.keys(currentProgress).filter(key => 
          key.startsWith('region_') && currentProgress[key] === true
        );
        
        // 3. Completed daily life sections
        const completedDailyLifeSections = Object.keys(currentProgress).filter(key => 
          key.startsWith('daily_life_') && key.includes('_') && currentProgress[key] === true
        );
        
        // 4. Completed modern Korea sections
        const completedModernKoreaSections = Object.keys(currentProgress).filter(key => 
          key.startsWith('modern_korea_') && key.includes('_') && currentProgress[key] === true
        );
        
        return readTips.length + exploredRegions.length + completedDailyLifeSections.length + completedModernKoreaSections.length;
      }
      case 'quiz': {
        // Count completed quizzes
        const completedQuizzes = Object.keys(currentProgress).filter(key => 
          key.startsWith('quiz_completed_') && currentProgress[key] === true
        );
        return completedQuizzes.length;
      }
      default: return 0;
    }
  };

  // SRS handlers
  const handleStartStudy = (deckId: string) => {
    setStudyDeckId(deckId);
    setIsStudying(true);
  };

  const handleExitStudy = () => {
    console.log('🚪 Exiting study session - clearing all study state');
    // Finish the session in the SRS hook to reset state
    srsActions.finishSession();
    setIsStudying(false);
    setStudyDeckId(null);
    setActiveSection('dashboard'); // Return to dashboard instead of SRS section
  };

  const handleCompleteStudy = () => {
    console.log('🎯 Completing study session - clearing all study state');
    // Finish the session in the SRS hook to reset state
    srsActions.finishSession();
    setIsStudying(false);
    setStudyDeckId(null);
    setActiveSection('dashboard'); // Return to dashboard instead of SRS section
  };

  const renderSection = () => {
    // Handle SRS study session overlay
    if (isStudying && studyDeckId) {
      return (
        <SRSStudySession
          deckId={studyDeckId}
          onComplete={handleCompleteStudy}
          onExit={handleExitStudy}
          onNavigateNext={(section) => {
            // Clear study state, then navigate once (avoids the dashboard
            // detour handleExitStudy would take).
            srsActions.finishSession();
            setIsStudying(false);
            setStudyDeckId(null);
            handleSetActiveSection(section);
          }}
        />
      );
    }

    // If activeSection is null (landing page), don't render any section
    if (!activeSection) {
      return null;
    }

    switch (activeSection) {
      case 'dashboard':
        return <Dashboard 
          setActiveSection={setActiveSection} 
          progress={progress} 
          bookmarks={bookmarks}
          getSectionTotalItems={getSectionTotalItems}
          getSectionCompletedItems={getSectionCompletedItems}
          onStartStudy={handleStartStudy}
        />;
      case 'hangul':
        return <EnhancedHangulSection progress={progress} toggleProgress={toggleProgress} />;
      case 'vocabulary':
        return <VocabularySection bookmarks={bookmarks} toggleBookmark={toggleBookmark} progress={progress} toggleProgress={toggleProgress} />;
      case 'grammar':
        return <EnhancedGrammarSection progress={progress} toggleProgress={toggleProgress} />;
      case 'phrases':
        return <EnhancedPhrasesSection bookmarks={bookmarks} toggleBookmark={toggleBookmark} progress={progress} toggleProgress={toggleProgress} />;
      case 'culture':
        return <EnhancedCultureHub progress={progress} toggleProgress={toggleProgress} />;
      case 'quiz':
        return <AuthenticatedQuizSection />;
      case 'conversation':
        return <ConversationSection />;
      case 'topik':
        return <TopikPrepSection />;
      case 'topik-test':
        return <TopikAssessment />;
      case 'reading':
        return <ReadingSection />;
      case 'writing':
        return <WritingSection />;
      case 'honorifics':
        return <HonorificEngine />;
      case 'culture-cards':
        return <CultureCards />;
      case 'typing':
        return <TypingDojo />;
      case 'kdrama':
        return <KDramaSection />;
      case 'kpop':
        return <KPopSection />;
      case 'bookmarks':
        return <BookmarkList bookmarks={bookmarks} toggleBookmark={toggleBookmark} />;
      case 'srs':
        return <SRSManager onStartStudy={handleStartStudy} />;
      case 'profile':
        return <UserProfile />;
      default:
        return <Dashboard 
          setActiveSection={setActiveSection} 
          progress={progress} 
          bookmarks={bookmarks}
          getSectionTotalItems={getSectionTotalItems}
          getSectionCompletedItems={getSectionCompletedItems}
          onStartStudy={handleStartStudy}
        />;
    }
  };

  // Note: Progress migration is now handled by the backend
  // Old localStorage migration is no longer needed

  // Landing page handler
  const handleGetStarted = () => {
    setActiveSection('dashboard');
  };

  // Handle password reset link — ?token=xxx in URL
  const resetToken = new URLSearchParams(window.location.search).get('token');
  if (resetToken && window.location.pathname === '/reset-password') {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <ResetPasswordForm
          token={resetToken}
          onSuccess={() => {
            // Full reload so React re-initialises cleanly and the login modal can open
            sessionStorage.setItem('open-login-after-reset', '1');
            window.location.replace('/');
          }}
        />
      </div>
    );
  }

  // Unknown path → branded 404. Placed after every known special route
  // (verify-email, terms, privacy, reset-password). Hostinger's SPA fallback
  // serves index.html for all paths, so the app decides what 404 looks like.
  if (currentPath !== '/' && currentPath !== '/index.html') {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <React.Suspense fallback={<AppBootSkeleton />}>
          <NotFound />
        </React.Suspense>
      </div>
    );
  }

  // Show landing page for non-authenticated users (unless they're viewing public sections)
  if (!user && !authLoading && !isLoading) {
    const publicSections: Section[] = ['vocabulary', 'grammar', 'culture'];
    
    // If activeSection is null or not a public section, show landing page
    if (activeSection === null || !publicSections.includes(activeSection)) {
      return (
        <div className={`${theme === 'dark' ? 'dark' : ''}`}>
          <Header
            activeSection={activeSection}
            setActiveSection={handleSetActiveSection}
            theme={theme}
            toggleTheme={toggleTheme}
          />
          <GuestFreeBanner onNavigate={handleSetActiveSection} />
          <LandingPage onGetStarted={handleGetStarted} />
          <Footer />
          <CookieConsent />
        </div>
      );
    }
  }

  if (isLoading || progressLoading || authLoading) {
    return <AppBootSkeleton />;
  }

  // Check if user is authenticated
  const isUserAuthenticated = !!user;

  return (
    <div
      className={`min-h-screen font-sans bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-all duration-300 ease-in-out ${
        isThemeTransitioning ? 'theme-transitioning' : ''
      }`}
      aria-label="Korean Learning Application"
    >
    {/* Skip to main content link for screen readers */}
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#E4572E] text-white px-4 py-2 rounded-lg z-50 transition-all duration-200"
    >
      Skip to main content
    </a>      <Header 
        activeSection={activeSection}
        setActiveSection={handleSetActiveSection}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    
    <main
      id="main-content"
      className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
      role="main"
      aria-live="polite"
      style={{ viewTransitionName: 'section-content' }}
    >
      <div className="animate-fadeIn">
        {/* Only show navigation elements for authenticated users */}
        {activeSection && (
          <>
            {/* Breadcrumb navigation */}
            <Breadcrumb 
              currentSection={activeSection}
              setActiveSection={setActiveSection}
            />
            
            {/* Email Verification Banner */}
            <EmailVerificationBanner />

            {/* Failed-payment banner (past_due subscriptions) */}
            <PastDueBanner />
            
            {/* Mini Learning Path - show on all content sections */}
            {!['dashboard', 'bookmarks', 'profile', 'cookie-demo'].includes(activeSection) && (
              <MiniLearningPath
                currentSection={activeSection}
                setActiveSection={setActiveSection}
                progress={progress}
                getSectionTotalItems={getSectionTotalItems}
                getSectionCompletedItems={getSectionCompletedItems}
              />
            )}
          </>
        )}
        
        <React.Suspense fallback={<SectionLoader />}>
          {renderSection()}
        </React.Suspense>
      </div>
      
      {/* Floating Progress - XP & streak ring */}
      {activeSection && !['dashboard', 'bookmarks'].includes(activeSection) && (
        <FloatingProgress activeSection={activeSection} />
      )}
    </main>
    <Footer />
    
    {/* Cookie Consent Banner */}
    <CookieConsent />

    {showOnboarding && (
      <React.Suspense fallback={null}>
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      </React.Suspense>
    )}
  </div>
  );
};

// Main App component with AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthModalProvider>
        <ProgressProvider>
          <SRSProvider>
            <UpgradeModalProvider>
              <AppContent />
            </UpgradeModalProvider>
          </SRSProvider>
        </ProgressProvider>
      </AuthModalProvider>
    </AuthProvider>
  );
};

// Component that includes toast functionality
const AppWithToast: React.FC = () => {
  return (
    <ToastProvider>
      <App />
      <ToastContainerWrapper />
    </ToastProvider>
  );
};

// Component to handle toast container
const ToastContainerWrapper: React.FC = () => {
  const { toasts, hideToast } = useToastContext();
  return <ToastContainer toasts={toasts} onHideToast={hideToast} />;
};

export default AppWithToast;