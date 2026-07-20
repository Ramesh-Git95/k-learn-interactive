import { useState } from 'react';
import type { Section, Bookmark } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { useToastContext } from '../contexts/ToastContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';
import { useXPStreak } from '../hooks/useXPStreak';
import { useSRSContext } from '../contexts/SRSContext';
import SRSDashboard from './SRSDashboard';
import LearningPath from './LearningPath';
import BookmarkFlashcards from './BookmarkFlashcards';
import StudyHeatmap from './StudyHeatmap';
import ShareableWordCard from './ShareableWordCard';
import TodaysSession from './TodaysSession';
import { vocabulary } from '../data/koreanData';
import { useUpgrade } from '../hooks/useUpgrade';
import { SECTIONS } from '../constants';
import { getTopikEstimate, canSkipHangul } from '../utils/topikEstimate';


interface DashboardProps {
  setActiveSection: (section: Section) => void;
  progress: { [key: string]: boolean };
  bookmarks: Bookmark[];
  getSectionTotalItems: (section: Section) => number;
  getSectionCompletedItems: (section: Section) => number;
  onStartStudy?: (deckId: string) => void;
}

const SECTION_META: { id: Section; name: string; icon: string; gradient: string; bar: string }[] = [
  { id: 'hangul',     name: 'Hangul',     icon: '한', gradient: 'from-[#E4572E] to-[#C13F22]',  bar: '#E4572E' },
  { id: 'vocabulary', name: 'Vocabulary', icon: '📖', gradient: 'from-[#3F8571] to-[#2E6B59]',  bar: '#3F8571' },
  { id: 'grammar',    name: 'Grammar',    icon: '📝', gradient: 'from-[#D9A441] to-[#C08A2D]',  bar: '#D9A441' },
  { id: 'phrases',    name: 'Phrases',    icon: '💬', gradient: 'from-[#2F5D8A] to-[#3F8571]',  bar: '#2F5D8A' },
  { id: 'culture',    name: 'Culture',    icon: '🎭', gradient: 'from-[#D9A441] to-[#8E3B54]',  bar: '#8E3B54' },
  { id: 'quiz',       name: 'Quiz',       icon: '🧠', gradient: 'from-[#2F5D8A] to-[#24476B]',  bar: '#24476B' },
];

const QUICK_ACTIONS: { id: Section; label: string; icon: string; sub: string; gradient: string }[] = [
  { id: 'vocabulary',   label: 'Study Vocab',     icon: '📖', sub: 'Learn new words',       gradient: 'from-[#3F8571] to-[#2E6B59]' },
  { id: 'hangul',       label: 'Practice Hangul', icon: '한', sub: 'Korean alphabet',       gradient: 'from-[#E4572E] to-[#C13F22]' },
  { id: 'quiz',         label: 'Take a Quiz',     icon: '🧠', sub: 'Test your knowledge',   gradient: 'from-[#2F5D8A] to-[#24476B]' },
  { id: 'conversation', label: 'AI Chat',          icon: '🤖', sub: 'Practice conversation', gradient: 'from-[#3F8571] to-[#2F5D8A]' },
];

const PRACTICE_TOOLS: { id: Section; label: string; icon: string; sub: string; freeLabel: string; isPremium: boolean }[] = [
  { id: 'honorifics',    label: 'Honorific Engine', icon: '🎭', sub: 'Formal · Polite · Casual speech',  freeLabel: '2 of 6 free', isPremium: true },
  { id: 'culture-cards', label: 'Culture Cards',    icon: '🌸', sub: 'Korean cultural concepts',         freeLabel: '6 cards free', isPremium: true },
  { id: 'writing',       label: 'Writing',          icon: '✍️', sub: 'Stroke order · write it yourself', freeLabel: '14 letters free', isPremium: true },
  { id: 'typing',        label: 'Typing Dojo',      icon: '⌨️', sub: '60-second vocabulary race',        freeLabel: '15-sec demo',  isPremium: true },
  { id: 'topik',         label: 'TOPIK Prep',       icon: '📋', sub: 'Official exam questions',          freeLabel: '3 q free',     isPremium: true },
];

