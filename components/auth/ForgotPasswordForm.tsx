import { useState, type FormEvent } from 'react';
import { apiClient } from '../../services/apiClient';

// Password reset request. Bare form rather than its own card: AuthModal supplies
// the surface, and the old gradient header sat inside it as a card within a card.

interface Props {
  onBack: () => void;
}

const FIELD =
  'kl-field h-11 w-full rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.18)] bg-[#FFFCF4] px-3.5 ' +
  'text-[15px] text-[#16202F] placeholder:text-[#8A93A0] focus:border-[#16202F] ' +
  'dark:border-gray-700 dark:bg-gray-900 dark:text-white';

const LABEL = 'mb-1.5 block text-[12.5px] font-semibold text-[#3E4A5A] dark:text-gray-300';

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
      const result = await apiClient.forgotPassword(email);
      if (!result.success) {
        setError((result as any).error || 'Something went wrong. Please try again.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full">
        <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
          Check your email
        </h2>
        <p className="mt-2 text-[13.5px] leading-[1.6] text-[#3E4A5A] dark:text-gray-400">
          If an account exists for <strong className="font-semibold text-[#16202F] dark:text-white">{email}</strong>,
          a reset link is on its way. It is good for one hour.
        </p>
        <p className="mt-3 text-[12.5px] leading-[1.55] text-[#4A5566] dark:text-gray-500">
          Nothing after a minute or two? Check the spam folder — and that the address above is the
          one you signed up with.
        </p>
        <button
          onClick={onBack}
          className="mt-5 flex h-11 w-full items-center justify-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] text-[14px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-5">
        <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
          Reset your password
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-[1.55] text-[#4A5566] dark:text-gray-400">
          Tell us the email you signed up with and we will send you a link.
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
          <label className={LABEL} htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            className={FIELD} placeholder="you@example.com"
            required disabled={loading} autoComplete="email" autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="flex h-12 w-full items-center justify-center rounded-[11px] text-[15px] font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
          style={{ background: '#C13F22', boxShadow: '0 8px 24px -14px #C13F22' }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Sending…
            </span>
          ) : 'Send the reset link'}
        </button>
      </form>

      <button
        onClick={onBack}
        className="mt-4 w-full text-center text-[13px] font-semibold text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200"
      >
        Back to sign in
      </button>
    </div>
  );
}
