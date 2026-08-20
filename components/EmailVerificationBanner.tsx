import React, { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

// Shown on every page until the address is confirmed.
//
// The owner's design brief for this screen is "states the one thing to do and
// what still works meanwhile, so nobody is stuck on a dead end", and the second
// half is the part that was missing. A standing amber bar with no statement of
// consequence reads as a warning, and a warning with no stated cost is worse
// than none — people assume the worst and go looking for what they have lost.
//
// Two things in that design are not repeated here. It says only cloud sync and
// bookmarks past fifteen are paused; nothing is, in fact — emailVerified is
// checked in exactly one place in the whole frontend, which is this component
// deciding whether to render. And it offers to change the address, which
// PUT /auth/profile cannot do: it accepts a name and preferences only.
//
// The 24-hour expiry is real — User.js sets emailVerificationExpires to
// Date.now() + 24 * 60 * 60 * 1000.

type Status = null | { kind: 'sent' | 'error'; text: string };

const EmailVerificationBanner: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isAuthenticated || !user || user.emailVerified || isDismissed) return null;

  const resendVerification = async () => {
    setIsResending(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await response.json().catch(() => ({}));
      setStatus(
        response.ok
          ? { kind: 'sent', text: 'Sent. It should arrive within a minute.' }
          : { kind: 'error', text: data.message || 'Could not send it. Please try again shortly.' },
      );
    } catch {
      setStatus({ kind: 'error', text: 'Could not reach the server. Please try again.' });
    } finally {
      setIsResending(false);
      window.setTimeout(() => setStatus(null), 6000);
    }
  };

  return (
    <div
      className="mb-4 overflow-hidden rounded-[14px] border px-4 py-3.5"
      style={{ borderColor: 'rgba(168,118,31,0.35)', background: 'rgba(168,118,31,0.07)' }}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span
          className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px]"
          style={{ background: 'rgba(168,118,31,0.14)' }}
        >
          <Mail className="h-4 w-4" style={{ color: '#A8761F' }} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-[#16202F] dark:text-white">
            Confirm your email to finish setting up
          </p>
          <p className="mt-0.5 text-[13px] leading-[1.55] text-[#3E4A5A] dark:text-gray-300">
            We sent a link to{' '}
            <strong className="font-semibold text-[#16202F] dark:text-white">{user.email}</strong>.
            Open it and you are done — there is nothing else to fill in.
          </p>
          {/* The reassurance, which is the whole point of the banner saying
              anything at all rather than just glowing amber. */}
          <p className="mt-1.5 text-[12.5px] leading-[1.5] text-[#4A5566] dark:text-gray-400">
            Nothing is paused meanwhile — every part of the app keeps working. The link lasts 24
            hours, and resending is always safe.
          </p>

          {status && (
            <p
              className="mt-2 text-[12.5px] font-semibold"
              role="status"
              style={{ color: status.kind === 'sent' ? '#2E6B59' : '#C13F22' }}
            >
              {status.text}
            </p>
          )}
        </div>

        <div className="ml-auto flex flex-none items-center gap-2">
          <button
            onClick={resendVerification}
            disabled={isResending}
            className="flex h-9 items-center rounded-[9px] px-3.5 text-[12.5px] font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: '#A8761F' }}
          >
            {isResending ? 'Sending…' : 'Resend the link'}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="flex h-9 w-9 items-center justify-center rounded-[9px] text-[#4A5566] transition-colors hover:bg-[rgba(20,32,47,0.06)] hover:text-[#16202F] dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Dismiss until next visit"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
