import React, { useState, useCallback, useEffect } from 'react';
import ScriptedConversation from './ScriptedConversation';
import ConversationBot from './ConversationBot';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import { useUpgrade } from '../hooks/useUpgrade';
import { getChatQuota } from '../services/geminiService';


// ── Daily usage display cache (localStorage; the backend enforces the quota) ──
const getTodayKey = () => `klearn_ai_chat_${new Date().toISOString().slice(0, 10)}`;

const getUsedToday = (): number =>
  parseInt(localStorage.getItem(getTodayKey()) || '0', 10);

type Tab = 'scenarios' | 'ai';

const ConversationSection: React.FC = () => {
  const [tab, setTab] = useState<Tab>('scenarios');
  const [showBot, setShowBot] = useState(false);
  const [usedToday, setUsedToday] = useState<number>(getUsedToday);

  const { isAuthenticated } = useAuth();
  const { isPremium, getLimit } = useFeatureAccess();
  const { startUpgrade } = useUpgrade();

  const dailyLimit = isAuthenticated
    ? (getLimit('aiConversationsPerDay') as number)
    : 0;

  // Sync with the server's authoritative count on open (localStorage is only a
  // cosmetic cache — the backend enforces the real quota).
  useEffect(() => {
    if (!isAuthenticated) return;
    getChatQuota().then(q => {
      if (q) {
        localStorage.setItem(getTodayKey(), String(q.used));
        setUsedToday(q.used);
      }
    });
  }, [isAuthenticated]);

  const handleMessageSent = useCallback((usedFromServer?: number) => {
    setUsedToday(prev => {
      const next = typeof usedFromServer === 'number' ? usedFromServer : prev + 1;
      localStorage.setItem(getTodayKey(), String(next));
      if (next > prev) {
        earnXP(2);
        markStudyToday();
      }
      return next;
    });
  }, []);

  const remaining = Math.max(0, dailyLimit - usedToday);
  const limitReached = isAuthenticated && usedToday >= dailyLimit;

  // ── Tab bar ─────────────────────────────────────────────────────────────────
  const TabBar = (
    <div className="flex rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm mb-6">
      {([
        ['scenarios', '💬', 'Practice Scenarios'],
        ['ai',        '🤖', 'AI Chat'],
      ] as [Tab, string, string][]).map(([id, em, label]) => (
        <button
          key={id}
          onClick={() => { setTab(id); setShowBot(false); }}
          className={`flex-1 py-2.5 text-sm font-black transition-all flex items-center justify-center gap-2 ${
            tab === id ? 'tab-brand-active' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          {em} {label}
          {id === 'ai' && isAuthenticated && dailyLimit !== Infinity && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              tab === 'ai' ? 'badge-brand' : limitReached ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}>
              {remaining}/{dailyLimit}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  // ── Scenarios tab ────────────────────────────────────────────────────────────
  if (tab === 'scenarios') {
    return (
      <div>
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-0">
          {TabBar}
        </div>
        <ScriptedConversation />
      </div>
    );
  }

  // ── AI Chat tab ──────────────────────────────────────────────────────────────

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        {TabBar}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🔑</div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Sign in to chat with AI</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Free accounts get <strong>5 AI conversations per day</strong>. Premium unlocks 50/day with full voice + topic controls.
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }))}
              className="px-8 py-3 text-white text-sm font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              style={{ background: 'var(--brand-gradient)' }}
            >
              Sign In Free →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Limit reached
  if (limitReached) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        {TabBar}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">⏰</div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Daily limit reached</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              You've used all <strong>{dailyLimit} AI conversations</strong> for today.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
              Resets at midnight · Or upgrade for {isPremium ? 'more messages' : '50 messages/day'}
            </p>
            {!isPremium && (
              <button
                onClick={startUpgrade}
                className="px-8 py-3 text-white text-sm font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all mb-3 block w-full"
                style={{ background: 'var(--brand-gradient)' }}
              >
                ⭐ Get Premium — 50 AI chats/day
              </button>
            )}
            <button
              onClick={() => setTab('scenarios')}
              className="text-sm font-black text-[#3F8571] hover:underline"
            >
              Practice with scripted scenarios instead →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active AI chat
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      {TabBar}

      {/* Info strip */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isPremium
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            {isPremium ? '⭐ Premium' : '🆓 Free'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {remaining} of {dailyLimit} messages left today
          </span>
        </div>
        {!isPremium && (
          <button
            onClick={startUpgrade}
            className="text-xs font-black text-[#E4572E] hover:underline"
          >
            Upgrade for 50/day →
          </button>
        )}
      </div>

      {/* Bot */}
      {!showBot ? (
        <div
          className="rounded-2xl overflow-hidden p-8 text-center cursor-pointer hover:opacity-95 transition-opacity"
          style={{ background: 'var(--brand-gradient)' }}
          onClick={() => setShowBot(true)}
        >
          <div className="text-5xl mb-4">🤖</div>
          <h2 className="text-xl font-black text-white mb-2">Start AI Conversation</h2>
          <p className="text-white/80 text-sm mb-4">
            Chat freely in Korean. Your AI teacher will respond naturally and correct your mistakes.
          </p>
          <span className="inline-block px-6 py-2.5 bg-white text-[#265847] text-sm font-black rounded-xl hover:scale-[1.02] transition-transform">
            Start Chatting →
          </span>
        </div>
      ) : (
        <div className="h-[560px] sm:h-[640px] bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <ConversationBot
            onClose={() => setShowBot(false)}
            dailyLimit={dailyLimit}
            usedToday={usedToday}
            onMessageSent={handleMessageSent}
          />
        </div>
      )}
    </div>
  );
};

export default ConversationSection;
