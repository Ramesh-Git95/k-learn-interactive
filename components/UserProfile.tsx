import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { GUMROAD_URL } from '../constants';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

const UserProfile: React.FC = () => {
  const { user, isAuthenticated, hasPremiumAccess, refreshUser } = useAuth();
  const { showToast } = useToastContext();
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [claimStep, setClaimStep] = useState<'email' | 'code'>('email');
  const [claimLoading, setClaimLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const isPremiumRef = React.useRef(false);
  const pollCountRef = React.useRef(0);
  // refreshUser/showToast are rebuilt every render (unmemoized context values).
  // Hold them in refs so the polling effect can depend only on [isPolling] —
  // otherwise each poll's re-render restarts the interval and resets the count,
  // defeating the 5-minute cap and polling forever.
  const refreshUserRef = React.useRef(refreshUser);
  const showToastRef = React.useRef(showToast);

  // Keep refs in sync so the polling interval always reads the latest values
  isPremiumRef.current = hasPremiumAccess();
  refreshUserRef.current = refreshUser;
  showToastRef.current = showToast;

  // Poll every 5 s (max 5 min) after user clicks the Gumroad button
  React.useEffect(() => {
    if (!isPolling) return;
    pollCountRef.current = 0;
    const interval = setInterval(async () => {
      pollCountRef.current += 1;
      await refreshUserRef.current();
      if (isPremiumRef.current) {
        clearInterval(interval);
        setIsPolling(false);
        showToastRef.current('🎉 Your account has been upgraded to Premium!', 'success');
        return;
      }
      if (pollCountRef.current >= 60) {   // 60 × 5 s = 5 min
        clearInterval(interval);
        setIsPolling(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isPolling]);

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
  // The Stripe test button is hidden unless the URL has ?stripetest=1, so it can
  // ship to production safely while we verify Stripe — real users never see it.
  const showStripeTest = new URLSearchParams(window.location.search).has('stripetest');
  const subscriptionType = user.subscription?.type || 'free';
  const subscriptionStatus = user.subscription?.status || 'active';

  const stats = [
    { label: 'XP Points',     value: user.progress?.xp || 0,                           color: '#EC4899' },
    { label: 'Day Streak',    value: user.progress?.streak || 0,                        color: '#22C55E' },
    { label: 'Lessons Done',  value: user.progress?.completedLessons?.length || 0,      color: '#8B5CF6' },
    { label: 'Cards Learned', value: user.progress?.srsData?.totalCards || 0,           color: '#F59E0B' },
  ];

  // STRIPE (Step 1) — create a checkout session and redirect to Stripe's hosted page.
  // Additive/test button; the Gumroad flow above is untouched.
  const startStripeCheckout = async () => {
    setStripeLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('💳 [STRIPE] requesting checkout session…');
      const res = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('💳 [STRIPE] response:', res.status, data);
      if (res.ok && data.url) {
        window.location.href = data.url; // redirect to Stripe hosted checkout
      } else {
        showToast(data.message || 'Could not start Stripe checkout.', 'error');
        setStripeLoading(false);
      }
    } catch (e) {
      console.error('💳 [STRIPE] checkout error:', e);
      showToast('Network error starting checkout.', 'error');
      setStripeLoading(false);
    }
  };

  // STRIPE (3c) — open the Customer Portal to manage / cancel the subscription.
  const openBillingPortal = async () => {
    setStripeLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🧾 [STRIPE] requesting billing portal…');
      const res = await fetch(`${API_BASE}/stripe/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  const redeemLicense = async () => {
    if (!licenseKey.trim()) return;
    setLicenseLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/gumroad/verify-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ licenseKey: licenseKey.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        showToast('🎉 License verified! You now have Premium access.', 'success');
        setLicenseKey('');
      } else {
        showToast(data.message || 'Invalid license key. Please try again.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLicenseLoading(false);
    }
  };

  const sendClaimCode = async () => {
    if (!claimEmail.trim()) return;
    setClaimLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/gumroad/send-claim-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ purchaseEmail: claimEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setClaimStep('code');
        showToast(`Code sent to ${claimEmail.trim()}. Check your inbox.`, 'success');
      } else if (data.error === 'NOT_FOUND') {
        showToast('No purchase found for that email. Check the exact email on your Gumroad receipt.', 'error');
      } else {
        showToast(data.message || 'Could not send code. Please try again.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setClaimLoading(false);
    }
  };

  const claimPurchase = async () => {
    if (!claimCode.trim()) return;
    setClaimLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/gumroad/claim-purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ purchaseEmail: claimEmail.trim(), code: claimCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        showToast('🎉 Purchase verified! You now have Premium access.', 'success');
        setShowClaimForm(false);
        setClaimEmail('');
        setClaimCode('');
        setClaimStep('email');
      } else if (data.error === 'INVALID_CODE') {
        showToast('Invalid or expired code. Request a new one.', 'error');
      } else {
        showToast(data.message || 'Could not verify. Please try again.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setClaimLoading(false);
    }
  };

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
              {/* TEMP — Stripe subscription management, hidden behind ?stripetest=1.
                  Once a cancellation is scheduled, show the end date instead of the button. */}
              {showStripeTest && (
                user.subscription?.cancelAtPeriodEnd ? (
                  <div className="mt-3 px-3 py-2 rounded-xl bg-amber-100/60 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                      ⏳ Cancels on {user.subscription.currentPeriodEnd
                        ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
                        : 'period end'} — you keep Premium until then.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={openBillingPortal}
                    disabled={stripeLoading}
                    className="w-full mt-3 py-2 text-xs font-black rounded-xl border-2 border-dashed border-indigo-400 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-40"
                  >
                    {stripeLoading ? 'Opening…' : '🧾 Cancel subscription'}
                  </button>
                )
              )}
            </div>
          ) : (
            <div
              className="rounded-xl p-4"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.08))' }}
            >
              <p className="text-xs font-black text-violet-700 dark:text-violet-300 mb-1">Upgrade to Lifetime Access 🚀</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Unlock unlimited AI conversations, advanced SRS, and detailed analytics.
              </p>
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-2.5 mb-3">
                <p className="text-[11px] text-violet-600 dark:text-violet-400 font-bold">
                  ⚠️ Use <strong>{user.email}</strong> when purchasing — your account upgrades automatically.
                </p>
              </div>
              <button
                onClick={() => { window.open(GUMROAD_URL, '_blank'); setIsPolling(true); }}
                className="w-full py-2 text-white text-xs font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
              >
                Get Lifetime Access
              </button>

              {/* TEMP — Stripe test button, hidden behind ?stripetest=1 (remove once Stripe is the default) */}
              {showStripeTest && (
                <button
                  onClick={startStripeCheckout}
                  disabled={stripeLoading}
                  className="w-full mt-2 py-2 text-xs font-black rounded-xl border-2 border-dashed border-indigo-400 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-40"
                >
                  {stripeLoading ? 'Starting Stripe…' : '🧪 Test Stripe Checkout'}
                </button>
              )}

              {isPolling && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20">
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse flex-shrink-0" />
                  <p className="text-[11px] text-violet-600 dark:text-violet-400 font-bold">
                    Waiting for purchase confirmation… upgrading automatically
                  </p>
                </div>
              )}

              {/* Already purchased section */}
              <div className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-800/30">
                <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Already purchased?
                </p>
                <button
                  onClick={async () => { setLicenseLoading(true); await refreshUser(); setLicenseLoading(false); showToast('Subscription status refreshed.', 'info'); }}
                  disabled={licenseLoading}
                  className="w-full py-2 text-xs font-black rounded-xl border-2 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all disabled:opacity-40 mb-2"
                >
                  {licenseLoading ? 'Checking…' : '🔄 Check upgrade status'}
                </button>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mb-3">
                  Click after purchase to refresh your account status
                </p>

                {/* Different email claim */}
                <button
                  onClick={() => { setShowClaimForm(v => !v); setClaimStep('email'); setClaimCode(''); }}
                  className="w-full py-1.5 text-[11px] font-black rounded-lg text-violet-600 dark:text-violet-400 hover:underline mb-2 text-left"
                >
                  {showClaimForm ? '▲ Hide' : '▼ Used a different email?'}
                </button>
                {showClaimForm && (
                  <div className="mb-3">
                    {claimStep === 'email' ? (
                      <>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">
                          Enter the email you used on Gumroad. We'll send a verification code to confirm you own it.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={claimEmail}
                            onChange={e => setClaimEmail(e.target.value)}
                            placeholder="Gumroad purchase email"
                            className="flex-1 px-3 py-2 text-xs rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-violet-400"
                            disabled={claimLoading}
                          />
                          <button
                            onClick={sendClaimCode}
                            disabled={!claimEmail.trim() || claimLoading}
                            className="px-3 py-2 text-white text-xs font-black rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
                          >
                            {claimLoading ? '…' : 'Send Code'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">
                          Enter the 6-digit code sent to <strong className="text-gray-700 dark:text-gray-300">{claimEmail}</strong>:
                        </p>
                        <div className="flex gap-2 mb-1.5">
                          <input
                            type="text"
                            value={claimCode}
                            onChange={e => setClaimCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="123456"
                            className="flex-1 px-3 py-2 text-xs rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono tracking-widest focus:outline-none focus:border-violet-400"
                            disabled={claimLoading}
                            maxLength={6}
                          />
                          <button
                            onClick={claimPurchase}
                            disabled={claimCode.length !== 6 || claimLoading}
                            className="px-3 py-2 text-white text-xs font-black rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
                          >
                            {claimLoading ? '…' : 'Verify'}
                          </button>
                        </div>
                        <button
                          onClick={() => { setClaimStep('email'); setClaimCode(''); }}
                          className="text-[10px] text-violet-500 dark:text-violet-400 hover:underline"
                        >
                          ← Change email / resend code
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* License key fallback */}
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">Or enter your license key if you have one:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={e => setLicenseKey(e.target.value)}
                    placeholder="Paste license key here"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-violet-400"
                    disabled={licenseLoading}
                  />
                  <button
                    onClick={redeemLicense}
                    disabled={!licenseKey.trim() || licenseLoading}
                    className="px-3 py-2 text-white text-xs font-black rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
                  >
                    {licenseLoading ? '…' : 'Redeem'}
                  </button>
                </div>
              </div>
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
