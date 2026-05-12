import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const GUMROAD_URL = 'https://gumroad.com/l/klearn-lifetime';

const UserProfile: React.FC = () => {
  const { user, isAuthenticated, hasPremiumAccess } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <p className="text-gray-500 dark:text-gray-400">Please log in to view your profile.</p>
      </div>
    );
  }

  const isPremium = hasPremiumAccess();
  const subscriptionType = user.subscription?.type || 'free';
  const subscriptionStatus = user.subscription?.status || 'active';

  const stats = [
    { label: 'XP Points',     value: user.progress?.xp || 0,                           color: '#EC4899' },
    { label: 'Day Streak',    value: user.progress?.streak || 0,                        color: '#22C55E' },
    { label: 'Lessons Done',  value: user.progress?.completedLessons?.length || 0,      color: '#8B5CF6' },
    { label: 'Cards Learned', value: user.progress?.srsData?.totalCards || 0,           color: '#F59E0B' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-8 p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 60%, #06B6D4 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
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

          {user.subscription?.currentPeriodEnd && (
            <div className="flex justify-between text-xs mb-4">
              <span className="text-gray-500 dark:text-gray-400">Renewal Date:</span>
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
            </div>
          ) : (
            <div
              className="rounded-xl p-4"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.08))' }}
            >
              <p className="text-xs font-black text-violet-700 dark:text-violet-300 mb-1">Upgrade to Lifetime Access 🚀</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Unlock advanced features, unlimited quizzes, and detailed progress tracking.
              </p>
              <button
                onClick={() => window.open(GUMROAD_URL, '_blank')}
                className="w-full py-2 text-white text-xs font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
              >
                Get Lifetime Access — $39
              </button>
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