const MOTIVATIONAL = [
  { ko: '할 수 있어요!',       en: 'You can do it!' },
  { ko: '화이팅!',             en: 'Fighting!' },
  { ko: '열심히 해요!',       en: 'Work hard!' },
  { ko: '잘 하고 있어요!',    en: "You're doing great!" },
  { ko: '포기하지 마요!',     en: "Don't give up!" },
  { ko: '오늘도 화이팅!',     en: 'Keep going today!' },
  { ko: '조금씩 나아가요!',   en: 'Progress step by step!' },
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
  const { showToast } = useToastContext();
  const { subscriptionTier }         = useFeatureAccess();
  const { openUpgradeModal }         = useUpgradeModal();
  const { startUpgrade }             = useUpgrade();
  const { stats: srsStats, decks: srsDecks } = useSRSContext();
  const xp                           = useXPStreak();

  const [showBookmarkFC, setShowBookmarkFC]   = useState(false);
  const [showShareWord, setShowShareWord]     = useState(false);
  const [sessionDone, setSessionDone]         = useState(false);

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

  // TOPIK placement — a tested level of 2+ means the learner reads Hangul,
  // so path surfaces skip the alphabet. (Dashboard remounts on navigation,
  // so a plain read stays fresh after taking the assessment.)
  const topikEstimate = getTopikEstimate();
  const skipHangul    = canSkipHangul(topikEstimate);

  // "Continue where you left off" — last visited learning surface (written by
  // App.tsx on every navigation), falling back to the first incomplete core
  // section for brand-new users.
  const continueTarget = (() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem('kl-last-section'); } catch { /* ignore */ }
    if (stored) {
      const meta = SECTIONS.find(s => s.id === stored);
      if (meta) return { id: meta.id as Section, title: meta.title, icon: meta.icon, resumed: true };
    }
    for (const sec of SECTION_META) {
      const total = getSectionTotalItems(sec.id);
      if (total > 0 && getSectionCompletedItems(sec.id) < total) {
        return { id: sec.id, title: sec.name, icon: sec.icon, resumed: false };
      }
    }
    return null;
  })();

  // Progress bar on the Continue card — only for core sections with counts.
  const continuePct = (() => {
    if (!continueTarget) return null;
    const total = getSectionTotalItems(continueTarget.id);
    if (!SECTION_META.some(s => s.id === continueTarget.id) || total <= 0) return null;
    return Math.round((getSectionCompletedItems(continueTarget.id) / total) * 100);
  })();

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
          font-family: 'Pretendard Variable', sans-serif;
          font-weight: 900;
        }
        .heatmap-dot { transition: all 0.2s ease; }
      `}</style>

      {/* Onboarding wizard is mounted once in App.tsx, gated on the account's
          decks in the DB — do not mount a second localStorage-gated copy here
          (it bypassed that check and re-created duplicate starter decks). */}

      {/* ── Bookmark Flashcards ────────────────────────── */}
      {showBookmarkFC && (
        <BookmarkFlashcards
          bookmarks={bookmarks}
          onClose={() => setShowBookmarkFC(false)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Welcome Header ──────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden p-8" style={{ background: 'linear-gradient(135deg, #0D141F 0%, #16202F 60%, #1E3A5C 100%)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: '#E4572E', filter: 'blur(60px)', transform: 'translate(30%,-30%)' }} />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-10" style={{ background: '#3F8571', filter: 'blur(50px)', transform: 'translateY(30%)' }} />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">{today}</p>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                안녕하세요, <span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{firstName}!</span> 👋
              </h1>
              <p className="text-gray-400 text-sm">
                <span className="text-[#F07A55] font-semibold" style={{ fontFamily: 'Pretendard Variable, sans-serif' }}>{motivation.ko}</span>
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
                      <stop offset="0%" stopColor="#E4572E" />
                      <stop offset="100%" stopColor="#8E3B54" />
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
                <span className="text-xs font-black px-2.5 py-1 rounded-full text-white" style={{ background: 'var(--brand-gradient)' }}>
                  Lv.{xp.level} {levelName}
                </span>
                <span className="text-gray-400 text-xs">{xp.totalXP} XP total</span>
                {/* TOPIK level card — surfaces the assessment + placement */}
                <button
                  onClick={() => setActiveSection('topik-test')}
                  className="text-xs font-black px-2.5 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
                  title="TOPIK level assessment"
                >
                  {topikEstimate ? `📊 TOPIK ~${topikEstimate.level} · Test again →` : '📊 Find your level →'}
                </button>
              </div>
              <span className="text-gray-500 text-xs">{xp.xpInLevel} / {xp.xpForLevel} XP to next level</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${Math.min(100, (xp.xpInLevel / xp.xpForLevel) * 100)}%`,
                  background: 'var(--brand-gradient-h)',
                }}
              />
            </div>
          </div>

          {isAuthenticated && (
            <div className="relative z-10 mt-4 flex items-center justify-between">
              <span className="text-gray-500 text-xs">Progress is auto-synced to the cloud</span>
              <button
                onClick={async () => {
                  try {
                    await syncLocalData();
                    showToast('Progress synced!', 'success');
                  } catch {
                    showToast('Sync failed. Check your connection.', 'error');
                  }
                }}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold text-white border border-white/20 hover:border-[#F07A55]/50 transition-colors disabled:opacity-40"
              >
                <span className={isSyncing ? 'animate-spin inline-block' : ''}>🔄</span>
                {isSyncing ? 'Syncing…' : 'Sync Now'}
              </button>
            </div>
          )}
        </div>

        {/* ── Today's Session — the one-decision daily plan ── */}
        <TodaysSession
          srsDue={srsStats.totalDue}
          decks={srsDecks}
          getSectionTotalItems={getSectionTotalItems}
          getSectionCompletedItems={getSectionCompletedItems}
          setActiveSection={setActiveSection}
          onStartStudy={onStartStudy}
          onCompleteChange={setSessionDone}
        />

        {/* ── Continue where you left off — shown once today's session is
               done, as the "keep going?" nudge (redundant before that:
               the session's Up-next already answers it) ── */}
        {sessionDone && continueTarget && (
          <button
            onClick={() => setActiveSection(continueTarget.id)}
            className="w-full flex items-center gap-4 rounded-2xl p-5 text-left text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            style={{ background: 'var(--brand-gradient)' }}
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0" style={{ fontFamily: 'Pretendard Variable, sans-serif', fontWeight: 900 }}>
              {continueTarget.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-black uppercase tracking-widest text-white/70">
                {continueTarget.resumed ? 'Continue where you left off' : 'Start your next step'}
              </div>
              <div className="text-lg font-black truncate">{continueTarget.title}</div>
              {continuePct !== null && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="w-full max-w-[180px] h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/90 rounded-full" style={{ width: `${continuePct}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-white/70">{continuePct}%</span>
                </div>
              )}
            </div>
            <span className="flex-shrink-0 px-4 py-2 rounded-xl bg-white text-[#C13F22] text-sm font-black">
              Continue →
            </span>
          </button>
        )}

        {/* ── Stats + Study Activity (merged into one card) ── */}
        <StudyHeatmap
          currentStreak={xp.currentStreak}
          longestStreak={xp.longestStreak}
          streakAtRisk={xp.streakAtRisk}
          completed={getTotalCompleted()}
          srsDue={srsStats.totalDue}
          bookmarks={bookmarks.length}
          onReview={() => setActiveSection('srs')}
          onBookmarks={() => bookmarks.length > 0 && setShowBookmarkFC(true)}
        />

        {/* ── Word of the Day ─────────────────────────── */}
        <div
          className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-[#D8E4EF] dark:border-[#122840]/40"
          style={{ background: 'linear-gradient(135deg, rgba(47,93,138,0.06) 0%, rgba(63,133,113,0.06) 100%)' }}
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg,#3F8571,#2F5D8A)' }}>
            📅
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#264D74] dark:text-[#5C85B0] mb-1">Word of the Day</p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{dailyWord.korean}</span>
              <span className="text-sm text-gray-400 dark:text-gray-500 italic">{dailyWord.romanization}</span>
              <span className="text-base font-semibold text-gray-700 dark:text-gray-300">— {dailyWord.english}</span>
            </div>
            <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#D8E4EF] dark:bg-[#122840]/30 text-[#264D74] dark:text-[#5C85B0]">{dailyWord.category}</span>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <button
              onClick={() => setShowShareWord(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold border-2 border-[#3F8571]/40 text-[#2E6B59] dark:text-[#7FC0AC] hover:border-[#3F8571] transition-colors"
              title="Share today's word as an image"
            >
              📤 Share
            </button>
            <button
              onClick={() => setActiveSection('vocabulary')}
              className="px-4 py-2 rounded-xl text-white text-sm font-bold transition-transform hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#3F8571,#2F5D8A)' }}
            >
              Study More →
            </button>
          </div>
        </div>

        {/* ── Shareable Word of the Day card modal ─────── */}
        {showShareWord && (
          <ShareableWordCard word={dailyWord} onClose={() => setShowShareWord(false)} />
        )}

        {/* ── Explore — quick actions + practice tools, one section ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Explore</h2>
            {subscriptionTier === 'free' && (
              <button
                onClick={openUpgradeModal}
                className="text-xs font-black px-3 py-1.5 rounded-lg text-white"
                style={{ background: 'var(--brand-gradient)' }}
              >
                ⭐ Unlock All
              </button>
            )}
          </div>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
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

        {/* Progress-by-section grid removed — the Learning Path below now
            carries a live completion bar per step (same data, one block). */}

        {/* ── Achievements ─────────────────────────────── */}
        {achievements.length > 0 && (
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Achievements</h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex flex-wrap gap-3">
                {achievements.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#FBEAE3] to-[#E9F1EC] dark:from-[#E4572E]/15 dark:to-[#3F8571]/15 border border-[#E4572E]/20 dark:border-[#E4572E]/30 text-[#C13F22] dark:text-[#F07A55]">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Upgrade Banner (free users) ──────────────── */}
        {subscriptionTier === 'free' && (
          <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #0D141F 0%, #16202F 100%)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-15" style={{ background: '#E4572E', filter: 'blur(50px)', transform: 'translate(20%,-20%)' }} />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🚀</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#F07A55]">Limited Offer</span>
                </div>
                <h3 className="text-xl font-black text-white mb-1">Get Premium</h3>
                <p className="text-gray-400 text-sm max-w-sm">
                  Unlock all tools, all content, 50 AI chats/day — one payment, forever.
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-white">$4</span>
                  <span className="text-gray-400 text-sm mb-1">/month</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={openUpgradeModal}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-white border border-white/20 hover:border-[#F07A55]/50 transition-colors"
                  >
                    See What's Included
                  </button>
                  <button
                    onClick={startUpgrade}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #FF90E8, #FF3366)' }}
                  >
                    Get Premium →
                  </button>
                </div>
                <span className="text-gray-500 text-xs">Less than a coffee ☕ · cancel anytime</span>
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

        {/* ── Learning Path (lesson-sized units; derives its own progress) ── */}
        <LearningPath
          setActiveSection={setActiveSection}
          progress={progress}
          assumeDone={skipHangul ? ['hangul'] : undefined}
        />

      </div>
    </div>
  );
}
