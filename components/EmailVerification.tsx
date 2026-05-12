import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

interface EmailVerificationProps {
  onVerified?: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ onVerified }) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resending'>('verifying');
  const [message, setMessage] = useState('Verifying your email address...');
  const [email, setEmail] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);
  const hasStartedRef = useRef(false); // Use ref to persist across renders
  
  // Get token from URL parameters - simplified
  const getTokenFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  };

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasStartedRef.current) {
      console.log('🛡️ Skipping duplicate effect call (React StrictMode)');
      return;
    }

    console.log('🎬 EmailVerification component mounted');
    console.log('🌐 Current URL:', window.location.href);
    
    const token = getTokenFromUrl();
    console.log('🎫 Extracted token:', token ? `${token.substring(0, 10)}...` : 'null');
    
    if (token) {
      console.log('✅ Token found, starting verification...');
      hasStartedRef.current = true; // Mark as started to prevent double execution
      verifyEmail(token);
    } else {
      console.log('❌ No token found in URL');
      setStatus('error');
      setMessage('No verification token found. Please use the complete verification link from your email.');
      setShowResendForm(true);
    }
  }, []); // Empty dependency array

  const verifyEmail = async (verificationToken: string) => {
    try {
      console.log('🔍 Starting email verification for token:', verificationToken);
      
      const response = await fetch(`http://localhost:5001/api/auth/verify-email/${verificationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 API Response status:', response.status);
      const data = await response.json();
      console.log('📋 API Response data:', data);

      if (response.ok) {
        console.log('✅ Verification successful');
        setStatus('success');
        setMessage(data.message || 'Email successfully verified! Welcome to K-Learn Interactive.');
        
        if (onVerified) {
          onVerified();
        }
        
        // Redirect to app after 2 seconds
        setTimeout(() => {
          window.location.href = '/?verified=true';
        }, 2000);
      } else {
        console.log('❌ Verification failed with status:', response.status);
        setStatus('error');
        setMessage(data.message || 'Email verification failed. The link may have expired.');
        setShowResendForm(true);
      }
    } catch (error) {
      console.error('🚨 Network/API error during verification:', error);
      setStatus('error');
      setMessage('Network error occurred. Please check your connection and try again.');
      setShowResendForm(true);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    try {
      setStatus('resending');
      
      const response = await fetch('http://localhost:5001/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Verification email sent! Please check your email and click the verification link.');
        setShowResendForm(false);
        setStatus('success');
      } else {
        setMessage(data.message || 'Failed to resend verification email');
        setStatus('error');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setMessage('Network error occurred. Please try again.');
      setStatus('error');
    }
  };

  const goHome = () => {
    window.location.href = '/';
  };

  const goToLogin = () => {
    window.location.href = '/?login=true';
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
      case 'resending':
        return <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>;
      case 'success':
        return <Icon icon="check" className="w-16 h-16 text-green-500 mx-auto mb-4" />;
      case 'error':
        return <Icon icon="x" className="w-16 h-16 text-red-500 mx-auto mb-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          {/* Status Icon */}
          {getStatusIcon()}
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {status === 'verifying' && '🔍 Verifying Email...'}
            {status === 'success' && '🎉 Email Verified!'}
            {status === 'error' && '⚠️ Verification Failed'}
            {status === 'resending' && '📧 Sending Email...'}
          </h1>
          
          {/* Message */}
          <p className={`text-lg mb-6 ${getStatusColor()}`}>
            {message}
          </p>
          
          {/* Success Actions */}
          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Redirecting to app in 2 seconds...
              </p>
              <button
                onClick={() => window.location.href = '/?verified=true'}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
              >
                Continue to App
              </button>
            </div>
          )}
          
          {/* Resend Form */}
          {showResendForm && status !== 'resending' && (
            <div className="space-y-4">
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Resend Verification Email
                </h3>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={resendVerification}
                  disabled={!email || status === 'resending'}
                  className="w-full mt-3 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend Verification Email
                </button>
              </div>
            </div>
          )}
          
          {/* Back to Home */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={goHome}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Having trouble? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
