import { useState } from 'react';
import type { Section, Bookmark } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';
import { useXPStreak } from '../hooks/useXPStreak';
import { useSRSContext } from '../contexts/SRSContext';
import SRSDashboard from './SRSDashboard';
import LearningPath from './LearningPath';
import OnboardingWizard from './OnboardingWizard';
import BookmarkFlashcards from './BookmarkFlashcards';
import { vocabulary } from '../data/koreanData';

const GUMROAD_URL = 'https://gumroad.com/l/klearn-lifetime';

interface DashboardProps {
  setActiveSection: (section: Section) => void;
  progress: { [key: string]: boolean };
  bookmarks: Bookmark[];
  getSectionTotalItems: (section: Section) => number;
  getSectionCompletedItems: (section: Section) => number;
  onStartStudy?: (deckId: string) => void;
}

const SECTION_META: { id: Section; name: string; icon: string; gradient: string; bar: string }[] = [
  { id: 'hangul',     name: 'Hangul',     icon: '한', gradient: 'from-pink-500 to-rose-500',      bar: '#EC4899' },
  { id: 'vocabulary', name: 'Vocabulary', icon: '📖', gradient: 'from-violet-500 to-purple-600',  bar: '#7C3AED' },
  { id: 'grammar',    name: 'Grammar',    icon: '✏️', gradient: 'from-orange-400 to-pink-500',    bar: '#F97316' },
  { id: 'phrases',    name: 'Phrases',    icon: '💬', gradient: 'from-teal-400 to-emerald-500',   bar: '#14B8A6' },
  { id: 'culture',    name: 'Culture',    icon: '🎌', gradient: 'from-yellow-400 to-orange-500',  bar: '#EAB308' },
  { id: 'quiz',       name: 'Quiz',       icon: '🧠', gradient: 'from-blue-500 to-indigo-600',    bar: '#3B82F6' },
];

const QUICK_ACTIONS: { id: Section; label: string; icon: string; sub: string; gradient: string }[] = [
  { id: 'vocabulary',   label: 'Study Vocab',     icon: '📖', sub: 'Learn new words',       gradient: 'from-violet-500 to-purple-600' },
  { id: 'hangul',       label: 'Practice Hangul', icon: '한', sub: 'Korean alphabet',       gradient: 'from-pink-500 to-rose-500' },
  { id: 'quiz',         label: 'Take a Quiz',     icon: '🧠', sub: 'Test your knowledge',   gradient: 'from-blue-500 to-indigo-600' },
  { id: 'conversation', label: 'AI Chat',          icon: '🤖', sub: 'Practice conversation', gradient: 'from-teal-400 to-emerald-500' },
];

const PRACTICE_TOOLS: { id: Section; label: string; icon: string; sub: string; freeLabel: string; isPremium: boolean }[] = [
  { id: 'honorifics',    label: 'Honorific Engine', icon: '🎭', sub: 'Formal · Polite · Casual speech',  freeLabel: '2 of 6 free', isPremium: true },
  { id: 'culture-cards', label: 'Culture Cards',    icon: '🌸', sub: 'Korean cultural concepts',         freeLabel: '6 cards free', isPremium: true },
  { id: 'typing',        label: 'Typing Dojo',      icon: '⌨️', sub: '60-second vocabulary race',        freeLabel: '15-sec demo',  isPremium: true },
  { id: 'topik',         label: 'TOPIK Prep',       icon: '📋', sub: 'Official exam questions',          freeLabel: '3 q free',     isPremium: true },
];

const MOTIVATIONAL = [
  { ko: '할 수 있어요!',    en: 'You can do it!' },
  { ko: '화이팅!',          en: 'Fighting!' },
  { ko: '열심히 해요!',    en: 'Work hard!' },
  { ko: '잘 하고 있어요!', en: "You're doing great!" },
  { ko: '포기하지 마요!',  en: "Don't give up!" },
];

const LEVEL_NAMES = ['', 'Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Int.', 'Advanced', 'Proficient', 'Expert', 'Master', 'Legend'];

const getDailyWord = () => {
  const all = vocabulary.flatMap(cat => cat.items.map(item => ({ ...item, category: cat.name })));
  const idx = Math.floor(Date.now() / 86_400_000) % all.length;
  return all[idx];
};

