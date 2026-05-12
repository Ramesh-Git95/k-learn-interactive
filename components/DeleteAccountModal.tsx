import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';

interface Props {
  onClose: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const DeleteAccountModal: React.FC<Props> = ({ onClose }) => {
  const { logout } = useAuth();
  const { showToast } = useToastContext();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const confirmed = confirmText === 'DELETE';

  const handleDelete = async () => {
    if (!confirmed) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/auth/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed');

      // Wipe everything — account deletion is a complete clean break
      localStorage.clear();

      showToast('Your account has been permanently deleted.', 'info');
      await logout();
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* Red accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-rose-600" />

        <div className="p-7">
          {/* Icon + title */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-3xl mx-auto mb-4">
              🗑️
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">
              Delete your account?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This is permanent and cannot be undone.
            </p>
          </div>

          {/* What gets deleted */}
          <div className="bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40 rounded-2xl p-4 mb-6">
            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-3">
              What will be deleted
            </p>
            {[
              'Your account and login credentials',
              'All learning progress and streaks',
              'Bookmarks and saved words',
              'SRS decks and review history',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 mb-1.5">
                <span className="text-red-400 font-bold">✕</span>
                {item}
              </div>
            ))}
          </div>

          {/* Confirmation input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Type <span className="font-black text-red-500">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-3 rounded-xl border-2 text-sm font-mono transition-colors outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
              style={{
                borderColor: confirmText.length > 0
                  ? confirmed ? '#22C55E' : '#EF4444'
                  : undefined,
              }}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl text-sm font-bold border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!confirmed || loading}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
            >
              {loading ? 'Deleting…' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
