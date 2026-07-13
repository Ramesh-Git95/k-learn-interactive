import { useState, useRef, useCallback } from 'react';

export type SpeechState = 'idle' | 'listening' | 'done' | 'error' | 'unsupported';

export interface SpeechResult {
  score: number;
  transcript: string;
  label: string;
  emoji: string;
  colorClass: string;
}

// Levenshtein distance for scoring similarity
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '').replace(/[.,!?]/g, '');
}

function scoreMatch(heard: string, target: string, romanization?: string): number {
  const h = normalize(heard);
  const t = normalize(target);

  if (h === t) return 100;

  // Try against romanization too (some browsers return romanized text)
  const scores = [
    1 - levenshtein(h, t) / Math.max(h.length, t.length, 1),
  ];
  if (romanization) {
    const r = normalize(romanization);
    scores.push(1 - levenshtein(h, r) / Math.max(h.length, r.length, 1));
  }

  return Math.round(Math.max(...scores) * 100);
}

function getLabel(score: number): { label: string; emoji: string; colorClass: string } {
  if (score >= 90) return { label: 'Perfect!',       emoji: '🎉', colorClass: 'text-emerald-600 dark:text-emerald-400' };
  if (score >= 70) return { label: 'Great!',         emoji: '👍', colorClass: 'text-blue-600    dark:text-blue-400'    };
  if (score >= 50) return { label: 'Almost there!',  emoji: '💪', colorClass: 'text-amber-600   dark:text-amber-400'   };
  return               { label: 'Try again!',        emoji: '🔄', colorClass: 'text-[#A83619]    dark:text-[#F07A55]'    };
}

const isBrowserSupported = (): boolean =>
  typeof window !== 'undefined' &&
  !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);

// Daily attempt tracking for free users (stored in localStorage)
const STORAGE_KEY = 'k-learn-pronunciation-attempts';
const FREE_DAILY_LIMIT = 10;

export function getDailyAttempts(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    const today = new Date().toDateString();
    return date === today ? count : 0;
  } catch {
    return 0;
  }
}

export function incrementDailyAttempts(): void {
  try {
    const today = new Date().toDateString();
    const current = getDailyAttempts();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: current + 1 }));
  } catch {}
}

export function hasAttemptsRemaining(isPremium: boolean): boolean {
  if (isPremium) return true;
  return getDailyAttempts() < FREE_DAILY_LIMIT;
}

export function attemptsLeft(isPremium: boolean): number {
  if (isPremium) return Infinity;
  return Math.max(0, FREE_DAILY_LIMIT - getDailyAttempts());
}

// ── Main hook ──────────────────────────────────────────────────────────────────

export function useSpeechRecognition() {
  const [state, setState] = useState<SpeechState>(
    isBrowserSupported() ? 'idle' : 'unsupported'
  );
  const [result, setResult] = useState<SpeechResult | null>(null);
  const recognitionRef = useRef<any>(null);

  const reset = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setState('idle');
    setResult(null);
  }, []);

  const start = useCallback((targetKorean: string, romanization?: string) => {
    if (!isBrowserSupported()) { setState('unsupported'); return; }

    // Stop any existing session
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;

    recognition.onstart = () => setState('listening');

    recognition.onresult = (event: any) => {
      // Try all alternatives and pick the best score
      const alternatives: string[] = [];
      for (let i = 0; i < event.results[0].length; i++) {
        alternatives.push(event.results[0][i].transcript);
      }

      const best = alternatives.reduce<{ transcript: string; score: number }>(
        (acc, transcript) => {
          const s = scoreMatch(transcript, targetKorean, romanization);
          return s > acc.score ? { transcript, score: s } : acc;
        },
        { transcript: alternatives[0] || '', score: 0 }
      );

      const { label, emoji, colorClass } = getLabel(best.score);
      setResult({ score: best.score, transcript: best.transcript, label, emoji, colorClass });
      setState('done');
      incrementDailyAttempts();
    };

    recognition.onerror = (event: any) => {
      // 'no-speech' is common — treat as soft error, go back to idle
      if (event.error === 'no-speech' || event.error === 'aborted') {
        setState('idle');
      } else {
        setState('error');
      }
    };

    recognition.onend = () => {
      if (state === 'listening') setState('idle');
    };

    try {
      recognition.start();
    } catch {
      setState('error');
    }
  }, [state]);

  return { state, result, isSupported: isBrowserSupported(), start, reset };
}
