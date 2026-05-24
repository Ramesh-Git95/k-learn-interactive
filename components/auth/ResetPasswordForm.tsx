import { useState, FormEvent } from 'react';
import { apiClient } from '../../services/apiClient';

interface Props {
  token: string;
  onSuccess: () => void;
}

export function ResetPasswordForm({ token, onSuccess }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.resetPassword(token, password);
      if (!result.success) {
        setError((result as any).error || 'Reset failed. The link may have expired.');
      } else {
        setDone(true);
      }
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          <div
            className="px-6 py-6 text-center"
            style={{ background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 60%, #06B6D4 100%)' }}
          >
            <div className="text-4xl mb-2">{done ? '✅' : '🔐'}</div>
            <h2 className="text-2xl font-black text-white">
              {done ? 'Password Reset!' : 'Set New Password'}
            </h2>
            <p className="text-white/70 text-sm mt-1">
              {done ? 'You can now sign in' : 'Choose a strong password'}
            </p>
          </div>

          <div className="px-6 py-6">
            {done ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your password has been reset successfully.
                </p>
                <button
                  onClick={onSuccess}
                  className="w-full py-3 text-white font-black rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                  style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
                >
                  Sign In Now →
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
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      minLength={6}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <p className={`text-xs mt-1 ${password.length >= 6 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {password.length >= 6 ? '✓ Good length' : `${6 - password.length} more characters needed`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  {confirm.length > 0 && (
                    <p className={`text-xs mt-1 ${password === confirm ? 'text-emerald-500' : 'text-red-400'}`}>
                      {password === confirm ? '✓ Passwords match' : 'Passwords do not match'}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="w-full py-3 text-white font-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                  style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting…
                    </span>
                  ) : '🔐 Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
