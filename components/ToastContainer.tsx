import React from 'react';
import { Toast } from '../hooks/useToast';
import Icon from './Icon';

interface ToastContainerProps {
  toasts: Toast[];
  onHideToast: (id: string) => void;
}

export default function ToastContainer({ toasts, onHideToast }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onHide={() => onHideToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onHide: () => void;
}

function ToastItem({ toast, onHide }: ToastItemProps) {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-600 text-white border-green-600';
      case 'error':
        return 'bg-red-600 text-white border-red-600';
      case 'warning':
        return 'bg-yellow-600 text-white border-yellow-600';
      default:
        return 'bg-blue-600 text-white border-blue-600';
    }
  };

  const getIconName = () => {
    switch (toast.type) {
      case 'success':
        return 'check';
      case 'error':
        return 'close';
      case 'warning':
        return 'lightbulb';
      default:
        return 'lightbulb';
    }
  };

  return (
    <div className={`
      flex items-center p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out
      animate-slideIn
      ${getToastStyles()}
    `}>
      <Icon icon={getIconName()} className="w-5 h-5 mr-3 flex-shrink-0" />
      <div className="flex-1 text-sm font-medium">
        {toast.message}
      </div>
      <button
        onClick={onHide}
        className="ml-3 p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Close notification"
      >
        <Icon icon="close" className="w-4 h-4" />
      </button>
    </div>
  );
}
