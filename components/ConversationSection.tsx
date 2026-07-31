import React, { useState, useCallback, useEffect } from 'react';
import ScriptedConversation from './ScriptedConversation';
import ConversationBot from './ConversationBot';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { earnXP, markStudyToday } from '../utils/xpStreak';
import { useUpgrade } from '../hooks/useUpgrade';
import { getChatQuota } from '../services/geminiService';
import { accentFor } from '../utils/moduleAccent';

const ACC = accentFor('conversation');


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
  // Two ways to practise, as a plain segmented control rather than a pair of
  // shouting gradient tabs.
  const TabBar = (
    <div className="mb-6 flex gap-2">
      {([
        ['scenarios', 'Practice scenarios'],
        ['ai', 'AI chat'],
      ] as [Tab, string][]).map(([id, label]) => (
        <button
          key={id}
          onClick={() => { setTab(id); setShowBot(false); }}
          className={`inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-[13.5px] font-semibold transition-colors ${
            tab === id
              ? 'text-white'
              : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
          }`}
          style={tab === id ? { background: ACC.light } : undefined}
        >
          {label}
          {id === 'ai' && isAuthenticated && dailyLimit !== Infinity && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
              style={tab === id
                ? { background: 'rgba(255,255,255,0.22)' }
                : { background: limitReached ? 'rgba(193,63,34,0.12)' : 'rgba(20,32,47,0.06)', color: limitReached ? '#C13F22' : undefined }}
            >
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
        <div className="mx-auto max-w-6xl">{TabBar}</div>
        <ScriptedConversation />
      </div>
    );
  }

  // ── AI Chat tab ──────────────────────────────────────────────────────────────

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-6xl">
        {TabBar}
        <div className="kl-card mx-auto max-w-2xl p-8 text-center">
          <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
            Sign in to chat with the tutor
          </h2>
          <p className="mx-auto mt-2.5 max-w-sm text-[14.5px] leading-relaxed text-[#3E4A5A] dark:text-gray-400">
            Free accounts get <strong className="font-semibold text-[#16202F] dark:text-white">5 conversations a day</strong>.
            Premium raises that to 50, with full voice and topic controls.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }))}
            className="mt-6 inline-flex h-12 items-center rounded-[10px] px-6 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
          >
            Sign in free →
          </button>
        </div>
      </div>
    );
  }

  // Limit reached
  if (limitReached) {
    return (
      <div className="mx-auto max-w-6xl">
        {TabBar}
        <div className="kl-card mx-auto max-w-2xl p-8 text-center">
          <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
            That is today&apos;s {dailyLimit} conversations
          </h2>
          <p className="mx-auto mt-2.5 max-w-sm text-[14.5px] leading-relaxed text-[#3E4A5A] dark:text-gray-400">
            Your messages reset at midnight. The scripted scenarios have no limit, so you can keep
            practising in the meantime.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setTab('scenarios')}
              className="flex h-12 items-center rounded-[10px] px-5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
            >
              Practise a scenario →
            </button>
            {!isPremium && (
              <button
                onClick={startUpgrade}
                className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
              >
                Get 50 a day · $4/mo
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active AI chat. Once the bot is open it owns the page — it renders its own
  // header and rail — so the section stops constraining it to a narrow column
  // and a fixed-height box.
  if (showBot) {
    return (
      <div className="mx-auto max-w-6xl">
        {TabBar}
        <ConversationBot
          onClose={() => setShowBot(false)}
          dailyLimit={dailyLimit}
          usedToday={usedToday}
          onMessageSent={handleMessageSent}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {TabBar}

      <div className="kl-card mx-auto max-w-2xl p-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <span className="text-[12.5px] font-semibold" style={{ color: ACC.light }}>
            {isPremium ? 'PREMIUM' : 'FREE PLAN'}
          </span>
          <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">
            · {remaining} of {dailyLimit} messages left today
          </span>
        </div>

        <h2 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
          Talk to your Korean tutor
        </h2>
        <p className="mx-auto mt-2.5 max-w-md text-[14.5px] leading-relaxed text-[#3E4A5A] dark:text-gray-400">
          Say anything in Korean or English — it replies in Korean at your level, and you can
          hear or translate any message. Nothing you type is graded.
        </p>

        <button
          onClick={() => setShowBot(true)}
          className="mt-6 inline-flex h-12 items-center rounded-[10px] px-6 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
          style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
        >
          Start a conversation →
        </button>

        {!isPremium && (
          <button
            onClick={startUpgrade}
            className="mt-4 block w-full text-[13px] font-semibold text-[#C13F22] hover:underline dark:text-[#F07A55]"
          >
            Get 50 messages a day with Premium · $4/mo
          </button>
        )}
      </div>
    </div>
  );
};

export default ConversationSection;
