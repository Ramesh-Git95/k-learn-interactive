import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useAuth } from '../../contexts/AuthContext';

// One modal, two tabs — the owner's design. Previously the only way between
// sign-in and sign-up was a sentence at the bottom of whichever form you had
// landed on, so the other one was something you had to discover rather than
// something you could see.

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const { clearError } = useAuth();

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  useEffect(() => {
    if (isOpen) clearError();
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Escape closes, as it does for every other overlay in the app.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const go = (next: 'login' | 'register') => { clearError(); setMode(next); };
  const toggleMode = () => go(mode === 'login' ? 'register' : 'login');

  const tab = (id: 'register' | 'login', label: string) => {
    const on = mode === id;
    return (
      <button
        key={id}
        onClick={() => go(id)}
        aria-current={on ? 'true' : undefined}
        className={`relative flex-1 pb-3 text-[14.5px] font-semibold transition-colors ${
          on ? 'text-[#16202F] dark:text-white' : 'text-[#4A5566] hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        {label}
        <span
          className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full transition-opacity"
          style={{ background: '#C13F22', opacity: on ? 1 : 0 }}
        />
      </button>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="kl-card relative z-10 w-full max-w-md rounded-[20px] px-6 py-6 shadow-2xl sm:px-7">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-[10px] text-[#4A5566] transition-colors hover:bg-[rgba(20,32,47,0.06)] hover:text-[#16202F] dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-6 mt-1 flex gap-1 border-b border-[rgba(20,32,47,0.12)] pr-10 dark:border-gray-800">
            {tab('register', 'Create account')}
            {tab('login', 'Sign in')}
          </div>

          {mode === 'login'
            ? <LoginForm onToggleMode={toggleMode} onSuccess={onClose} />
            : <RegisterForm onToggleMode={toggleMode} onSuccess={onClose} />}
        </div>
      </div>
    </div>,
    document.body,
  );
}
