import React from 'react';
import { GUMROAD_URL } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description: string;
  benefits: string[];
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, feature, description, benefits }) => {
  const { isAuthenticated } = useAuth();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Gradient header */}
        <div className="relative p-6 pb-4 text-center" style={{ background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)' }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="text-4xl mb-2">⭐</div>
          <h2 className="text-xl font-black text-white">Lifetime Access</h2>
          <h3 className="text-sm font-semibold text-pink-100 mt-1">{feature}</h3>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-5 leading-relaxed">{description}</p>

          {/* Benefits */}
          <div className="space-y-2 mb-5">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-base leading-none mt-0.5">✅</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div
            className="rounded-xl p-4 mb-5 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(139,92,246,0.08))' }}
          >
            <div className="text-3xl font-black" style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              $39
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">one-time · lifetime access · no subscription</div>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (isAuthenticated) {
                  window.open(GUMROAD_URL, '_blank');
                } else {
                  onClose();
                  window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'register' }));
                }
              }}
              className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
            >
              {isAuthenticated ? 'Get Lifetime Access — $39' : 'Create Free Account to Get Started →'}
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
