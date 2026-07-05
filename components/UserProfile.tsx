import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { useUpgrade } from '../hooks/useUpgrade';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

const UserProfile: React.FC = () => {
  const { user, isAuthenticated, hasPremiumAccess, refreshUser } = useAuth();
  const { showToast } = useToastContext();
  const { startUpgrade } = useUpgrade();
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

  if (!isAuthenticated || !user) {
    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <p className="text-gray-500 dark:text-gray-400">Please log in to view your profile.</p>
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

  const stats = [
    { label: 'XP Points',     value: user.progress?.xp || 0,                           color: '#EC4899' },
    { label: 'Day Streak',    value: user.progress?.streak || 0,                        color: '#22C55E' },
    { label: 'Lessons Done',  value: user.progress?.completedLessons?.length || 0,      color: '#8B5CF6' },
    { label: 'Cards Learned', value: user.progress?.srsData?.totalCards || 0,           color: '#F59E0B' },
  ];


  // Open the Stripe Customer Portal — 'cancel' jumps straight into the
  // cancellation flow; 'manage' opens the general portal (update card,
  // invoices, resume a scheduled cancellation).
  const openBillingPortal = async (flow: 'cancel' | 'manage' = 'manage') => {
    setStripeLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🧾 [STRIPE] requesting billing portal…', flow);
      const res = await fetch(`${API_BASE}/stripe/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ flow }),
      });
      const data = await res.json();
      console.log('🧾 [STRIPE] portal response:', res.status, data);
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.message || 'Could not open billing portal.', 'error');
        setStripeLoading(false);
      }
    } catch (e) {
      console.error('🧾 [STRIPE] portal error:', e);
      showToast('Network error opening billing portal.', 'error');
      setStripeLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-8 p-6 sm:p-8"
        style={{ background: 'var(--brand-gradient-hero)' }}
      >
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {['프로필','학습','진행','한국어'].map((w, i) => (
            <span key={i} className="absolute text-white/10 font-black" style={{ fontSize: `${1.2 + (i % 2) * 0.5}rem`, top: `${(i * 37) % 85}%`, left: `${(i * 43) % 80}%` }}>{w}</span>
          ))}
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-4xl">👤</span>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-white">{user.name}</h1>
            <p className="text-white/70 text-sm mt-0.5">{user.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span
                className="text-xs font-black px-2.5 py-0.5 rounded-full text-white"
                style={{ background: isPremium ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'rgba(255,255,255,0.2)' }}
              >
                {isPremium ? '⭐ PREMIUM' : '🆓 FREE PLAN'}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                subscriptionStatus === 'active'
                  ? 'bg-green-500/30 text-white'
                  : 'bg-red-500/30 text-white'
              }`}>
                {subscriptionStatus.toUpperCase()}
              </span>
              <span className="text-xs text-white/60 capitalize">{user.progress?.level || 'Beginner'} level</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Account info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h2 className="text-base font-black text-gray-900 dark:text-white mb-4">Account Information</h2>
          <div className="space-y-3">
            {[
              { label: 'Name',  value: user.name },
              { label: 'Email', value: user.email },
              { label: 'Level', value: user.progress?.level || 'Beginner', capitalize: true },
            ].map(({ label, value, capitalize }) => (
              <div key={label}>
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                <p className={`text-sm font-bold text-gray-900 dark:text-white ${capitalize ? 'capitalize' : ''}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h2 className="text-base font-black text-gray-900 dark:text-white mb-4">Subscription Status</h2>

          <div className="flex items-center gap-2 mb-4">
            <span
              className="text-xs font-black px-2.5 py-0.5 rounded-full text-white"
              style={{ background: isPremium ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'linear-gradient(135deg,#9CA3AF,#6B7280)' }}
            >
              {isPremium ? '⭐' : '🆓'} {subscriptionType.toUpperCase()} PLAN
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
              subscriptionStatus === 'active'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {subscriptionStatus.toUpperCase()}
            </span>
          </div>

          {isPremium && user.subscription?.currentPeriodEnd && (
            <div className="flex justify-between text-xs mb-4">
              <span className="text-gray-500 dark:text-gray-400">
                {user.subscription?.cancelAtPeriodEnd ? 'Access until:' : 'Renewal Date:'}
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
          )}

          {isPremium ? (
            <div
              className="rounded-xl p-3"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(234,88,12,0.1))' }}
            >
              <p className="text-xs font-black text-amber-700 dark:text-amber-300 mb-2">✨ Premium Benefits Active</p>
              <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5">
                {['Unlimited quiz attempts','Advanced learning analytics','Premium content access','Priority support'].map(b => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
              {/* Stripe subscription management — only for Stripe subscribers. */}
              {hasStripeSub && (
                user.subscription?.cancelAtPeriodEnd ? (
                  <div className="mt-3">
                    <div className="px-3 py-2 rounded-xl bg-amber-100/60 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 mb-2">
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                        ⏳ Cancels on {user.subscription.currentPeriodEnd
                          ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
                          : 'period end'} — you keep Premium until then.
                      </p>
                    </div>
                    <button
                      onClick={() => openBillingPortal('manage')}
                      disabled={stripeLoading}
                      className="w-full py-2 text-xs font-black rounded-xl border-2 border-emerald-400 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all disabled:opacity-40"
                    >
                      {stripeLoading ? 'Opening…' : '↻ Resume subscription'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3">
                    <button
                      onClick={() => openBillingPortal('manage')}
                      disabled={stripeLoading}
                      className="w-full py-2 text-xs font-black rounded-xl border-2 border-indigo-400 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-40"
                    >
                      {stripeLoading ? 'Opening…' : '💳 Manage billing / update card'}
                    </button>
                    <button
                      onClick={() => openBillingPortal('cancel')}
                      disabled={stripeLoading}
                      className="w-full mt-1.5 py-1.5 text-[11px] font-bold text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      Cancel subscription
                    </button>
                  </div>
                )
              )}
            </div>
          ) : (
            <div
              className="rounded-xl p-4"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.08))' }}
            >
              <p className="text-sm font-black text-gray-900 dark:text-white mb-1">You're on the Free plan 🆓</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Here's what Premium unlocks:</p>
              <ul className="space-y-1.5 mb-4">
                {([
                  { icon: '🎬', label: 'K-Drama & K-Pop vocab packs' },
                  { icon: '🤖', label: '50 AI chats a day', sub: 'you get 5' },
                  { icon: '🧠', label: 'Unlimited quizzes & TOPIK prep' },
                  { icon: '🎴', label: 'All 24 Culture Cards + Honorifics' },
                  { icon: '♾️', label: 'Unlimited bookmarks + cloud sync' },
                ] as { icon: string; label: string; sub?: string }[]).map(({ icon, label, sub }) => (
                  <li key={label} className="flex items-center gap-2 text-xs">
                    <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">🔒</span>
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">{icon} {label}</span>
                    {sub && <span className="text-[10px] text-gray-400 dark:text-gray-500">({sub})</span>}
                  </li>
                ))}
              </ul>
              <button
                onClick={startUpgrade}
                className="w-full py-2.5 text-sm font-black rounded-xl btn-brand"
              >
                Unlock all — $4/month
              </button>
              <p className="text-center text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                ☕ Less than a coffee · cancel anytime
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress stats */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h2 className="text-base font-black text-gray-900 dark:text-white mb-4">Learning Progress</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-black mb-1" style={{ color }}>{value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
