import React from 'react';

// Branded 404 for unknown paths (Hostinger's SPA fallback serves index.html
// for every path, so the app decides what a "missing page" looks like).
// True to K-Learn form, it teaches a phrase while apologizing.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div
          className="text-[7rem] leading-none font-black mb-3 select-none"
          style={{ background: 'var(--brand-gradient-hero)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
        >
          404
        </div>
        <p className="text-2xl font-black text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Pretendard Variable, sans-serif' }}>
          길을 잃으셨나요?
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-3">
          gireul ireusyeonnayo? — "Lost your way?"
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          This page doesn't exist — but you just learned a useful Korean phrase.
          Silver linings! 🌱
        </p>
        <a href="/" className="inline-block px-8 py-3 rounded-2xl text-white text-sm font-black btn-brand">
          Take me home →
        </a>
      </div>
    </div>
  );
}
