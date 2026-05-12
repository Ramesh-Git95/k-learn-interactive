import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

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
      
      const response = await fetch('http://localhost:5001/api/auth/resend-verification', {
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
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon icon="mail" className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                📧 Please verify your email address
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                We sent a verification email to <strong>{user.email}</strong>. 
                Please check your email and click the verification link to access all features.
              </p>
              
              {message && (
                <p className="mt-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {message}
                </p>
              )}
              
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={resendVerification}
                  disabled={isResending}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-800/30 hover:bg-yellow-200 dark:hover:bg-yellow-700/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-800 border-t-transparent mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Icon icon="refresh" className="h-4 w-4 mr-1" />
                      Resend Email
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setIsDismissed(true)}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
            
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setIsDismissed(true)}
                  className="inline-flex rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-800/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600 transition-colors"
                >
                  <span className="sr-only">Dismiss</span>
                  <Icon icon="x" className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
