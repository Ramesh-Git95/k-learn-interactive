import React, { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

// Where the link in the verification email lands.
//
// Adopted from the owner's design — "states the one thing to do and what still
// works meanwhile, so nobody is stuck on a dead end". An expired link is the
// most likely way to arrive here, so that path gets a way forward rather than
// just a red cross.
//
// Two corrections to the design: it says only cloud sync and bookmarks past
// fifteen are paused while unverified, but nothing is — emailVerified gates
// nothing in the app. And it offers to change the address, which
// PUT /auth/profile cannot do; it takes a name and preferences only.
//
// One bug fixed: a successful RESEND used to set status to 'success', the same
// state a completed verification uses, so resending a link told you your email
// was verified when it was not. The union already had an unused 'resent' state,
// which is plainly what was meant.

interface EmailVerificationProps {
  onVerified?: () => void;
}

type Status = 'verifying' | 'success' | 'error' | 'resending' | 'resent';

const FIELD =
  'kl-field h-11 w-full rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.18)] bg-[#FFFCF4] px-3.5 ' +
  'text-[15px] text-[#16202F] placeholder:text-[#8A93A0] focus:border-[#16202F] ' +
  'dark:border-gray-700 dark:bg-gray-900 dark:text-white';

const EmailVerification: React.FC<EmailVerificationProps> = ({ onVerified }) => {
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('Checking your link…');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('That link is missing its verification code. It may have been cut short by your email app.');
      setShowResendForm(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/verify-email/${verificationToken}`, { method: 'GET' });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Your email is confirmed.');
        onVerified?.();
        setTimeout(() => { window.location.href = '/?verified=true'; }, 2000);
      } else {
        setStatus('error');
        setMessage(data.message || 'This link has expired or has already been used. Links last 24 hours.');
        setShowResendForm(true);
      }
    } catch {
      setStatus('error');
      setMessage('Could not reach the server. Check your connection and try again.');
      setShowResendForm(true);
    }
  };

  const resendVerification = async () => {
    setFormError('');
    if (!email.trim()) {
      setFormError('Enter the address you signed up with.');
      return;
    }

    setStatus('resending');
    try {
      const response = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        // 'resent', NOT 'success' — nothing has been verified yet.
        setStatus('resent');
        setMessage(`A new link is on its way to ${email.trim()}.`);
        setShowResendForm(false);
      } else {
        setStatus('error');
        setMessage(data.message || 'Could not send a new link. Please try again shortly.');
        setShowResendForm(true);
      }
    } catch {
      setStatus('error');
      setMessage('Could not reach the server. Please try again.');
      setShowResendForm(true);
    }
  };

  const heading =
    status === 'success' ? 'You are all set'
    : status === 'resent' ? 'Check your inbox'
    : status === 'error' ? 'That link did not work'
    : 'One moment';

  const accent = status === 'success' ? '#2E6B59' : status === 'error' ? '#C13F22' : '#A8761F';
  const busy = status === 'verifying' || status === 'resending';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF5EB] px-4 py-12 dark:bg-[#0D141F]">
      <div className="kl-card w-full max-w-md rounded-[20px] px-6 py-7 sm:px-8">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl font-korean text-[19px] font-bold text-white"
          style={{ background: accent }}
        >
          한
        </span>

        <h1 className="mt-5 font-display text-[24px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
          {busy ? 'One moment' : heading}
        </h1>

        <p className="mt-2 text-[14px] leading-[1.6] text-[#3E4A5A] dark:text-gray-300">
          {busy ? 'Checking your link…' : message}
        </p>

        {status === 'success' && (
          <p className="mt-2 text-[13px] text-[#4A5566] dark:text-gray-400">
            Taking you back to the app…
          </p>
        )}

        {/* Nothing was ever withheld, so say so rather than implying a reward. */}
        {(status === 'resent' || status === 'error') && (
          <p className="mt-3 text-[12.5px] leading-[1.55] text-[#4A5566] dark:text-gray-400">
            Nothing is paused meanwhile — every part of the app keeps working without this. Links
            last 24 hours, and resending is always safe.
          </p>
        )}

        {busy && (
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
            <div className="kl-sweep h-full w-1/3 rounded-full" style={{ background: accent }} />
          </div>
        )}

        {showResendForm && !busy && (
          <div className="mt-5 border-t border-[rgba(20,32,47,0.12)] pt-5 dark:border-gray-800">
            <label className="mb-1.5 block text-[12.5px] font-semibold text-[#3E4A5A] dark:text-gray-300" htmlFor="verify-email">
              Send a new link
            </label>
            <input
              id="verify-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') resendVerification(); }}
              className={FIELD}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {formError && <p className="mt-1.5 text-[12px] text-[#C13F22]">{formError}</p>}
            <button
              onClick={resendVerification}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-[10px] text-[14px] font-bold text-white transition-transform hover:scale-[1.01]"
              style={{ background: '#C13F22' }}
            >
              Send it
            </button>
          </div>
        )}

        {!busy && (
          <div className="mt-5 flex flex-wrap gap-3 border-t border-[rgba(20,32,47,0.12)] pt-5 dark:border-gray-800">
            <button
              onClick={() => { window.location.href = '/'; }}
              className="flex h-11 flex-1 items-center justify-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-4 text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
            >
              Keep learning without it
            </button>
            <button
              onClick={() => { window.location.href = '/?login=true'; }}
              className="flex h-11 items-center justify-center px-3 text-[13.5px] font-semibold text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200"
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
