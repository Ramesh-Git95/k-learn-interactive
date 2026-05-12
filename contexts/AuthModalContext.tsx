import React, { createContext, useContext, useState } from 'react';
import { AuthModal } from '../components/auth/AuthModal';

interface AuthModalContextType {
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
  isOpen: boolean;
  mode: 'login' | 'register';
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const openLogin = () => {
    setMode('login');
    setIsOpen(true);
  };

  const openRegister = () => {
    setMode('register');
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const value = {
    openLogin,
    openRegister,
    close,
    isOpen,
    mode,
  };

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal
        isOpen={isOpen}
        onClose={close}
        initialMode={mode}
      />
    </AuthModalContext.Provider>
  );
};
