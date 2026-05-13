import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

const EmailVerificationBanner: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if user is not authenticated, email is verified, or banner is dismissed
  if (!isAuthenticated || !user || user.emailVerified || isDismissed) {
    return null;
  }

  const resendVerification = async () => {
    try {
      setIsResending(true);
      setMessage('');
      
      const response = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Verification email sent! Please check your email.');
      } else {
        setMessage('❌ Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setMessage('❌ Network error. Please try again.');
    } finally {
      setIsResending(false);
      // Auto-hide message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="mb-4 rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-amber-800 dark:text-amber-200 leading-tight">Verify your email</p>
          <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-tight mt-0.5">
            Check <strong>{user.email}</strong> for your verification link
          </p>
          {message && (
            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200 mt-1">{message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={resendVerification}
            disabled={isResending}
            className="inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isResending ? (
              <><div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />Sending…</>
            ) : (
              <><Icon icon="refresh" className="w-3 h-3" />Resend</>
            )}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="w-7 h-7 flex items-center justify-center rounded-xl text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors"
            aria-label="Dismiss"
          >
            <Icon icon="x" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
