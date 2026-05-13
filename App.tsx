import React, { useState, useEffect, useCallback } from 'react';
import type { Section, Bookmark } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { ToastProvider, useToastContext } from './contexts/ToastContext';
import { ProgressProvider } from './contexts/ProgressContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import EnhancedHangulSection from './components/EnhancedHangulSection';
import VocabularySection from './components/VocabularySection';
import EnhancedGrammarSection from './components/EnhancedGrammarSection';
import EnhancedPhrasesSection from './components/EnhancedPhrasesSection';
import EnhancedCultureHub from './components/EnhancedCultureHub';
import AuthenticatedQuizSection from './components/AuthenticatedQuizSection';
import UserProfile from './components/UserProfile';
import ConversationSection from './components/ConversationSection';
import BookmarkList from './components/BookmarkList';
import MiniLearningPath from './components/MiniLearningPath';
import FloatingProgress from './components/FloatingProgress';
import Breadcrumb from './components/Breadcrumb';
import SRSManager from './components/SRSManager';
import SRSStudySession from './components/SRSStudySession';
import ToastContainer from './components/ToastContainer';
import EmailVerification from './components/EmailVerification';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import OnboardingWizard from './components/OnboardingWizard';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import useLocalStorage from './hooks/useLocalStorage';
import useSRS from './hooks/useSRS';
import { LS_THEME_KEY } from './constants';
import { UpgradeModalProvider } from './contexts/UpgradeModalContext';
import { vocabulary, grammarPatterns, commonPhrases, cultureTips, hangulCharacters, koreanRegions, dailyLifeTopics, modernKoreaTopics } from './data/koreanData';
import { useProgress } from './contexts/ProgressContext';
import LearningPath from './components/LearningPath';
import LandingPage from './components/LandingPage';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import TopikPrepSection from './components/TopikPrepSection';
import HonorificEngine from './components/HonorificEngine';
import CultureCards from './components/CultureCards';
import TypingDojo from './components/TypingDojo';

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
  const { actions: srsActions } = useSRS();
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>(LS_THEME_KEY, 'light');
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Initialize activeSection as null for landing page, dashboard for authenticated users
  const [activeSection, setActiveSection] = useState<Section | null>(null);

  // Initialize dashboard for authenticated users only on first load
  useEffect(() => {
    if (user && activeSection === null) {
      setActiveSection('dashboard');
    }
  }, [user]);

  // Show onboarding wizard for new users. Write 'pending' to localStorage
  // immediately on trigger so re-renders never cause a second instance.
  useEffect(() => {
    if (isAuthenticated) {
      if (!localStorage.getItem('k-learn-onboarding')) {
        localStorage.setItem('k-learn-onboarding', 'pending');
        setShowOnboarding(true);
      }
    } else {
      // Clear 'pending' on logout so wizard shows again on next login if not completed
      if (localStorage.getItem('k-learn-onboarding') === 'pending') {
        localStorage.removeItem('k-learn-onboarding');
      }
      setShowOnboarding(false);
    }
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

  // After returning from Gumroad, refresh user to pick up premium upgrade from ping
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('purchase') === 'success' && isAuthenticated) {
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => {
        refreshUser();
        showToast('🎉 Welcome to Premium! Your account has been upgraded.', 'success');
      }, 3000);
    }
  }, [isAuthenticated]);

  // Global tab-return refresh — catches Gumroad ping upgrade from any page
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

  // Check for special routes
  const currentPath = window.location.pathname;
  const isVerifyEmailPage = currentPath.startsWith('/verify-email');

  // If we're on the email verification page, render the EmailVerification component
  if (isVerifyEmailPage) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
        <EmailVerification />
      </div>
    );
  }



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
      if (hash && ['dashboard', 'hangul', 'vocabulary', 'grammar', 'phrases', 'culture', 'quiz', 'conversation', 'bookmarks', 'srs', 'profile', 'cookie-demo', 'topik', 'honorifics', 'culture-cards', 'typing'].includes(hash as Section)) {
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

  // Enhanced loading with accessibility
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

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
    } else {
      await addBookmark(itemToToggle);
    }
  }, [bookmarks, addBookmark, removeBookmark, isAuthenticated]);

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
        if (!premium) return Math.floor(grammarPatterns.length * 0.6);
        return grammarPatterns.length;
      }
      case 'phrases': {
        if (!premium) return 15;
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
      case 'honorifics':
        return <HonorificEngine />;
      case 'culture-cards':
        return <CultureCards />;
      case 'typing':
        return <TypingDojo />;
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
          <LandingPage onGetStarted={handleGetStarted} />
          <Footer />
          <CookieConsent />
        </div>
      );
    }
  }

  if (isLoading || progressLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-500 dark:border-pink-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-2xl font-korean text-pink-500 dark:text-pink-400">한글배움</p>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  const isUserAuthenticated = !!user;

  return (
    <div 
      className={`min-h-screen font-sans bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-all duration-300 ease-in-out ${
        isThemeTransitioning ? 'theme-transitioning' : ''
      }`}
      role="main"
      aria-label="Korean Learning Application"
    >
    {/* Skip to main content link for screen readers */}
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-pink-500 text-white px-4 py-2 rounded-lg z-50 transition-all duration-200"
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
            
            {/* Mini Learning Path - show on main sections (much more compact) */}
            {['hangul', 'vocabulary', 'grammar', 'phrases', 'culture', 'quiz'].includes(activeSection) && (
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
        
        {renderSection()}
      </div>
      
      {/* Floating Progress - always visible but minimal */}
      {activeSection && !['dashboard', 'bookmarks'].includes(activeSection) && (
        <FloatingProgress
          activeSection={activeSection}
          progress={progress}
          getSectionTotalItems={getSectionTotalItems}
          getSectionCompletedItems={getSectionCompletedItems}
        />
      )}
    </main>
    <Footer />
    
    {/* Cookie Consent Banner */}
    <CookieConsent />

    {showOnboarding && (
      <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
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
          <AppContent />
        </ProgressProvider>
      </AuthModalProvider>
    </AuthProvider>
  );
};

// Component that includes toast functionality
const AppWithToast: React.FC = () => {
  return (
    <ToastProvider>
      <UpgradeModalProvider>
        <App />
        <ToastContainerWrapper />
      </UpgradeModalProvider>
    </ToastProvider>
  );
};

// Component to handle toast container
const ToastContainerWrapper: React.FC = () => {
  const { toasts, hideToast } = useToastContext();
  return <ToastContainer toasts={toasts} onHideToast={hideToast} />;
};

export default AppWithToast;