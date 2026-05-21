import { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../../contexts/ToastContext';
import { ForgotPasswordForm } from './ForgotPasswordForm';

interface LoginFormProps {
  onToggleMode?: () => void;
  onSuccess?: () => void;
}

export function LoginForm({ onToggleMode, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const { showToast } = useToastContext();

  if (showForgot) return <ForgotPasswordForm onBack={() => setShowForgot(false)} />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    if (!email || !password) { showToast('Please fill in all fields', 'warning'); return; }
    const result = await login(email, password);
    if (result.success) {
      showToast('Welcome back! 🎉', 'success');
      onSuccess?.();
    } else {
      showToast(result.error || 'Login failed. Please try again.', 'error');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
        {/* Gradient header */}
        <div
          className="px-6 py-6 text-center"
          style={{ background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 60%, #06B6D4 100%)' }}
        >
          <div className="text-4xl mb-2">👋</div>
          <h2 className="text-2xl font-black text-white">Welcome Back!</h2>
          <p className="text-white/70 text-sm mt-1">Continue your Korean learning journey</p>
        </div>

        <div className="px-6 py-6">
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
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-pink-500 dark:text-pink-400 hover:underline font-semibold"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-base"
                  disabled={isLoading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3 text-white font-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm"
              style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing In…
                </span>
              ) : '🎯 Sign In'}
            </button>
          </form>

          {onToggleMode && (
            <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={onToggleMode}
                className="font-black text-pink-500 dark:text-pink-400 hover:underline"
                disabled={isLoading}
              >
                Sign up here
              </button>
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
