import { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../../contexts/ToastContext';

interface RegisterFormProps {
  onToggleMode?: () => void;
  onSuccess?: () => void;
}

export function RegisterForm({ onToggleMode, onSuccess }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { register, isLoading, error, clearError } = useAuth();
  const { showToast } = useToastContext();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword;
  const isFormValid = isNameValid && isEmailValid && isPasswordValid && passwordsMatch && acceptTerms;

  const pwStrength = password.length >= 8 ? 'strong' : password.length >= 6 ? 'good' : 'weak';
  const pwColor = pwStrength === 'strong' ? '#22C55E' : pwStrength === 'good' ? '#F59E0B' : '#EF4444';
  const pwLabel = pwStrength === 'strong' ? 'Strong' : pwStrength === 'good' ? 'Good' : 'Too short';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    if (!isNameValid)     { showToast('Name must be at least 2 characters', 'warning'); return; }
    if (!isEmailValid)    { showToast('Please enter a valid email address', 'warning'); return; }
    if (!isPasswordValid) { showToast('Password must be at least 6 characters', 'warning'); return; }
    if (!passwordsMatch)  { showToast('Passwords do not match', 'error'); return; }
    if (!acceptTerms)     { showToast('Please accept the terms and conditions', 'warning'); return; }

    const result = await register(name.trim(), email.trim().toLowerCase(), password);
    if (result.success) {
      showToast('Account created! Welcome to K-Learn! 🎉', 'success');
      onSuccess?.();
    } else {
      showToast(result.error || 'Registration failed. Please try again.', 'error');
    }
  };

  const inputBase = 'w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
        {/* Gradient header */}
        <div
          className="px-6 py-5 text-center"
          style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 50%, #EC4899 100%)' }}
        >
          <div className="text-4xl mb-2">🚀</div>
          <h2 className="text-2xl font-black text-white">Start Learning!</h2>
          <p className="text-white/70 text-sm mt-1">Join thousands of Korean learners</p>
        </div>

        <div className="px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`${inputBase} ${name && !isNameValid ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}
                placeholder="Your full name"
                required disabled={isLoading} minLength={2}
              />
              {name && !isNameValid && <p className="text-red-500 text-[11px] mt-1">Must be at least 2 characters</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`${inputBase} ${email && !isEmailValid ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}
                placeholder="you@email.com"
                required disabled={isLoading}
              />
              {email && (
                <p className={`text-[11px] mt-1 ${isEmailValid ? 'text-green-500' : 'text-red-500'}`}>
                  {isEmailValid ? '✓ Valid email' : '✗ Invalid email'}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`${inputBase} pr-10 border-gray-200 dark:border-gray-700`}
                  placeholder="••••••••"
                  required disabled={isLoading} minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" disabled={isLoading}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {password && (
                <div className="mt-1.5">
                  <div className="h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: pwStrength === 'strong' ? '100%' : pwStrength === 'good' ? '66%' : '33%', background: pwColor }} />
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: pwColor }}>{pwLabel} password</p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`${inputBase} ${confirmPassword && !passwordsMatch ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}
                placeholder="••••••••"
                required disabled={isLoading} minLength={6}
              />
              {confirmPassword && (
                <p className={`text-[11px] mt-1 ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords don\'t match'}
                </p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-pink-500"
                disabled={isLoading}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <a href="/terms" className="text-pink-500 hover:underline font-bold">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-pink-500 hover:underline font-bold">Privacy Policy</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full py-3 text-white font-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm"
              style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account…
                </span>
              ) : '🚀 Create Account'}
            </button>
          </form>

          {onToggleMode && (
            <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <button onClick={onToggleMode} className="font-black text-pink-500 dark:text-pink-400 hover:underline" disabled={isLoading}>
                Sign in here
              </button>
            </p>
          )}

          <p className="mt-4 text-center text-[11px] text-gray-400 dark:text-gray-500">
            🎉 Free to start · ⚡ Instant access · 🎯 No spam
          </p>
        </div>
      </div>
    </div>
  );
}
