import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { useUpgrade } from '../hooks/useUpgrade';
import { useProgress } from '../contexts/ProgressContext';
import { useSRSContext } from '../contexts/SRSContext';
import { getXPData, getStreakData, getLevelInfo, todayISO } from '../utils/xpStreak';
import { getTopikEstimate } from '../utils/topikEstimate';
import { accentFor } from '../utils/moduleAccent';
import { hangulCharacters, vocabulary, grammarPatterns, commonPhrases } from '../data/koreanData';
import type { Section } from '../types';

const ACC = accentFor('profile');
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

const railCard =
  'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

const WEEKS = 12;

// Study dates are written by todayISO() as LOCAL calendar days. Parsing one with
// new Date('2026-08-09') would read it as UTC midnight, which is the previous
// evening anywhere west of Greenwich — enough to drop a day into the wrong week
// for most of the audience. Everything here stays local, the same way the streak
// does.
function localDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Monday-based week key, so the bars line up with how a week is usually counted. */
function weekStart(d: Date): string {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  c.setDate(c.getDate() - ((c.getDay() + 6) % 7));
  return isoOf(c);
}

interface Props {
  setActiveSection?: (s: Section) => void;
}

const UserProfile: React.FC<Props> = ({ setActiveSection }) => {
  const { user, isAuthenticated, hasPremiumAccess, refreshUser } = useAuth();
  const { showToast } = useToastContext();
  const { startUpgrade } = useUpgrade();
  const { progress } = useProgress();
  const { decks } = useSRSContext();
  const [stripeLoading, setStripeLoading] = useState(false);

  // When the profile opens, pull the live subscription from Stripe into the DB
  // (self-heals any drift, e.g. a cancellation a webhook missed), then refresh
  // the user so the UI shows the current state — "Cancels on <date>" + hidden button.
  React.useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/stripe/sync-subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
      } catch { /* non-blocking */ }
      refreshUser();
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // XP and streak come from the gamification store, NOT user.progress.xp —
  // that one is recomputed from lesson counts on every save, so the profile
  // used to show a different number from the dashboard for the same account.
  const xp = getXPData().total;
  const streak = getStreakData();
  const level = getLevelInfo(xp);

  const counts = useMemo(() => {
    const done = (prefix: string) =>
      Object.keys(progress).filter(k => k.startsWith(prefix) && progress[k]).length;
    const vocabTotal = vocabulary.reduce((a, c) => a + c.items.length, 0);
    return {
      letters: { done: done('hangul_char_'), total: hangulCharacters.length, label: 'letters' },
      written: { done: done('writing_char_'), total: hangulCharacters.length, label: 'letters written' },
      vocab: { done: done('vocab_item_'), total: vocabTotal, label: 'words' },
      grammar: { done: done('grammar_pattern_'), total: grammarPatterns.length, label: 'patterns' },
      phrases: { done: done('phrase_'), total: commonPhrases.length, label: 'phrases' },
    };
  }, [progress]);

  const cardsInReview = useMemo(() => decks.reduce((a, d) => a + d.cards.length, 0), [decks]);

  // Twelve weeks of "days practised", from the study dates the account keeps.
  // The design asked for minutes per week; nothing in the app has ever measured
  // time, so this counts the thing that is actually recorded.
  const weeks = useMemo(() => {
    const studied = new Set(streak.studyDates ?? []);
    const buckets: { key: string; days: number }[] = [];
    const now = new Date();
    for (let i = WEEKS - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      buckets.push({ key: weekStart(d), days: 0 });
    }
    const index = new Map(buckets.map((b, i) => [b.key, i]));
    studied.forEach(iso => {
      const i = index.get(weekStart(localDate(iso)));
      if (i !== undefined) buckets[i].days++;
    });
    return buckets;
  }, [streak.studyDates]);

  const thisWeekDays = weeks[weeks.length - 1]?.days ?? 0;
  const recentFour = weeks.slice(-4).reduce((a, w) => a + w.days, 0);
  const previousFour = weeks.slice(-8, -4).reduce((a, w) => a + w.days, 0);

  const chartSentence =
    recentFour === 0
      ? 'Nothing recorded in the last four weeks. One short session puts a bar back on the chart.'
      : previousFour === 0
      ? `${recentFour} days of practice in the last four weeks — the first stretch the account has recorded.`
      : recentFour > previousFour
      ? `${recentFour} days in the last four weeks, against ${previousFour} in the four before. You are practising more than you were.`
      : recentFour === previousFour
      ? `${recentFour} days in each of the last two four-week stretches. Steady.`
      : `${recentFour} days in the last four weeks, against ${previousFour} before. Worth a short session today.`;

  // The module furthest behind — a real answer to "what should I do next"
  // rather than a predicted exam grade.
  const weakest = useMemo(() => {
    const mods = [
      { key: 'hangul' as Section, name: 'Alphabet', ...counts.letters },
      { key: 'vocabulary' as Section, name: 'Vocabulary', ...counts.vocab },
      { key: 'grammar' as Section, name: 'Grammar', ...counts.grammar },
      { key: 'phrases' as Section, name: 'Phrases', ...counts.phrases },
    ];
    return mods.slice().sort((a, b) => a.done / a.total - b.done / b.total)[0];
  }, [counts]);

  const topik = getTopikEstimate();

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="font-display text-[26px] font-semibold text-[#16202F] dark:text-white">Profile</h1>
        <p className="mt-2 text-[15px] text-[#4A5566] dark:text-gray-400">Sign in to see your progress.</p>
      </div>
    );
  }

  const isPremium = hasPremiumAccess();
  // Only Stripe subscribers have a subscription to manage/cancel/resume — a
  // legacy lifetime user is premium but has no Stripe sub (id starts with 'sub_').
  const hasStripeSub = !!user.subscription?.stripeSubscriptionId
    && user.subscription.stripeSubscriptionId.startsWith('sub_');
  const subscriptionType = user.subscription?.type || 'free';
  const subscriptionStatus = user.subscription?.status || 'active';

  // Open the Stripe Customer Portal — 'cancel' jumps straight into the
  // cancellation flow; 'manage' opens the general portal (update card,
  // invoices, resume a scheduled cancellation).
  const openBillingPortal = async (flow: 'cancel' | 'manage' = 'manage') => {
    setStripeLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/stripe/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ flow }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.message || 'Could not open billing portal.', 'error');
        setStripeLoading(false);
      }
    } catch {
      showToast('Network error opening billing portal.', 'error');
      setStripeLoading(false);
    }
  };

  const headline = [
    { value: cardsInReview, label: cardsInReview === 1 ? 'word in review' : 'words in review' },
    { value: `${counts.letters.done}/${counts.letters.total}`, label: 'letters learned' },
    { value: `${streak.currentStreak}`, label: streak.currentStreak === 1 ? 'day streak' : 'day streak' },
  ];

  const modules = [
    { name: 'Alphabet', section: 'hangul' as Section, ...counts.letters },
    { name: 'Vocabulary', section: 'vocabulary' as Section, ...counts.vocab },
    { name: 'Grammar', section: 'grammar' as Section, ...counts.grammar },
    { name: 'Phrases', section: 'phrases' as Section, ...counts.phrases },
  ];

  const maxDays = Math.max(1, ...weeks.map(w => w.days));

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[12.5px]">
            <span className="font-medium text-[#4A5566] dark:text-gray-400">Account</span>
            <span className="text-[#4A5566] dark:text-gray-600">/</span>
            <span className="font-semibold" style={{ color: ACC.light }}>Profile</span>
          </div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            {user.name}
          </h1>
          <p className="mt-1 text-[14px] text-[#4A5566] dark:text-gray-400">
            {user.email} · level {level.level} · {xp.toLocaleString()} XP
          </p>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveSection?.('topik-test')}
            className="flex h-11 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
          >
            {topik ? `TOPIK ${topik.level} · retest` : 'See placement'}
          </button>
        </div>
      </div>

      {/* Payment failed — stays above everything, it is the one urgent thing */}
      {subscriptionStatus === 'past_due' && (
        <div
          className="mb-5 rounded-[14px] border px-5 py-4"
          style={{ borderColor: 'rgba(193,63,34,0.35)', background: 'rgba(193,63,34,0.08)' }}
        >
          <div className="text-[14px] font-semibold text-[#C13F22]">Your last payment did not go through</div>
          <p className="mt-1 max-w-[62ch] text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-300">
            Premium stays on for now, but it will end unless the card is updated.
          </p>
          <button
            onClick={() => openBillingPortal('manage')}
            disabled={stripeLoading}
            className="mt-3 flex h-10 items-center rounded-[9px] px-4 text-[13px] font-semibold text-white disabled:opacity-50"
            style={{ background: '#C13F22' }}
          >
            {stripeLoading ? 'Opening…' : 'Update payment method'}
          </button>
        </div>
      )}

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="order-1 w-full min-w-0 flex-1">
          {/* ── Three numbers ── */}
          <div className="kl-card grid grid-cols-1 divide-y divide-[rgba(20,32,47,0.10)] sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-gray-800">
            {headline.map(h => (
              <div key={h.label} className="px-6 py-5">
                <div className="font-display text-[32px] font-semibold leading-none text-[#16202F] dark:text-white">
                  {h.value}
                </div>
                <div className="mt-1.5 text-[13px] text-[#4A5566] dark:text-gray-500">{h.label}</div>
              </div>
            ))}
          </div>

          {/* ── One chart, and a sentence saying what it means ── */}
          <div className="kl-card mt-4 p-5 sm:p-6">
            <div className="mb-1 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Days practised per week</div>
            <p className="mb-4 max-w-[62ch] text-[13.5px] leading-[1.55] text-[#4A5566] dark:text-gray-400">
              {chartSentence}
            </p>

            <div className="flex h-[90px] items-end gap-1.5">
              {weeks.map((w, i) => (
                <div
                  key={w.key}
                  className="flex-1 rounded-t-[3px] transition-all duration-500"
                  style={{
                    height: `${Math.max(3, (w.days / maxDays) * 100)}%`,
                    background: i === weeks.length - 1 ? ACC.light : `${ACC.light}59`,
                  }}
                  title={`Week of ${w.key}: ${w.days} day${w.days === 1 ? '' : 's'}`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[12px] text-[#4A5566] dark:text-gray-500">
              <span>{WEEKS} weeks ago</span>
              <span>this week · {thisWeekDays} day{thisWeekDays === 1 ? '' : 's'}</span>
            </div>
          </div>

          {/* ── By module ── */}
          <div className="kl-card mt-4 p-5 sm:p-6">
            <div className="mb-4 text-[13.5px] font-semibold text-[#16202F] dark:text-white">By module</div>
            <div className="flex flex-col gap-3.5">
              {modules.map(m => (
                <button
                  key={m.name}
                  onClick={() => setActiveSection?.(m.section)}
                  className="grid grid-cols-[100px_1fr_auto] items-center gap-3 text-left transition-opacity hover:opacity-75 sm:grid-cols-[120px_1fr_auto]"
                >
                  <span className="truncate text-[13.5px] font-medium text-[#16202F] dark:text-gray-200">{m.name}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{ width: `${m.total ? (m.done / m.total) * 100 : 0}%`, background: ACC.light }}
                    />
                  </span>
                  <span className="whitespace-nowrap text-[12.5px] text-[#4A5566] dark:text-gray-500">
                    {m.done} of {m.total} {m.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 border-t border-[rgba(20,32,47,0.12)] pt-3.5 text-[12.5px] text-[#4A5566] dark:border-gray-800 dark:text-gray-500">
              Counted from what you have actually opened and finished — not from time spent.
            </p>
          </div>

          {/* ── Your plan ── */}
          <div className="kl-card mt-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[13.5px] font-semibold text-[#16202F] dark:text-white">Your plan</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold capitalize"
                    style={
                      isPremium
                        ? { background: `${ACC.light}1F`, color: ACC.light }
                        : { background: 'rgba(20,32,47,0.06)', color: '#4A5566' }
                    }
                  >
                    {subscriptionType}
                  </span>
                  <span className="text-[12.5px] capitalize text-[#4A5566] dark:text-gray-500">
                    {subscriptionStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
              {isPremium && user.subscription?.currentPeriodEnd && (
                <div className="text-right">
                  <div className="text-[12px] text-[#4A5566] dark:text-gray-500">
                    {user.subscription?.cancelAtPeriodEnd ? 'Access until' : 'Renews'}
                  </div>
                  <div className="text-[13.5px] font-semibold text-[#16202F] dark:text-white">
                    {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {isPremium ? (
              <div className="mt-4">
                {/* Stripe subscription management — only for Stripe subscribers.
                    A legacy lifetime user keeps access with nothing to manage. */}
                {hasStripeSub ? (
                  user.subscription?.cancelAtPeriodEnd ? (
                    <>
                      <p className="kl-well rounded-xl px-4 py-3 text-[13px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
                        Set to cancel on{' '}
                        {user.subscription.currentPeriodEnd
                          ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
                          : 'the end of the period'}
                        . Premium stays on until then.
                      </p>
                      <button
                        onClick={() => openBillingPortal('manage')}
                        disabled={stripeLoading}
                        className="mt-3 flex h-11 items-center rounded-[10px] px-5 text-[14px] font-semibold text-white disabled:opacity-40"
                        style={{ background: ACC.light }}
                      >
                        {stripeLoading ? 'Opening…' : 'Resume subscription'}
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => openBillingPortal('manage')}
                        disabled={stripeLoading}
                        className="flex h-11 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
                      >
                        {stripeLoading ? 'Opening…' : 'Manage billing'}
                      </button>
                      <button
                        onClick={() => openBillingPortal('cancel')}
                        disabled={stripeLoading}
                        className="text-[12.5px] text-[#4A5566] transition-colors hover:text-[#C13F22] disabled:opacity-40 dark:text-gray-500"
                      >
                        Cancel subscription
                      </button>
                    </div>
                  )
                ) : (
                  <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
                    Your access does not expire and there is nothing to renew.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <p className="mb-3 text-[13.5px] text-[#4A5566] dark:text-gray-400">What Premium adds:</p>
                <ul className="mb-4 flex flex-col gap-2">
                  {([
                    ['K-Drama and K-Pop word packs', ''],
                    ['50 AI chats a day', 'you get 5'],
                    ['Unlimited quizzes and TOPIK prep', ''],
                    ['All Culture Cards and Honorifics', ''],
                    ['Unlimited bookmarks, synced to your account', ''],
                  ] as [string, string][]).map(([label, sub]) => (
                    <li key={label} className="flex items-baseline gap-2 text-[13.5px] text-[#3E4A5A] dark:text-gray-300">
                      <span className="text-[#8A93A0]">·</span>
                      <span>
                        {label}
                        {sub && <span className="text-[#4A5566] dark:text-gray-500"> ({sub})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={startUpgrade}
                    className="flex h-11 items-center rounded-[10px] px-5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
                    style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
                  >
                    Unlock all — $4/month
                  </button>
                  <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">
                    Less than a coffee ☕ · cancel anytime
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Rail ── */}
        <div className="order-2 w-full flex-none lg:w-[290px]">
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">This week</div>
            <div className="flex flex-col gap-2.5 text-[13.5px] text-[#4A5566] dark:text-gray-400">
              <div className="flex justify-between">
                Practised
                <strong className="font-semibold text-[#16202F] dark:text-white">{thisWeekDays} of 7 days</strong>
              </div>
              <div className="flex justify-between">
                Words in review
                <strong className="font-semibold text-[#16202F] dark:text-white">{cardsInReview}</strong>
              </div>
              <div className="flex justify-between">
                Total XP
                <strong className="font-semibold text-[#16202F] dark:text-white">{xp.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {weakest && weakest.done < weakest.total && (
            <div className={`${railCard} mb-3.5`}>
              <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
                What would help most
              </div>
              <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
                {weakest.name} is the module you have covered least — {weakest.done} of {weakest.total}{' '}
                {weakest.label}. It is the number holding the rest back.
              </p>
              <button
                onClick={() => setActiveSection?.(weakest.key)}
                className="mt-3 text-[13.5px] font-semibold transition-opacity hover:opacity-70"
                style={{ color: ACC.light }}
              >
                Open {weakest.name.toLowerCase()} →
              </button>
            </div>
          )}

          <div className={`${railCard} mb-3.5`}>
            <div className="mb-2 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Streak</div>
            <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
              {streak.currentStreak} day{streak.currentStreak === 1 ? '' : 's'}
              {streak.longestStreak > 0 && ` · longest ${streak.longestStreak}`}.
              {' '}A day counts once you finish anything at all — a few cards is enough.
              {streak.lastStudyDate === todayISO() ? " Today is already counted." : ' Nothing counted today yet.'}
            </p>
          </div>

          <div className={railCard}>
            <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Account</div>
            <div className="flex flex-col gap-2.5 text-[13px]">
              <div>
                <div className="text-[12px] text-[#4A5566] dark:text-gray-500">Name</div>
                <div className="font-medium text-[#16202F] dark:text-gray-200">{user.name}</div>
              </div>
              <div className="min-w-0">
                <div className="text-[12px] text-[#4A5566] dark:text-gray-500">Email</div>
                <div className="truncate font-medium text-[#16202F] dark:text-gray-200">{user.email}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#4A5566] dark:text-gray-500">Self-rated level</div>
                <div className="font-medium capitalize text-[#16202F] dark:text-gray-200">
                  {user.progress?.level || 'beginner'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
