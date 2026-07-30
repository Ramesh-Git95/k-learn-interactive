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
import Drawer from './Drawer';
import { getPathSummary } from '../utils/learningUnits';
import { getStreakData, todayISO } from '../utils/xpStreak';


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

// Time-of-day mark beside the greeting — sunrise, sun or moon, drawn in the same
// stroked style as the rest of the chrome so it reads as part of the system.
const TimeMark: React.FC<{ hour: number }> = ({ hour }) => {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (hour >= 18 || hour < 5) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" {...common} aria-hidden="true">
        <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
      </svg>
    );
  }
  if (hour < 12) {
    // Sunrise — sun on the horizon
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" {...common} aria-hidden="true">
        <path d="M12 3v2M5.6 8.6 4.2 7.2M18.4 8.6l1.4-1.4M3 17h18M7 17a5 5 0 0110 0" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...common} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
};

// Word of the Day — vertical so it sits as the narrow support column beside the
// study activity, in the mockup's "focus → support" row.
const WordOfDayCard: React.FC<{
  word: { korean: string; romanization: string; english: string; category: string };
  onShare: () => void;
  onStudyMore: () => void;
}> = ({ word, onShare, onStudyMore }) => (
  <div className="kl-card flex h-full flex-col p-5">
    <p className="text-[12.5px] font-semibold text-[#2E6B59] dark:text-[#5FB89B]">WORD OF THE DAY</p>
    <div className="mt-4 flex-1">
      <div className="break-words font-korean text-[38px] font-bold leading-none text-[#16202F] dark:text-white">{word.korean}</div>
      <div className="mt-2.5 text-[13.5px] text-[#4A5566] dark:text-gray-500">{word.romanization}</div>
      <div className="mt-1 text-[16px] font-medium text-[#3E4A5A] dark:text-gray-300">{word.english}</div>
      <div className="mt-3 text-[12.5px] text-[#4A5566] dark:text-gray-500">{word.category}</div>
    </div>
    <div className="mt-5 flex items-center gap-2.5">
      <button
        onClick={onStudyMore}
        className="flex h-11 flex-1 items-center justify-center rounded-[10px] bg-[#2E6B59] px-4 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(46,107,89,0.32)] transition-colors hover:bg-[#25594A]"
      >
        Study more →
      </button>
      <button
        onClick={onShare}
        className="flex h-11 flex-none items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-sm font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
        title="Share today's word as an image"
      >
        Share
      </button>
    </div>
  </div>
);

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

  // Unit counts for the path drawer's row label (the drawer shows the count on
  // the outside so you know what is inside before opening it).
  const pathSummary = getPathSummary(progress, skipHangul ? ['hangul'] : []);

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

  // Last seven days of real study history — the streak as something you can see.
  const lastSevenDays = (() => {
    const studied = new Set(getStreakData().studyDates);
    const today = todayISO();
    const out: { ds: string; letter: string; studied: boolean; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      out.push({
        ds,
        letter: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
        studied: studied.has(ds),
        isToday: ds === today,
      });
    }
    return out;
  })();
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

        {/* ── Welcome — calm, but warm: a lit canvas, the Korean greeting done
               properly (한 + romanization + gloss), and the last seven days made
               visible so the streak is something you can see, not just a number. ── */}
        <div className="kl-welcome p-6 sm:p-7">
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              {/* Korean greeting — the content, paired as the design system asks */}
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="kl-accent flex-none" style={{ ['--kl-acc' as string]: '#C13F22', ['--kl-acc-dk' as string]: '#F07A55' }}>
                  <TimeMark hour={hour} />
                </span>
                <span className="font-korean text-[17px] font-semibold text-[#C13F22] dark:text-[#F07A55]">안녕하세요</span>
                <span className="text-[13px] text-[#4A5566] dark:text-gray-500">annyeonghaseyo · hello</span>
              </div>

              <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[40px] dark:text-white">
                {greeting}, {firstName}
              </h1>
              <p className="mt-2.5 max-w-xl text-[15px] leading-[1.55] text-[#3E4A5A] sm:text-base dark:text-gray-400">
                {subline}
              </p>
            </div>

            {/* Streak, made visual */}
            <div className="flex flex-none items-center gap-4 rounded-xl border border-[rgba(20,32,47,0.10)] bg-white/55 px-4 py-3 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <div>
                <div className="font-display text-[22px] font-semibold leading-none text-[#16202F] dark:text-white">
                  {xp.currentStreak}
                </div>
                <div className="mt-1 whitespace-nowrap text-[12px] text-[#4A5566] dark:text-gray-500">
                  day streak
                </div>
                <div className="mt-0.5 whitespace-nowrap text-[11.5px] text-[#4A5566] dark:text-gray-600">
                  best {xp.longestStreak}
                </div>
              </div>
              <div className="h-9 w-px bg-[rgba(20,32,47,0.10)] dark:bg-gray-700" />
              <div>
                <div className="flex items-end gap-[5px]">
                  {lastSevenDays.map(d => (
                    <div key={d.ds} className="flex flex-col items-center gap-1.5" title={`${d.ds}${d.studied ? ' · studied' : ''}`}>
                      <span
                        className={`h-[18px] w-[9px] rounded-full ${
                          d.studied
                            ? 'bg-[#C13F22]'
                            : d.isToday
                            ? 'bg-[rgba(20,32,47,0.08)] ring-1 ring-[#C13F22] dark:bg-gray-800'
                            : 'bg-[rgba(20,32,47,0.10)] dark:bg-gray-800'
                        }`}
                      />
                      <span className="text-[10px] leading-none text-[#4A5566] dark:text-gray-500">{d.letter}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Level · XP · TOPIK placement · Sync — every function from the old
              dark header, re-homed into one quiet strip. Nothing dropped. */}
          <div className="relative z-10 mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-[rgba(20,32,47,0.12)] pt-5 dark:border-gray-800">
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

        {/* ── Support row: activity (2/3) beside the daily word (1/3) ── */}
        {/* min-w-0 on the grid children: grid items default to min-width:auto,
            so the wide heatmap would stretch its column past the viewport
            instead of scrolling inside its own card on a phone. */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
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
          </div>
          <div className="min-w-0">
            <WordOfDayCard
              word={dailyWord}
              onShare={() => setShowShareWord(true)}
              onStudyMore={() => setActiveSection('vocabulary')}
            />
          </div>
        </div>

        {/* ── Shareable Word of the Day card modal ─────── */}
        {showShareWord && (
          <ShareableWordCard word={dailyWord} onClose={() => setShowShareWord(false)} />
        )}

        {/* ── Drawer: every other module ── */}
        <Drawer
          label="Everything else you could do"
          meta={`${QUICK_ACTIONS.length + PRACTICE_TOOLS.length} modules`}
        >
          {subscriptionTier === 'free' && (
            <button
              onClick={openUpgradeModal}
              className="mb-3.5 text-[12.5px] font-semibold text-[#C13F22] hover:underline dark:text-[#F07A55]"
            >
              Unlock all modules →
            </button>
          )}
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
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
        </Drawer>

        {/* ── Drawer: the full path (long by nature — collapsed by default) ── */}
        <Drawer label="Your path" meta={`${pathSummary.doneUnits}/${pathSummary.totalUnits} units done`}>
          <LearningPath
            setActiveSection={setActiveSection}
            progress={progress}
            assumeDone={skipHangul ? ['hangul'] : undefined}
          />
        </Drawer>

        {/* ── Drawer: spaced repetition decks ── */}
        <Drawer
          label="Spaced repetition"
          meta={srsStats.totalDue > 0 ? `${srsStats.totalDue} due now` : 'nothing due'}
        >
          <div className="kl-card overflow-hidden">
            <SRSDashboard
              onStartStudy={onStartStudy ?? (() => {})}
              onManageDecks={() => setActiveSection('srs')}
            />
          </div>
        </Drawer>

        {/* ── Drawer: achievements ── */}
        {achievements.length > 0 && (
          <Drawer label="What you've earned" meta={`${achievements.length} earned`}>
            <div className="kl-card p-5">
              <div className="flex flex-wrap gap-2.5">
                {achievements.map((a, i) => (
                  <span key={i} className="kl-well inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[#16202F] dark:text-gray-200">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </Drawer>
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

      </div>
    </div>
  );
}
