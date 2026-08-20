import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../../contexts/ToastContext';
import FooterPageModal, { type FooterPage } from '../FooterPageModal';

// Sign-up.
//
// Adopted from the owner's design, whose brief is the point of it: "requirements
// listed before you type rather than as red errors after". So the password rules
// are printed under the field from the start and tick over as they are met,
// instead of the form waiting for a mistake and then colouring it red.
//
// Two things in that design are not built. There is no "Continue with Google" —
// the backend has twelve auth routes and none of them is OAuth, so the button
// would be a door to nowhere. And its stated rules were "8+ characters, one
// number, one letter"; ours are 8 and a number, which is what routes/auth.js
// now actually enforces. A form may only promise what the server checks.

interface RegisterFormProps {
  onToggleMode?: () => void;
  onSuccess?: () => void;
}

const FIELD =
  'kl-field h-11 w-full rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.18)] bg-[#FFFCF4] px-3.5 ' +
  'text-[15px] text-[#16202F] placeholder:text-[#8A93A0] focus:border-[#16202F] ' +
  'dark:border-gray-700 dark:bg-gray-900 dark:text-white';

const LABEL = 'mb-1.5 block text-[12.5px] font-semibold text-[#3E4A5A] dark:text-gray-300';

export function RegisterForm({ onToggleMode, onSuccess }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  // Opened in place rather than linked away: asking someone to agree to terms
  // they cannot read without abandoning a half-filled form is not really asking.
  // The old links pointed at /terms and /privacy, which do not exist — this is a
  // hash-routed SPA, so both were dead.
  const [legal, setLegal] = useState<FooterPage | null>(null);
  const { register, isLoading, error, clearError } = useAuth();
  const { showToast } = useToastContext();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = emailRegex.test(email);

  // Mirrors passwordProblem() in backend/routes/auth.js. If that changes, this
  // has to change with it — the form must not claim a rule the server does not
  // apply, nor withhold one it does.
  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const isPasswordValid = hasLength && hasNumber;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isFormValid = isNameValid && isEmailValid && isPasswordValid && passwordsMatch && acceptTerms;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    if (!isNameValid)     { showToast('Your name needs at least 2 characters', 'warning'); return; }
    if (!isEmailValid)    { showToast('That email address does not look right', 'warning'); return; }
    if (!hasLength)       { showToast('Your password needs at least 8 characters', 'warning'); return; }
    if (!hasNumber)       { showToast('Your password needs at least one number', 'warning'); return; }
    if (!passwordsMatch)  { showToast('The two passwords do not match', 'error'); return; }
    if (!acceptTerms)     { showToast('Please accept the terms to continue', 'warning'); return; }

    const result = await register(name.trim(), email.trim().toLowerCase(), password);
    if (result.success) {
      showToast('Account created — welcome to K-Learn', 'success');
      onSuccess?.();
    } else {
      showToast(result.error || 'Could not create the account. Please try again.', 'error');
    }
  };

  const Rule = ({ met, children }: { met: boolean; children: React.ReactNode }) => (
    <span
      className="inline-flex items-center gap-1.5 text-[12px] transition-colors"
      style={{ color: met ? '#2E6B59' : undefined }}
    >
      <span
        className="flex h-3.5 w-3.5 flex-none items-center justify-center rounded-full border transition-colors"
        style={{
          borderColor: met ? '#2E6B59' : 'rgba(20,32,47,0.28)',
          background: met ? '#2E6B59' : 'transparent',
        }}
      >
        {met && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
      </span>
      <span className={met ? '' : 'text-[#4A5566] dark:text-gray-400'}>{children}</span>
    </span>
  );

  return (
    <div className="w-full">
      <div className="mb-5">
        <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
          Start free — no card needed
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-[1.55] text-[#4A5566] dark:text-gray-400">
          Your progress syncs across devices once you verify your email.
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
          <label className={LABEL} htmlFor="reg-name">Your name</label>
          <input
            id="reg-name" type="text" value={name} onChange={e => setName(e.target.value)}
            className={FIELD} placeholder="What should we call you?"
            required disabled={isLoading} autoComplete="name"
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="reg-email">Email</label>
          <input
            id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            className={FIELD} placeholder="you@example.com"
            required disabled={isLoading} autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label className={LABEL} htmlFor="reg-password">Password</label>
            <button
              type="button" onClick={() => setShowPassword(v => !v)} disabled={isLoading}
              className="mb-1.5 text-[12.5px] font-semibold text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            id="reg-password" type={showPassword ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)}
            className={FIELD} placeholder="At least 8 characters"
            required disabled={isLoading} autoComplete="new-password"
            aria-describedby="reg-password-rules"
          />
          {/* Printed from the start, not produced by failing. */}
          <div id="reg-password-rules" className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            <Rule met={hasLength}>8 or more characters</Rule>
            <Rule met={hasNumber}>at least one number</Rule>
          </div>
        </div>

        <div>
          <label className={LABEL} htmlFor="reg-confirm">Repeat password</label>
          <input
            id="reg-confirm" type={showPassword ? 'text' : 'password'} value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className={FIELD} placeholder="The same one again"
            required disabled={isLoading} autoComplete="new-password"
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-1.5 text-[12px] text-[#C13F22]">These do not match yet.</p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-none rounded accent-[#C13F22]" disabled={isLoading}
          />
          <span className="text-[12.5px] leading-[1.5] text-[#4A5566] dark:text-gray-400">
            I agree to the{' '}
            <button
              type="button" onClick={() => setLegal('terms')}
              className="font-semibold text-[#C13F22] underline-offset-2 hover:underline dark:text-[#F5825E]"
            >
              Terms
            </button>
            {' '}and{' '}
            <button
              type="button" onClick={() => setLegal('privacy')}
              className="font-semibold text-[#C13F22] underline-offset-2 hover:underline dark:text-[#F5825E]"
            >
              Privacy Policy
            </button>.
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="flex h-12 w-full items-center justify-center rounded-[11px] text-[15px] font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
          style={{ background: '#C13F22', boxShadow: '0 8px 24px -14px #C13F22' }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating your account…
            </span>
          ) : 'Create my account'}
        </button>
      </form>

      {onToggleMode && (
        <p className="mt-4 text-center text-[13px] text-[#4A5566] dark:text-gray-400">
          Already have an account?{' '}
          <button
            onClick={onToggleMode} disabled={isLoading}
            className="font-semibold text-[#C13F22] hover:underline dark:text-[#F5825E]"
          >
            Sign in
          </button>
        </p>
      )}

      {/* Rendered inside the auth modal's stacking context, so it sits above it
          rather than behind — the auth modal is z-9999 and this is z-50. */}
      {legal && <FooterPageModal page={legal} onClose={() => setLegal(null)} />}
    </div>
  );
}
