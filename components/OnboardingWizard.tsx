import React, { useState } from 'react';
import { vocabulary, commonPhrases } from '../data/koreanData';
import useSRS from '../hooks/useSRS';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const GOALS = [
  { id: 'kpop',    emoji: '🎵', label: 'K-Pop',     sub: 'Understand song lyrics'        },
  { id: 'kdrama',  emoji: '🎭', label: 'K-Drama',   sub: 'Watch without subtitles'       },
  { id: 'travel',  emoji: '✈️', label: 'Travel',    sub: 'Visit Korea comfortably'       },
  { id: 'business',emoji: '💼', label: 'Business',  sub: 'Work with Korean colleagues'   },
  { id: 'curious', emoji: '🌟', label: 'Just Curious', sub: 'Explore the language'       },
];

const LEVELS = [
  { id: 'beginner',     emoji: '완전', label: 'Complete Beginner', sub: 'I can\'t read Hangul yet'        },
  { id: 'knows_hangul', emoji: '한글', label: 'Know Hangul',       sub: 'I can read but have few words'  },
  { id: 'intermediate', emoji: '중급', label: 'Intermediate',      sub: 'I can hold basic conversations' },
];

// Choose starter vocab based on goal
function getStarterItems(goal: string): { korean: string; english: string; romanization: string }[] {
  const greetings = vocabulary.find(c => c.name === 'Greetings')?.items ?? [];
  const food      = vocabulary.find(c => c.name === 'Food')?.items ?? [];
  const travel    = vocabulary.find(c => c.name === 'Transportation')?.items ?? [];
  const numbers   = vocabulary.find(c => c.name === 'Numbers')?.items ?? [];

  const pool =
    goal === 'travel'   ? [...greetings.slice(0, 10), ...travel.slice(0, 10)] :
    goal === 'business' ? [...greetings.slice(0, 10), ...numbers.slice(0, 10)] :
                          [...greetings.slice(0, 10), ...food.slice(0, 10)];

  return pool.slice(0, 20).map(item => ({
    korean:       item.korean,
    english:      item.english,
    romanization: item.romanization,
  }));
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [goal, setGoal]         = useState('');
  const [level, setLevel]       = useState('');
  const [creating, setCreating] = useState(false);
  const { actions } = useSRS();

  const handleFinish = async () => {
    setCreating(true);
    const goalLabel   = GOALS.find(g => g.id === goal)?.label  ?? 'Starter';
    const levelLabel  = LEVELS.find(l => l.id === level)?.label ?? '';
    const deckName    = `${goalLabel} Starter Deck`;
    const deckDesc    = `Auto-created for ${levelLabel} learners focused on ${goalLabel}`;

    const deckId = actions.createDeck(deckName, deckDesc);
    const items  = getStarterItems(goal);
    items.forEach(item =>
      actions.addCardToDeck(deckId, {
        korean:       item.korean,
        english:      item.english,
        romanization: item.romanization,
        type:         'vocabulary',
      })
    );

    // Small delay so the user sees the "creating" state
    await new Promise(r => setTimeout(r, 700));
    localStorage.setItem('k-learn-onboarding', 'done');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">

        {/* Top gradient bar */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#EC4899,#8B5CF6,#06B6D4)' }} />

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width:      step === n ? '2rem' : '0.5rem',
                background: step >= n ? 'linear-gradient(90deg,#EC4899,#8B5CF6)' : '#E5E7EB',
              }}
            />
          ))}
        </div>

        <div className="px-7 pb-8 pt-4">

          {/* ── Step 1: Goal ────────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🎯</div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">What's your goal?</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">We'll personalise your starter deck.</p>
              </div>
              <div className="space-y-2.5 mb-8">
                {GOALS.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      goal === g.id
                        ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{g.label}</div>
                      <div className="text-gray-400 text-xs">{g.sub}</div>
                    </div>
                    {goal === g.id && (
                      <span className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!goal}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' }}
              >
                Next →
              </button>
            </>
          )}

          {/* ── Step 2: Level ───────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">📊</div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Your current level?</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Be honest — we'll start you in the right place.</p>
              </div>
              <div className="space-y-2.5 mb-8">
                {LEVELS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      level === l.id
                        ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    <span className="text-xl font-black text-gray-400 w-8 text-center" style={{ fontFamily: 'Noto Sans KR,sans-serif' }}>{l.emoji}</span>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{l.label}</div>
                      <div className="text-gray-400 text-xs">{l.sub}</div>
                    </div>
                    {level === l.id && (
                      <span className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ background: 'linear-gradient(135deg,#8B5CF6,#06B6D4)' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!level}
                  className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  style={{ background: 'linear-gradient(135deg,#8B5CF6,#06B6D4)' }}
                >
                  Next →
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Ready ───────────────────────────────── */}
          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🚀</div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">You're all set!</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  We'll create a personalised <strong className="text-gray-700 dark:text-gray-200">{GOALS.find(g => g.id === goal)?.label} Starter Deck</strong> with 20 essential cards — perfect for a {LEVELS.find(l => l.id === level)?.label.toLowerCase()}.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 mb-6 space-y-3">
                {[
                  { icon: '📖', text: '20 essential vocabulary cards added to SRS' },
                  { icon: '🧠', text: 'SM-2 algorithm will schedule your reviews' },
                  { icon: '🔥', text: 'Study daily to keep your streak alive' },
                  { icon: '⭐', text: 'Earn XP and level up as you learn' },
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <span className="text-lg">{tip.icon}</span>
                    <span>{tip.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={creating}
                  className="px-5 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 transition-colors disabled:opacity-40"
                >
                  ← Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={creating}
                  className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' }}
                >
                  {creating ? '✨ Creating your deck…' : 'Start Learning 시작해요! →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
