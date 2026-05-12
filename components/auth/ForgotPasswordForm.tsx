import { useState, FormEvent } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Props {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
        <div
          className="px-6 py-6 text-center"
          style={{ background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 60%, #06B6D4 100%)' }}
        >
          <div className="text-4xl mb-2">{sent ? '📬' : '🔐'}</div>
          <h2 className="text-2xl font-black text-white">
            {sent ? 'Check Your Email' : 'Forgot Password?'}
          </h2>
          <p className="text-white/70 text-sm mt-1">
            {sent ? 'We sent you a reset link' : "No worries, we'll send you a reset link"}
          </p>
        </div>

        <div className="px-6 py-6">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If <strong>{email}</strong> is registered, a password reset link has been sent. Check your inbox and spam folder.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                The link expires in 1 hour.
              </p>
              <button
                onClick={onBack}
                className="w-full py-3 text-white font-black rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  placeholder="you@email.com"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 text-white font-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending…
                  </span>
                ) : '📧 Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ← Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