export default function Dashboard({
  setActiveSection, progress, bookmarks,
  getSectionTotalItems, getSectionCompletedItems, onStartStudy,
}: DashboardProps) {
  const { user, isAuthenticated }   = useAuth();
  const { syncLocalData, isSyncing } = useProgress();
  const { subscriptionTier }         = useFeatureAccess();
  const { openUpgradeModal }         = useUpgradeModal();
  const { stats: srsStats }          = useSRSContext();
  const xp                           = useXPStreak();

  const [showBookmarkFC, setShowBookmarkFC]   = useState(false);
  const [showOnboarding, setShowOnboarding]   = useState(
    () => !localStorage.getItem('k-learn-onboarding')
  );

  const today      = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const motivation = MOTIVATIONAL[new Date().getDay() % MOTIVATIONAL.length];
  const firstName  = user?.name?.split(' ')[0] ?? 'Learner';
  const dailyWord  = getDailyWord();

  const getOverallProgress = () => {
    const ids: Section[] = ['hangul', 'vocabulary', 'grammar', 'phrases', 'culture', 'quiz'];
    let total = 0, done = 0;
    ids.forEach(id => { total += getSectionTotalItems(id); done += getSectionCompletedItems(id); });
    return total > 0 ? (done / total) * 100 : 0;
  };

  const getTotalCompleted = () => Object.values(progress).filter(Boolean).length;

  const getAchievements = () => {
    const list: string[] = [];
    const done = getTotalCompleted();
    if (bookmarks.length >= 20) list.push('🏆 Master Collector');
    else if (bookmarks.length >= 10) list.push('⭐ Bookmark Expert');
    else if (bookmarks.length >= 5)  list.push('📌 Bookmark Collector');
    if (done >= 50) list.push('🎓 Dedicated Scholar');
    else if (done >= 25) list.push('🌟 Consistent Learner');
    else if (done >= 10) list.push('🚀 Getting Started');
    if (progress['section_hangul'])     list.push('🔤 Hangul Master');
    if (progress['section_vocabulary']) list.push('📚 Vocab Expert');
    if (progress['section_grammar'])    list.push('📝 Grammar Guru');
    if (progress['section_phrases'])    list.push('💬 Phrase Master');
    if (progress['section_culture'])    list.push('🎭 Culture Explorer');
    if (progress['section_quiz'])       list.push('🧠 Quiz Champion');
    if (xp.currentStreak >= 7)          list.push('🔥 Week Warrior');
    if (xp.currentStreak >= 30)         list.push('💎 Monthly Legend');
    if (xp.level >= 5)                  list.push('⚡ XP Grinder');
    return list.slice(0, 6);
  };

  const overall      = getOverallProgress();
  const achievements = getAchievements();
  const levelName    = LEVEL_NAMES[xp.level] ?? 'Master';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <style>{`
        .stat-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.1); }
        .dark .stat-card:hover { box-shadow: 0 12px 28px rgba(0,0,0,0.35); }
        .action-btn { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .action-btn:hover { transform: translateY(-4px) scale(1.02); }
        .section-card { transition: all 0.2s ease; cursor: pointer; }
        .section-card:hover { transform: translateY(-2px); }
        .progress-bar { transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
        .korean-action-icon {
          background: linear-gradient(135deg,#ffffff33,#ffffff11);
          font-family: 'Noto Sans KR', sans-serif;
          font-weight: 900;
        }
        .heatmap-dot { transition: all 0.2s ease; }
      `}</style>

      {/* ── Onboarding Wizard ──────────────────────────── */}
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}

      {/* ── Bookmark Flashcards ────────────────────────── */}
      {showBookmarkFC && (
        <BookmarkFlashcards
          bookmarks={bookmarks}
          onClose={() => setShowBookmarkFC(false)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Welcome Header ──────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden p-8" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: '#EC4899', filter: 'blur(60px)', transform: 'translate(30%,-30%)' }} />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-10" style={{ background: '#8B5CF6', filter: 'blur(50px)', transform: 'translateY(30%)' }} />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">{today}</p>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                안녕하세요, <span style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{firstName}!</span> 👋
              </h1>
              <p className="text-gray-400 text-sm">
                <span className="text-pink-400 font-semibold" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>{motivation.ko}</span>
                {' '}— {motivation.en}
              </p>
            </div>

            {/* Overall progress ring */}
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="url(#prog-grad)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${(overall / 100) * 175.9} 175.9`} />
                  <defs>
                    <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#EC4899" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white font-black text-sm">{Math.round(overall)}%</span>
              </div>
              <div>
                <div className="text-white font-bold">Overall Progress</div>
                <div className="text-gray-400 text-xs">{getTotalCompleted()} items completed</div>
              </div>
            </div>
          </div>

          {/* ── XP Level bar ── */}
          <div className="relative z-10 mt-5 pt-5 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-1 rounded-full text-white" style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' }}>
                  Lv.{xp.level} {levelName}
                </span>
                <span className="text-gray-400 text-xs">{xp.totalXP} XP total</span>
              </div>
              <span className="text-gray-500 text-xs">{xp.xpInLevel} / {xp.xpForLevel} XP to next level</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${Math.min(100, (xp.xpInLevel / xp.xpForLevel) * 100)}%`,
                  background: 'linear-gradient(90deg,#EC4899,#8B5CF6)',
                }}
              />
            </div>
          </div>

          {isAuthenticated && (
            <div className="relative z-10 mt-4 flex items-center justify-between">
              <span className="text-gray-500 text-xs">Progress is auto-synced to the cloud</span>
              <button
                onClick={async () => { try { await syncLocalData(); } catch { /* ignore */ } }}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold text-white border border-white/20 hover:border-pink-400/50 transition-colors disabled:opacity-40"
              >
                <span className={isSyncing ? 'animate-spin inline-block' : ''}>🔄</span>
                {isSyncing ? 'Syncing…' : 'Sync Now'}
              </button>
            </div>
          )}
        </div>

        {/* ── Stat Cards ──────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Streak card — full 7-day heatmap */}
          <div className={`stat-card bg-white dark:bg-gray-900 rounded-2xl p-5 border shadow-sm col-span-2 sm:col-span-1 ${
            xp.streakAtRisk ? 'border-orange-200 dark:border-orange-800 ring-1 ring-orange-200 dark:ring-orange-800' : 'border-gray-100 dark:border-gray-800'
          }`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 shadow" style={{ background: 'linear-gradient(135deg,#F97316,#EC4899)' }}>
              🔥
            </div>
            <div className="flex items-end gap-1.5 mb-0.5">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{xp.currentStreak}</span>
              {xp.streakAtRisk && (
                <span className="mb-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 animate-pulse">
                  Study today!
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">day streak</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-1 mb-3">Study Streak</div>
            {/* 7-day heatmap */}
            <div className="flex gap-1">
              {xp.weekHeatmap.map(day => (
                <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`heatmap-dot w-full aspect-square rounded-md ${
                      day.studied
                        ? 'opacity-100'
                        : day.isToday
                        ? 'opacity-30'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                    style={day.studied ? { background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' } : {}}
                  />
                  <span className="text-[9px] text-gray-400 dark:text-gray-600 leading-none">
                    {day.label === 'Today' ? '▼' : day.label.slice(0, 1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Items Completed */}
          <div className="stat-card bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-lg mb-3 shadow">✅</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{getTotalCompleted()}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">total items</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-1">Completed</div>
          </div>

          {/* SRS Due Now */}
          <div className={`stat-card bg-white dark:bg-gray-900 rounded-2xl p-5 border shadow-sm ${
            srsStats.totalDue > 0 ? 'border-pink-200 dark:border-pink-800 ring-1 ring-pink-200 dark:ring-pink-800' : 'border-gray-100 dark:border-gray-800'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg mb-3 shadow">🧠</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{srsStats.totalDue}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">cards to review</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-1">SRS Due Now</div>
          </div>

          {/* Bookmarks — clickable to start flashcard session */}
          <button
            onClick={() => setShowBookmarkFC(true)}
            className="stat-card bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm text-left group hover:border-yellow-200 dark:hover:border-yellow-800 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-lg mb-3 shadow">⭐</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{bookmarks.length}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">saved words</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-1">Bookmarks</div>
            {bookmarks.length > 0 && (
              <div className="mt-2 text-[11px] font-bold text-yellow-500 dark:text-yellow-400 group-hover:underline">
                Study flashcards →
              </div>
            )}
          </button>
        </div>

        {/* ── Word of the Day ─────────────────────────── */}
        <div
          className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-cyan-100 dark:border-cyan-900/40"
          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(139,92,246,0.06) 100%)' }}
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg,#06B6D4,#8B5CF6)' }}>
            📅
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">Word of the Day</p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{dailyWord.korean}</span>
              <span className="text-sm text-gray-400 dark:text-gray-500 italic">{dailyWord.romanization}</span>
              <span className="text-base font-semibold text-gray-700 dark:text-gray-300">— {dailyWord.english}</span>
            </div>
            <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">{(dailyWord as any).category}</span>
          </div>
          <button
            onClick={() => setActiveSection('vocabulary')}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-white text-sm font-bold transition-transform hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg,#06B6D4,#8B5CF6)' }}
          >
            Study More →
          </button>
        </div>

        {/* ── Quick Actions ────────────────────────────── */}
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map(a => (
              <button
                key={a.id}
                onClick={() => setActiveSection(a.id)}
                className={`action-btn bg-gradient-to-br ${a.gradient} rounded-2xl p-6 text-left text-white shadow-md`}
              >
                <div className="w-12 h-12 rounded-xl korean-action-icon flex items-center justify-center text-2xl mb-4">
                  {a.icon}
                </div>
                <div className="font-bold text-base">{a.label}</div>
                <div className="text-white/70 text-xs mt-1">{a.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Practice Tools ───────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Practice Tools</h2>
            {subscriptionTier === 'free' && (
              <button
                onClick={openUpgradeModal}
                className="text-xs font-black px-3 py-1.5 rounded-lg text-white"
                style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' }}
              >
                ⭐ Unlock All
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {PRACTICE_TOOLS.map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveSection(tool.id)}
                className="relative p-4 rounded-2xl text-left bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {subscriptionTier === 'free' && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    {tool.freeLabel}
                  </span>
                )}
                <div className="text-3xl mb-3">{tool.icon}</div>
                <div className="font-black text-sm text-gray-900 dark:text-white mb-1">{tool.label}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{tool.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Progress by Section ──────────────────────── */}
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Progress by Section</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECTION_META.map(sec => {
              const total = getSectionTotalItems(sec.id);
              const done  = getSectionCompletedItems(sec.id);
              const pct   = total > 0 ? (done / total) * 100 : 0;
              return (
                <div
                  key={sec.id}
                  className="section-card bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm"
                  onClick={() => setActiveSection(sec.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sec.gradient} flex items-center justify-center text-base shadow-sm`} style={{ fontFamily: 'Noto Sans KR, sans-serif', fontWeight: 900 }}>
                        {sec.icon}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{sec.name}</span>
                    </div>
                    <span className="text-sm font-black" style={{ color: sec.bar }}>{Math.round(pct)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                    <div
                      className="progress-bar h-2 rounded-full"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${sec.bar}99, ${sec.bar})` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{done} of {total} completed</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Achievements ─────────────────────────────── */}
        {achievements.length > 0 && (
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Achievements</h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex flex-wrap gap-3">
                {achievements.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-pink-50 to-violet-50 dark:from-pink-900/20 dark:to-violet-900/20 border border-pink-100 dark:border-pink-800/30 text-pink-700 dark:text-pink-400">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Upgrade Banner (free users) ──────────────── */}
        {subscriptionTier === 'free' && (
          <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-15" style={{ background: '#EC4899', filter: 'blur(50px)', transform: 'translate(20%,-20%)' }} />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🚀</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-pink-400">Limited Offer</span>
                </div>
                <h3 className="text-xl font-black text-white mb-1">Get Lifetime Access</h3>
                <p className="text-gray-400 text-sm max-w-sm">
                  Unlock all tools, all content, 50 AI chats/day — one payment, forever.
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-white">$39</span>
                  <span className="text-gray-500 text-sm line-through mb-1">$99</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={openUpgradeModal}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-white border border-white/20 hover:border-pink-400/50 transition-colors"
                  >
                    See What's Included
                  </button>
                  <a
                    href={GUMROAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #FF90E8, #FF3366)' }}
                  >
                    Get Access →
                  </a>
                </div>
                <span className="text-gray-500 text-xs">via Gumroad · 30-day guarantee</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SRS Dashboard ────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <SRSDashboard
            onStartStudy={onStartStudy ?? (() => {})}
            onManageDecks={() => setActiveSection('srs')}
          />
        </div>

        {/* ── Learning Path ────────────────────────────── */}
        <LearningPath
          currentSection="dashboard"
          setActiveSection={setActiveSection}
          progress={progress}
        />

      </div>
    </div>
  );
}
