import React from 'react';

/** Shimmering placeholder block — sized entirely via className. */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

/** Full-page skeleton shown while auth + progress resolve on app boot.
    Mimics the dashboard layout so the transition feels seamless. */
export const AppBootSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
    {/* Header bar */}
    <div className="h-[66px] bg-white/80 dark:bg-gray-950/80 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 sm:px-6">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base" style={{ background: 'var(--brand-gradient)', fontFamily: 'Noto Sans KR, sans-serif' }}>한</div>
          <Skeleton className="w-20 h-5" />
        </div>
        <div className="hidden md:flex items-center gap-3">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="w-20 h-7 rounded-xl" />)}
        </div>
        <Skeleton className="w-24 h-8 rounded-xl" />
      </div>
    </div>

    {/* Content */}
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <Skeleton className="h-40 rounded-3xl mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <p className="text-center mt-8 text-sm font-korean text-pink-400/80">한글배움 · loading…</p>
    </div>
  </div>
);

/** Skeleton of the quiz screen (hero, mode pills, question card, options). */
export const QuizSkeleton: React.FC = () => (
  <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
    <Skeleton className="h-24 rounded-3xl mb-6" />
    <div className="flex gap-2 mb-5">
      {[0, 1, 2, 3].map(i => <Skeleton key={i} className="w-20 h-8 rounded-xl" />)}
    </div>
    <Skeleton className="h-2 rounded-full mb-5" />
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 mb-4">
      <Skeleton className="w-28 h-5 rounded-full mb-6" />
      <Skeleton className="h-9 w-3/4 mx-auto mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
      </div>
    </div>
  </div>
);

/** Skeleton of the SRS study card. */
export const StudyCardSkeleton: React.FC<{ onCancel?: () => void }> = ({ onCancel }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Skeleton className="w-40 h-8" />
        <Skeleton className="w-16 h-8" />
      </div>
      <div className="max-w-2xl mx-auto mt-2.5"><Skeleton className="h-2 rounded-full" /></div>
    </div>
    <div className="max-w-2xl mx-auto p-4 pt-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-8 text-center">
        <Skeleton className="w-24 h-6 rounded-full mx-auto mb-6" />
        <Skeleton className="h-12 w-1/2 mx-auto mb-4" />
        <Skeleton className="h-4 w-1/3 mx-auto mb-10" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
      {onCancel && (
        <p className="text-center mt-4">
          <button onClick={onCancel} className="text-sm text-pink-500 hover:text-pink-600 font-semibold">Cancel</button>
        </p>
      )}
    </div>
  </div>
);

export default Skeleton;
