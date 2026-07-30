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
import { accentFor } from '../utils/moduleAccent';


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

  // Calm greeting (clarity redesign): time-aware line + an honest one-sentence
  // read of real progress. Overall % and items-completed, which used to live in
  // the ring, are folded into the subline so nothing is lost.
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const roundedOverall = Math.round(overall);
  const completedCount = getTotalCompleted();
  const subline = completedCount === 0
    ? 'Your first lesson is waiting — ten quiet minutes is enough to begin.'
    : `You're ${roundedOverall}% through the core path — ${completedCount} ${completedCount === 1 ? 'item' : 'items'} learned so far.`;

  // The one honest next action, derived from real state — reviews first, else
  // resume, else start. Feeds the "DO THIS NEXT" strip above the daily queue.
  const hint = (() => {
    if (srsStats.totalDue > 0) {
      return {
        accent: accentFor('srs'), label: 'DO THIS NEXT',
        text: `Clear your ${srsStats.totalDue} review ${srsStats.totalDue === 1 ? 'card' : 'cards'} first — they lock in words you've already met, before they slip.`,
      };
    }
    if (continueTarget) {
      return {
        accent: accentFor(continueTarget.id), label: 'DO THIS NEXT',
        text: `Pick up ${continueTarget.title} where you left off${continuePct !== null ? ` — you're ${continuePct}% through` : ''}.`,
      };
    }
    return {
      accent: accentFor('vocabulary'), label: 'START HERE',
      text: 'Begin with a few new words — ten quiet minutes is enough to feel it.',
    };
  })();

  return (
    // Canvas comes from the app root (App.tsx) so it is full-bleed, not a band.
    <div>
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

        {/* ── Greeting — calm, on the canvas (clarity redesign) ── */}
        <div>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#16202F] dark:text-white">
                {greeting}, {firstName}
              </h1>
              <p className="mt-2 max-w-xl text-[15px] sm:text-base text-[#3E4A5A] dark:text-gray-400">
                {subline}
              </p>
            </div>
            <div className="flex-none text-right">
              <div className="text-[13px] font-semibold text-[#16202F] dark:text-white">Day {xp.currentStreak} streak</div>
              <div className="mt-0.5 text-[13px] text-[#4A5566] dark:text-gray-500">
                Longest: {xp.longestStreak} {xp.longestStreak === 1 ? 'day' : 'days'}
              </div>
            </div>
          </div>

          {/* Level · XP · TOPIK placement · Sync — every function from the old
              dark header, re-homed into one quiet strip. Nothing dropped. */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-[rgba(20,32,47,0.12)] pt-5 dark:border-gray-800">
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: 'var(--brand-gradient)' }}>
              Lv.{xp.level} · {levelName}
            </span>
            <span className="text-[11px] text-[#4A5566] dark:text-gray-500">{xp.totalXP} XP total</span>
            <div className="flex min-w-[160px] max-w-xs flex-1 items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (xp.xpInLevel / xp.xpForLevel) * 100)}%`, background: 'var(--brand-gradient-h)' }} />
              </div>
              <span className="whitespace-nowrap text-[11px] text-[#4A5566] dark:text-gray-500">{xp.xpInLevel}/{xp.xpForLevel} XP</span>
            </div>
            <button
              onClick={() => setActiveSection('topik-test')}
              className="whitespace-nowrap text-[12px] font-semibold text-[#2F5D8A] hover:underline dark:text-[#7FB0E0]"
              title="TOPIK level assessment"
            >
              {topikEstimate ? `TOPIK ~${topikEstimate.level} · retest` : 'Find your level →'}
            </button>
            {isAuthenticated && (
              <button
                onClick={async () => {
                  try { await syncLocalData(); showToast('Progress synced!', 'success'); }
                  catch { showToast('Sync failed. Check your connection.', 'error'); }
                }}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#4A5566] transition-colors hover:text-[#16202F] disabled:opacity-40 dark:text-gray-400 dark:hover:text-gray-200"
                title="Sync progress to the cloud"
              >
                <svg className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isSyncing ? 'Syncing…' : 'Sync'}
              </button>
            )}
          </div>
        </div>

        {/* ── DO THIS NEXT — one honest next action, from real state ── */}
        <div
          className="flex items-start gap-3 rounded-r-lg border-l-[3px] px-4 py-3 sm:items-center"
          style={{ borderColor: hint.accent.light, background: `${hint.accent.light}14` }}
        >
          <span
            className="kl-accent flex-none whitespace-nowrap text-[12.5px] font-semibold"
            style={{ ['--kl-acc' as string]: hint.accent.light, ['--kl-acc-dk' as string]: hint.accent.dark }}
          >
            {hint.label}
          </span>
          <span className="text-[13.5px] leading-snug text-[#16202F] dark:text-gray-200">{hint.text}</span>
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
            className="kl-card flex w-full items-center gap-4 p-5 text-left transition-transform duration-200 hover:-translate-y-0.5"
          >
            {(() => { const acc = accentFor(continueTarget.id); return (
              <>
                <div
                  className="flex h-12 w-12 flex-none items-center justify-center rounded-xl font-korean text-xl font-bold"
                  style={{ background: `${acc.light}1F`, border: `1px solid ${acc.light}4D`, color: acc.light }}
                >
                  {continueTarget.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold text-[#4A5566] dark:text-gray-400">
                    {continueTarget.resumed ? 'CONTINUE WHERE YOU LEFT OFF' : 'START YOUR NEXT STEP'}
                  </div>
                  <div className="truncate text-[17px] font-semibold text-[#16202F] dark:text-white">{continueTarget.title}</div>
                  {continuePct !== null && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
                        <div className="h-full rounded-full" style={{ width: `${continuePct}%`, background: acc.light }} />
                      </div>
                      <span className="text-[11.5px] font-medium text-[#4A5566] dark:text-gray-500">{continuePct}%</span>
                    </div>
                  )}
                </div>
                <span
                  className="flex h-11 flex-none items-center rounded-[10px] px-5 text-sm font-semibold text-white"
                  style={{ background: acc.light }}
                >
                  Continue →
                </span>
              </>
            ); })()}
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
        <div className="kl-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[12.5px] font-semibold text-[#2E6B59] dark:text-[#5FB89B]">WORD OF THE DAY</p>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-korean text-3xl font-bold text-[#16202F] dark:text-white">{dailyWord.korean}</span>
              <span className="text-sm text-[#4A5566] dark:text-gray-500">{dailyWord.romanization}</span>
              <span className="text-base text-[#3E4A5A] dark:text-gray-300">— {dailyWord.english}</span>
            </div>
            <span className="mt-2 inline-block text-[12px] text-[#4A5566] dark:text-gray-500">{dailyWord.category}</span>
          </div>
          <div className="flex flex-none items-center gap-2.5">
            <button
              onClick={() => setShowShareWord(true)}
              className="flex h-11 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-sm font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
              title="Share today's word as an image"
            >
              Share
            </button>
            <button
              onClick={() => setActiveSection('vocabulary')}
              className="flex h-11 items-center rounded-[10px] bg-[#2E6B59] px-5 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(46,107,89,0.32)] transition-colors hover:bg-[#25594A]"
            >
              Study more →
            </button>
          </div>
        </div>

        {/* ── Shareable Word of the Day card modal ─────── */}
        {showShareWord && (
          <ShareableWordCard word={dailyWord} onClose={() => setShowShareWord(false)} />
        )}

        {/* ── Explore — quick actions + practice tools, one section ── */}
        <div>
          <div className="mb-1 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
                Everything else you could do
              </h2>
              <p className="mt-1 text-[13.5px] text-[#4A5566] dark:text-gray-400">
                {QUICK_ACTIONS.length + PRACTICE_TOOLS.length} modules · your session above already picks the important ones
              </p>
            </div>
            {subscriptionTier === 'free' && (
              <button
                onClick={openUpgradeModal}
                className="flex-none whitespace-nowrap text-[12.5px] font-semibold text-[#C13F22] hover:underline dark:text-[#F07A55]"
              >
                Unlock all →
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            {[...QUICK_ACTIONS, ...PRACTICE_TOOLS].map(item => {
              const acc = accentFor(item.id);
              const tool = 'freeLabel' in item ? item : null;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className="kl-card group relative p-4 text-left transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {tool && subscriptionTier === 'free' && (
                    <span className="absolute right-3 top-3 text-[10.5px] font-medium text-[#4A5566] dark:text-gray-500">
                      {tool.freeLabel}
                    </span>
                  )}
                  <div
                    className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                    style={{ background: `${acc.light}1F`, border: `1px solid ${acc.light}4D` }}
                  >
                    <span className="kl-accent font-korean font-bold" style={{ ['--kl-acc' as string]: acc.light, ['--kl-acc-dk' as string]: acc.dark }}>
                      {item.icon}
                    </span>
                  </div>
                  <div className="text-[15px] font-semibold text-[#16202F] dark:text-white">{item.label}</div>
                  <div className="mt-1 text-[12.5px] leading-relaxed text-[#4A5566] dark:text-gray-400">{item.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress-by-section grid removed — the Learning Path below now
            carries a live completion bar per step (same data, one block). */}

        {/* ── Achievements ─────────────────────────────── */}
        {achievements.length > 0 && (
          <div>
            <h2 className="mb-4 font-display text-[22px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
              What you've earned
            </h2>
            <div className="kl-card p-5">
              <div className="flex flex-wrap gap-2.5">
                {achievements.map((a, i) => (
                  <span key={i} className="kl-well inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[#16202F] dark:text-gray-200">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Upgrade Banner (free users) ──────────────── */}
        {subscriptionTier === 'free' && (
          <div className="kl-card flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1.5 text-[12.5px] font-semibold text-[#C13F22] dark:text-[#F07A55]">PREMIUM</p>
              <h3 className="font-display text-[21px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
                Every module, all content, 50 AI chats a day
              </h3>
              <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-[#3E4A5A] dark:text-gray-400">
                $4 a month — less than a coffee ☕, and you can cancel anytime.
              </p>
            </div>
            <div className="flex flex-none flex-col items-start gap-2.5 sm:items-end">
              <div className="flex items-end gap-1.5">
                <span className="font-display text-[32px] font-semibold leading-none text-[#16202F] dark:text-white">$4</span>
                <span className="text-[13px] text-[#4A5566] dark:text-gray-500">/month</span>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={openUpgradeModal}
                  className="flex h-11 items-center whitespace-nowrap rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-sm font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
                >
                  What's included
                </button>
                <button
                  onClick={startUpgrade}
                  className="flex h-11 items-center whitespace-nowrap rounded-[10px] px-5 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(193,63,34,0.3)] transition-transform hover:scale-[1.02]"
                  style={{ background: 'var(--brand-gradient)' }}
                >
                  Get Premium →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SRS Dashboard ────────────────────────────── */}
        <div className="kl-card overflow-hidden">
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
