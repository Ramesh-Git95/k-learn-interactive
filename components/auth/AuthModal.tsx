import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useAuth } from '../../contexts/AuthContext';

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

  if (!isOpen) return null;

  const toggleMode = () => { clearError(); setMode(m => m === 'login' ? 'register' : 'login'); };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md z-10">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-20 w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white font-black transition-colors text-sm"
          >
            ✕
          </button>

          {mode === 'login'
            ? <LoginForm onToggleMode={toggleMode} onSuccess={onClose} />
            : <RegisterForm onToggleMode={toggleMode} onSuccess={onClose} />}
        </div>
      </div>
    </div>,
    document.body
  );
}

