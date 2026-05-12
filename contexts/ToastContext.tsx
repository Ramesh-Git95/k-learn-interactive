import React, { createContext, useContext, ReactNode } from 'react';
import useToast, { Toast } from '../hooks/useToast';

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toastUtils = useToast();
  
  return (
    <ToastContext.Provider value={toastUtils}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}
