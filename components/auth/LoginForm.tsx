import { useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../../contexts/ToastContext';
import { ForgotPasswordForm } from './ForgotPasswordForm';

// Sign-in. Bare form rather than its own card: AuthModal supplies the surface
// and the tabs now, and a card inside a card was two borders around one thing.

interface LoginFormProps {
  onToggleMode?: () => void;
  onSuccess?: () => void;
}

const FIELD =
  'kl-field h-11 w-full rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.18)] bg-[#FFFCF4] px-3.5 ' +
  'text-[15px] text-[#16202F] placeholder:text-[#8A93A0] focus:border-[#16202F] ' +
  'dark:border-gray-700 dark:bg-gray-900 dark:text-white';

const LABEL = 'mb-1.5 block text-[12.5px] font-semibold text-[#3E4A5A] dark:text-gray-300';

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
    if (!email || !password) { showToast('Please fill in both fields', 'warning'); return; }

    const result = await login(email, password);
    if (result.success) {
      showToast('Welcome back', 'success');
      onSuccess?.();
    } else {
      showToast(result.error || 'Could not sign you in. Please try again.', 'error');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-5">
        <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
          Welcome back
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-[1.55] text-[#4A5566] dark:text-gray-400">
          Your streak, decks and progress are where you left them.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div
            className="rounded-[10px] border px-3.5 py-2.5 text-[13px]"
            style={{ borderColor: 'rgba(193,63,34,0.35)', background: 'rgba(193,63,34,0.08)', color: '#C13F22' }}
          >
            {error}
          </div>
        )}

        <div>
          <label className={LABEL} htmlFor="login-email">Email</label>
          <input
            id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            className={FIELD} placeholder="you@example.com"
            required disabled={isLoading} autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label className={LABEL} htmlFor="login-password">Password</label>
            <button
              type="button" onClick={() => setShowPassword(v => !v)} disabled={isLoading}
              className="mb-1.5 text-[12.5px] font-semibold text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            id="login-password" type={showPassword ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)}
            className={FIELD} placeholder="Your password"
            required disabled={isLoading} autoComplete="current-password"
          />
          <button
            type="button" onClick={() => setShowForgot(true)} disabled={isLoading}
            className="mt-2 text-[12.5px] font-semibold text-[#C13F22] hover:underline dark:text-[#F5825E]"
          >
            Forgot your password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-12 w-full items-center justify-center rounded-[11px] text-[15px] font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
          style={{ background: '#C13F22', boxShadow: '0 8px 24px -14px #C13F22' }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Signing you in…
            </span>
          ) : 'Sign in'}
        </button>
      </form>

      {onToggleMode && (
        <p className="mt-4 text-center text-[13px] text-[#4A5566] dark:text-gray-400">
          New here?{' '}
          <button
            onClick={onToggleMode} disabled={isLoading}
            className="font-semibold text-[#C13F22] hover:underline dark:text-[#F5825E]"
          >
            Create an account
          </button>
        </p>
      )}
    </div>
  );
}
