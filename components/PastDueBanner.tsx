import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// App-wide failed-payment banner. Stripe keeps past_due subscribers on Premium
// during its retry window; without a visible prompt they churn silently when
// the window ends. Renders on every section while status is past_due (the
// profile has a matching banner, but past-due users rarely open the profile).
export default function PastDueBanner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  if (user?.subscription?.status !== 'past_due') return null;

  const openPortal = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/stripe/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ flow: 'manage' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      console.error('PastDueBanner: portal failed', res.status, data);
      setFailed(true);
    } catch {
      setFailed(true);
    }
    setLoading(false);
  };

  return (
    <div className="mb-4 flex items-center gap-3 flex-wrap rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3">
      <span className="text-xl flex-shrink-0" aria-hidden="true">⚠️</span>
      <p className="flex-1 min-w-[220px] text-sm text-red-800 dark:text-red-200">
        <strong className="font-black">Your last payment didn't go through.</strong>{' '}
        Update your card to keep Premium — access ends when the retry window closes.
      </p>
      <button
        onClick={openPortal}
        disabled={loading}
        className="flex-shrink-0 px-4 py-2 text-xs font-black rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Opening…' : '💳 Update payment method'}
      </button>
      {failed && (
        <p className="w-full text-xs text-red-600 dark:text-red-300">
          Couldn't open the billing portal — please try again, or manage billing from your Profile.
        </p>
      )}
    </div>
  );
}
