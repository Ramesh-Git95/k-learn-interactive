import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { hangulCharacters } from '../data/koreanData';
import { GUMROAD_URL } from '../constants';

interface LandingPageProps {
  onGetStarted: () => void;
}


// ─── Static data ──────────────────────────────────────────────────────────────

const marqueeWords = [
  '안녕하세요', 'Hello', '감사합니다', 'Thank you', '사랑해', 'I love you',
  '한국어', 'Korean', '공부하다', 'To study', '맛있다', 'Delicious',
  '드라마', 'K-Drama', '아이돌', 'Idol', '화이팅', 'Fighting!',
  '괜찮아요', "It's okay", '진짜요?', 'Really?', '대박', 'Awesome',
  '어디예요?', 'Where is it?', '얼마예요?', 'How much?', '멋있다', 'Cool!',
];

const CORE_FEATURES = [
  { emoji: '가',  title: 'Hangul Mastery',       desc: 'Every consonant, vowel & syllable block — interactive drills with pronunciation audio.', gradient: 'from-pink-500 to-rose-500',      live: true  },
  { emoji: '📖', title: 'Vocabulary Builder',    desc: '1,000+ essential words across 10 categories. Click to hear native pronunciation.', gradient: 'from-violet-500 to-purple-600', live: true  },
  { emoji: '✏️', title: 'Grammar Patterns',      desc: 'Sentence structure from particles to verb endings — beginner to advanced.', gradient: 'from-orange-400 to-pink-500',    live: true  },
  { emoji: '🧠', title: 'Spaced Repetition',     desc: 'SM-2 algorithm schedules every review at exactly the right moment. Build decks in seconds with Quick Import.', gradient: 'from-blue-500 to-indigo-600',    live: true  },
  { emoji: '🤖', title: 'AI Conversation',       desc: 'Chat with a Gemini-powered AI tutor that adapts to your level and corrects your Korean naturally.', gradient: 'from-teal-400 to-emerald-500',   live: true  },
  { emoji: '🎭', title: 'Honorific Engine',      desc: 'Master 존댓말 vs 반말 — formal, polite, and casual forms side-by-side with cultural notes.', gradient: 'from-rose-500 to-orange-500',    live: true  },
  { emoji: '⌨️', title: 'Typing Dojo',           desc: '60-second vocabulary race. Type as many Korean words as you can — track your WPM and accuracy.', gradient: 'from-cyan-500 to-teal-500',      live: true  },
  { emoji: '📋', title: 'TOPIK Prep',            desc: 'Official TOPIK I & II practice questions — vocabulary drills and reading comprehension.', gradient: 'from-amber-500 to-yellow-500',   live: true  },
  { emoji: '✍️', title: 'Stroke Canvas',         desc: 'Draw Hangul characters on a canvas and get real-time stroke-order feedback.', gradient: 'from-fuchsia-500 to-pink-500',   live: false },
  { emoji: '🎬', title: 'K-Drama Shadowing',     desc: 'Listen to real drama lines, repeat them, and compare your pronunciation with AI.', gradient: 'from-red-500 to-pink-500',       live: false },
];

const STEPS = [
  { n: '01', title: 'Build the Foundation',  desc: 'Start with Hangul in 30 minutes, then unlock vocabulary, grammar, and culture at your own pace.',                     color: '#EC4899' },
  { n: '02', title: 'Practice for Real',     desc: 'Chat with the AI tutor, race in Typing Dojo, study honorifics, and prep for TOPIK — all in one tab.',                  color: '#8B5CF6' },
  { n: '03', title: 'Never Forget',          desc: 'The SM-2 spaced repetition engine reviews every card at exactly the right moment. Knowledge sticks permanently.',       color: '#06B6D4' },
];

const TESTIMONIALS = [
  { text: 'I started for BTS lyrics and now I watch K-dramas without subtitles. The SRS system is genuinely the best I\'ve used.',        author: 'Priya S.',   role: 'K-Pop fan · 8 months learning',      avatar: '🎵', stars: 5 },
  { text: 'Went from zero to TOPIK Level 2 in 8 months. The AI chat + spaced repetition combo is unbeatable. Worth every penny.',          author: 'Marcus J.',  role: 'Software engineer · Seoul-bound',     avatar: '💻', stars: 5 },
  { text: 'Finally an app that teaches REAL Korean — honorifics, culture, drama phrases — not just tourist sentences. Amazing depth.',      author: 'Aiko T.',    role: 'Japanese expat · living in Seoul',    avatar: '🌸', stars: 5 },
];

const COMPARISON_ROWS = [
  { feature: 'Hangul Alphabet',          free: 'Full access',             premium: 'Full access' },
  { feature: 'Vocabulary',               free: '3 categories (39 words)', premium: 'All 94 words' },
  { feature: 'Grammar Patterns',         free: '4 of 7 patterns',         premium: 'All 7 + advanced' },
  { feature: 'Common Phrases',           free: '15 of 16 phrases',        premium: 'All phrases' },
  { feature: 'Cultural Insights',        free: '5 of 12 tips',            premium: 'All 12 + 3 subsections' },
  { feature: 'Honorific Engine',         free: '2 of 6 categories',       premium: 'All 6 categories' },
  { feature: 'Culture Cards',            free: '6 cards (Social)',         premium: 'All 24 cards' },
  { feature: 'Typing Dojo',              free: '15-sec demo',              premium: 'Full 60-sec game' },
  { feature: 'TOPIK Prep',               free: '3 q/session',              premium: 'Unlimited' },
  { feature: 'Scripted Conversations',   free: '2 of 6 scenarios',         premium: 'All 6 scenarios' },
  { feature: 'AI Chat Practice',         free: '5/day',                    premium: '50/day' },
  { feature: 'Quiz Modes',               free: 'Multiple choice only',     premium: 'All modes, no cap' },
  { feature: 'Spaced Repetition',        free: 'Full access',              premium: 'Full access' },
  { feature: 'Bookmarks',               free: 'Up to 15',                 premium: 'Unlimited' },
  { feature: 'Progress Cloud Sync',      free: '✕',                        premium: '✓' },
  { feature: 'Future features',          free: '✕',                        premium: 'All included' },
];

const FREE_BULLETS    = ['Hangul alphabet & pronunciation', '3 vocab categories (39 words)', '4 grammar patterns (60%)', '5 AI chats per day', 'Full spaced repetition (SRS)', 'Progress tracking'];
const PREMIUM_BULLETS = ['Everything in Free', 'All 94 vocabulary words', 'All 7 grammar patterns + advanced', '50 AI chats per day', 'All 6 Honorific categories', 'All 24 Culture Cards', 'Full 60-sec Typing Dojo', 'Unlimited TOPIK questions', 'All 6 scripted conversation scenarios', 'Unlimited bookmarks + cloud sync', 'Every new feature, forever'];

const FAQ = [
  { q: 'Is this really a one-time payment?',             a: 'Yes — $39 once, lifetime access. No monthly fees ever. Every new feature we ship is included at no extra cost.' },
  { q: 'Can I try before I buy?',                        a: 'Absolutely. The free tier is generous — Hangul, 3 vocabulary words, basic grammar, 5 AI chats per day, and full SRS. No credit card required to start.' },
  { q: 'Do I need any prior Korean knowledge?',          a: 'None at all. The Hangul module teaches the entire alphabet from scratch. Most learners can read Korean in under a week.' },
  { q: 'How long until I can have a real conversation?', a: 'With daily 20-minute sessions, most learners can handle basic conversations in 2–3 months. The AI tutor accelerates this significantly.' },
  { q: 'Is the payment secure?',                         a: 'Payment is processed entirely by Gumroad — a trusted platform used by 90,000+ creators. You get an instant download link and a 30-day money-back guarantee.' },
  { q: 'Will I get future features for free?',           a: 'Yes. Lifetime means lifetime. K-Drama Shadowing, Stroke Canvas, and everything else we build is included for lifetime members at no extra charge.' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const AnimatedCounter: React.FC<{ end: number; suffix?: string }> = ({ end, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) setStarted(true); }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let frame = 0;
    const total = 60;
    const timer = setInterval(() => {
      frame++;
      setCount(Math.floor((frame / total) * end));
      if (frame >= total) clearInterval(timer);
    }, 2000 / total);
    return () => clearInterval(timer);
  }, [started, end]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// Live Hangul demo — pick 8 characters, let users click to hear
const DEMO_CHARS = hangulCharacters.slice(0, 14).filter(c => c.type === 'consonant' || c.type === 'vowel').slice(0, 8);

const HangulDemo: React.FC = () => {
  const [active, setActive] = useState<number | null>(null);
  const [played, setPlayed] = useState<Set<number>>(new Set());

  const speak = (char: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(char);
      u.lang = 'ko-KR'; u.rate = 0.75;
      window.speechSynthesis.speak(u);
    }
  };

  const handleClick = (i: number) => {
    setActive(i);
    speak(DEMO_CHARS[i].char);
    setPlayed(p => new Set(p).add(i));
  };

  return (
    <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/20 max-w-xl mx-auto">
      <p className="text-white/70 text-sm text-center mb-4 font-medium">
        👆 Click any character to hear its pronunciation
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-5">
        {DEMO_CHARS.map((ch, i) => (
          <button
            key={ch.char}
            onClick={() => handleClick(i)}
            className={`relative flex flex-col items-center justify-center rounded-2xl p-2 sm:p-3 transition-all duration-200 border-2 ${
              active === i
                ? 'bg-white border-white scale-110 shadow-lg'
                : played.has(i)
                ? 'bg-white/20 border-white/40 hover:scale-105'
                : 'bg-white/10 border-white/20 hover:bg-white/20 hover:scale-105'
            }`}
          >
            <span
              className={`text-xl sm:text-2xl font-black leading-none ${active === i ? 'text-pink-500' : 'text-white'}`}
              style={{ fontFamily: 'Noto Sans KR, sans-serif' }}
            >
              {ch.char}
            </span>
            {played.has(i) && (
              <span className={`text-[9px] mt-0.5 font-bold ${active === i ? 'text-violet-500' : 'text-white/60'}`}>
                {ch.romanization}
              </span>
            )}
          </button>
        ))}
      </div>

      {active !== null ? (
        <div className="text-center bg-white/10 rounded-2xl p-4">
          <span className="text-4xl font-black text-white" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
            {DEMO_CHARS[active].char}
          </span>
          <div className="text-white font-bold mt-1">
            /{DEMO_CHARS[active].romanization}/
          </div>
          <div className="text-white/60 text-xs mt-0.5 capitalize">{DEMO_CHARS[active].type}</div>
        </div>
      ) : (
        <div className="text-center text-white/40 text-sm py-2">
          ← Select a character above
        </div>
      )}

      <p className="text-center text-white/50 text-xs mt-4">
        Full Hangul alphabet · 40 characters · mastered in &lt; 1 week
      </p>
    </div>
  );
};

// FAQ Accordion
const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base pr-4">{q}</span>
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-black transition-transform"
          style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-800 pt-4">
          {a}
        </div>
      )}
    </div>
  );
};

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────

const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
  from?: 'bottom' | 'left' | 'right';
}> = ({ children, delay = 0, className = '', from = 'bottom' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const initial = from === 'left' ? 'translateX(-28px)' : from === 'right' ? 'translateX(28px)' : 'translateY(28px)';

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : initial,
        transition: `opacity 0.6s cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform 0.6s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  let openRegister: (() => void) | null = null;
  try {
    const ctx = useAuthModal();
    openRegister = ctx.openRegister;
  } catch { /* context not mounted */ }

  useEffect(() => { setLoaded(true); }, []);

  const handleStart = () => {
    if (user) onGetStarted();
    else if (openRegister) openRegister();
    else window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'register' }));
  };

  const handleNavigate = (section: 'vocabulary' | 'grammar' | 'culture') =>
    window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: section }));

  const visibleFeatures = showAllFeatures ? CORE_FEATURES : CORE_FEATURES.slice(0, 6);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-hidden">
      <style>{`
        @keyframes marquee    { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes floatA     { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-18px) rotate(5deg); } }
        @keyframes floatB     { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-12px) rotate(-4deg); } }
        @keyframes floatC     { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-22px); } }
        @keyframes fadeUp     { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobPulse  { 0%,100% { border-radius:60% 40% 30% 70%/60% 30% 70% 40%; } 50% { border-radius:30% 60% 70% 40%/50% 60% 30% 60%; } }
        @keyframes shimmer    { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }

        .marquee-track { animation: marquee 30s linear infinite; }
        .float-a       { animation: floatA 7s ease-in-out infinite; }
        .float-b       { animation: floatB 9s ease-in-out infinite; }
        .float-c       { animation: floatC 6s ease-in-out infinite; }
        .fade-up       { animation: fadeUp 0.7s ease-out forwards; }
        .blob          { animation: blobPulse 8s ease-in-out infinite; }

        .gradient-text {
          background: linear-gradient(135deg,#EC4899 0%,#8B5CF6 50%,#06B6D4 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .gradient-text-warm {
          background: linear-gradient(135deg,#EC4899,#F97316);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .btn-primary {
          background: linear-gradient(135deg,#EC4899,#8B5CF6);
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(236,72,153,0.35);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(236,72,153,0.5); }
        .btn-outline { border:2px solid #E5E7EB; transition:all 0.25s ease; }
        .dark .btn-outline { border-color:#374151; color:#D1D5DB; }
        .btn-outline:hover { border-color:#EC4899; color:#EC4899; transform:translateY(-2px); }
        .dark .btn-outline:hover { border-color:#EC4899; color:#F472B6; }
        .card-hover { transition:all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .card-hover:hover { transform:translateY(-5px); box-shadow:0 20px 40px rgba(0,0,0,0.1); }
        .dark .card-hover:hover { box-shadow:0 20px 40px rgba(0,0,0,0.4); }
        .gumroad-btn {
          background: linear-gradient(135deg,#FF90E8,#FF3366);
          transition:all 0.25s ease;
          box-shadow:0 4px 20px rgba(255,51,102,0.3);
        }
        .gumroad-btn:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(255,51,102,0.5); }
        .check-free  { background: #D1FAE5; color: #059669; }
        .dark .check-free  { background: rgba(16,185,129,0.15); color: #34D399; }
        .check-premium { background: linear-gradient(135deg,#EC4899,#8B5CF6); color: white; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 opacity-40 dark:opacity-20 blob" style={{ background: '#FCE7F3', filter: 'blur(60px)' }} />
        <div className="absolute top-1/3 -right-24 w-80 h-80 opacity-30 dark:opacity-15 blob" style={{ background: '#EDE9FE', filter: 'blur(50px)', animationDelay: '3s' }} />
        <div className="absolute -bottom-24 left-1/3 w-72 h-72 opacity-25 dark:opacity-10 blob" style={{ background: '#CFFAFE', filter: 'blur(50px)', animationDelay: '5s' }} />

        {/* Floating characters */}
        {[
          { char: '가', color: '#EC4899', top: '12%', left: '4%',  size: '5rem', cls: 'float-a', op: 0.12 },
          { char: '나', color: '#8B5CF6', top: '20%', right: '6%', size: '4rem', cls: 'float-b', op: 0.10 },
          { char: '다', color: '#06B6D4', bottom:'28%',left: '8%', size: '3.5rem',cls: 'float-c', op: 0.10 },
          { char: '한', color: '#F97316', bottom:'30%',right:'8%', size: '5.5rem',cls: 'float-a', op: 0.08 },
          { char: '글', color: '#10B981', top: '50%', left: '2%',  size: '3rem', cls: 'float-b', op: 0.07 },
        ].map((f, i) => (
          <div key={i} className={`absolute ${f.cls} pointer-events-none select-none dark:opacity-[0.18]`}
            style={{ fontSize: f.size, fontWeight: 900, color: f.color, fontFamily: 'Noto Sans KR,sans-serif', opacity: f.op, top: f.top, bottom: (f as any).bottom, left: f.left, right: (f as any).right }}>
            {f.char}
          </div>
        ))}

        <div className={`relative z-10 max-w-5xl mx-auto text-center ${loaded ? 'fade-up' : 'opacity-0'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-50 to-violet-50 dark:from-pink-900/30 dark:to-violet-900/30 border border-pink-200 dark:border-pink-700/50 rounded-full px-5 py-2 mb-8">
            <span className="text-base">🎬</span>
            <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">Built for K-Drama fans · Not another Duolingo</span>
            <span className="text-base">🇰🇷</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black leading-none mb-5 tracking-tight">
            <span className="block text-gray-900 dark:text-white">Stop Watching</span>
            <span className="block gradient-text">With Subtitles</span>
          </h1>

          <p className="text-xl sm:text-2xl mb-3 font-bold" style={{ fontFamily: 'Noto Sans KR,sans-serif', color: '#EC4899' }}>
            한국어를 진짜로 배워봐요! ✨
          </p>
          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-4 max-w-xl mx-auto leading-relaxed">
            The only Korean learning app built for K-drama fans.
            AI conversations, 1,000+ words, real grammar — not tourist phrases.
          </p>
          <p className="text-sm sm:text-base font-black mb-10 max-w-lg mx-auto" style={{ color: '#8B5CF6' }}>
            Pay once. Own it forever. No monthly fees. Ever.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button onClick={handleStart} className="btn-primary text-white font-bold text-lg px-10 py-4 rounded-2xl">
              Start for Free →
            </button>
            <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" className="gumroad-btn text-white font-bold text-lg px-10 py-4 rounded-2xl inline-block">
              Get Lifetime Access — $39
            </a>
          </div>

          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
            No subscription · pay once · 30-day money-back guarantee
          </p>

          {/* vs Duolingo pill */}
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-full px-4 py-1.5 mb-10">
            <span className="text-xs font-black text-green-700 dark:text-green-400">💰 Duolingo costs $84–168/year. K-Learn is $39 once.</span>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400 dark:text-gray-500 mb-14">
            {['⚡ Free to start', '🔒 No credit card', '🎬 K-Drama vocab packs', '⭐ 4.9 / 5 rating'].map((t, i, arr) => (
              <React.Fragment key={t}>
                <span>{t}</span>
                {i < arr.length - 1 && <span className="hidden sm:inline">·</span>}
              </React.Fragment>
            ))}
          </div>

          {/* ── Live Hangul Demo ── */}
          <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#EC4899 0%,#8B5CF6 55%,#06B6D4 100%)' }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="relative z-10 p-6 sm:p-8">
              <div className="flex items-center justify-center gap-2 mb-5">
                <span className="text-2xl">🎮</span>
                <h3 className="text-white font-black text-lg sm:text-xl">Try Hangul Right Now</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">Interactive</span>
              </div>
              <HangulDemo />
              <button
                onClick={handleStart}
                className="mt-5 mx-auto block bg-white text-pink-600 font-black text-sm px-6 py-2.5 rounded-xl hover:scale-[1.02] transition-transform"
              >
                Learn all 40 characters for free →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────── */}
      <div className="py-4 overflow-hidden" style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6,#06B6D4)' }}>
        <div className="flex whitespace-nowrap">
          <div className="marquee-track flex gap-8 pr-8">
            {[...marqueeWords, ...marqueeWords].map((w, i) => (
              <span key={i} className="text-white font-semibold text-base opacity-90" style={{ fontFamily: i % 2 === 0 ? 'Noto Sans KR,sans-serif' : 'inherit' }}>
                {w}<span className="mx-4 opacity-40">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="py-14 bg-gray-50 dark:bg-gray-900/60">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: 10000, suf: '+', label: 'Active Learners' },
            { n: 1000,  suf: '+', label: 'Korean Words' },
            { n: 40,    suf: '',  label: 'Hangul Characters' },
            { n: 99,    suf: '%', label: 'Would Recommend' },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="text-4xl md:text-5xl font-black mb-1 gradient-text">
                <AnimatedCounter end={s.n} suffix={s.suf} />
              </div>
              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{s.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FREE PREVIEW ──────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
                No Signup Required
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
                Try It <span className="gradient-text">Right Now</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">Three full sections open to everyone — no account, no credit card.</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { section: 'vocabulary' as const, emoji: '📖', title: 'Vocabulary', desc: '1,000+ Korean words with native pronunciation audio', gradient: 'from-pink-500 to-rose-500' },
              { section: 'grammar'    as const, emoji: '✏️', title: 'Grammar',    desc: 'Sentence patterns from particles to verb endings',    gradient: 'from-violet-500 to-purple-600' },
              { section: 'culture'   as const, emoji: '🎌', title: 'Culture',    desc: 'K-pop, K-drama, regions, customs & daily Korean life', gradient: 'from-orange-400 to-pink-500' },
            ].map((item, i) => (
              <FadeIn key={item.section} delay={i * 120}>
                <button
                  onClick={() => handleNavigate(item.section)}
                  className="card-hover text-left p-7 rounded-3xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shadow-sm group w-full"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-2xl mb-5 shadow-md group-hover:scale-110 transition-transform`}>
                    {item.emoji}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 leading-relaxed">{item.desc}</p>
                  <span className={`text-sm font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                    Explore now →
                  </span>
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/60">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-block bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
                The Full Platform
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
                Everything You Need to <span className="gradient-text">Master Korean</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                10 learning tools in one platform — 8 live now, 2 more releasing soon.
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleFeatures.map((f, i) => (
              <FadeIn key={i} delay={i * 80}>
              <div className="card-hover relative p-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-[0.03] dark:opacity-[0.07]`} />
                {!f.live && (
                  <span className="absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full text-white" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
                    Coming Soon
                  </span>
                )}
                <div className="relative z-10">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-xl mb-4 shadow`} style={{ fontFamily: 'Noto Sans KR,sans-serif', fontWeight: 900 }}>
                    {f.emoji}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
              </FadeIn>
            ))}
          </div>

          {!showAllFeatures && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllFeatures(true)}
                className="px-6 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm hover:border-pink-400 hover:text-pink-500 dark:hover:text-pink-400 transition-all"
              >
                Show all {CORE_FEATURES.length} features ↓
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
                Zero to <span className="gradient-text-warm">Conversational</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Three stages, one platform.</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <FadeIn key={s.n} delay={i * 120}>
                <div className="card-hover p-7 rounded-3xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
                  <div className="text-[5rem] font-black leading-none mb-4 select-none" style={{ color: s.color, opacity: 0.12 }}>{s.n}</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{s.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${s.color}40, ${s.color})` }} />
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/60">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
                Real Learners, <span className="gradient-text">Real Results</span>
              </h2>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 120}>
                <div className="card-hover bg-white dark:bg-gray-900 p-7 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col h-full">
                  <div className="flex mb-3">
                    {Array.from({ length: t.stars }).map((_, j) => <span key={j} className="text-yellow-400">★</span>)}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-5 italic flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-violet-100 dark:from-pink-900/40 dark:to-violet-900/40 flex items-center justify-center text-xl flex-shrink-0">{t.avatar}</div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{t.author}</div>
                      <div className="text-gray-400 text-xs">{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-block bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
                Simple Pricing
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
                No Subscriptions. <span className="gradient-text">Ever.</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Pay once. Own everything. Every new feature included.</p>
            </div>
          </FadeIn>

          {/* Plan cards */}
          <div className="grid md:grid-cols-2 gap-8 items-start mb-10">
            {/* Free */}
            <FadeIn delay={0}>
              <div className="card-hover bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-3xl p-8">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Free Forever</div>
                <div className="text-5xl font-black text-gray-900 dark:text-white mb-1">$0</div>
                <div className="text-gray-400 text-sm mb-6">No credit card required</div>
                <ul className="space-y-2.5 mb-8">
                  {FREE_BULLETS.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="w-5 h-5 rounded-full check-free flex items-center justify-center text-xs flex-shrink-0 font-bold">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={handleStart} className="btn-outline w-full py-3.5 rounded-2xl font-bold text-sm bg-transparent text-gray-700 dark:text-gray-300">
                  Start Learning Free
                </button>
              </div>
            </FadeIn>

            {/* Lifetime */}
            <FadeIn delay={150}>
            <div className="card-hover relative rounded-3xl p-8 overflow-hidden" style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)' }}>
              <div className="absolute -top-px left-1/2 -translate-x-1/2">
                <span className="inline-block px-5 py-1.5 text-xs font-black uppercase tracking-widest rounded-b-full text-white" style={{ background: 'linear-gradient(135deg,#EC4899,#8B5CF6)' }}>
                  Best Value
                </span>
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-pink-400 mb-2 mt-3">Lifetime Access</div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-black text-white">$39</span>
                <span className="text-gray-500 text-sm mb-2 line-through">$99</span>
                <span className="mb-2 text-xs font-black px-2 py-0.5 rounded-full text-white bg-emerald-500/30 text-emerald-300">60% OFF</span>
              </div>
              <div className="text-gray-400 text-sm mb-6">One-time · via Gumroad · 30-day guarantee</div>
              <ul className="space-y-2.5 mb-8">
                {PREMIUM_BULLETS.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 font-bold check-premium">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" className="gumroad-btn block w-full py-3.5 rounded-2xl font-bold text-white text-sm text-center">
                Get Lifetime Access — $39
              </a>
              <p className="text-center text-xs text-gray-500 mt-3">Secure payment via Gumroad · Instant access</p>
            </div>
            </FadeIn>
          </div>

          {/* Comparison table */}
          <FadeIn>
          <div className="rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Feature</div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Free</div>
              <div className="text-xs font-black uppercase tracking-wider text-center gradient-text">Premium</div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 px-6 py-3 border-b border-gray-50 dark:border-gray-800/80 text-sm ${
                  i % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50/60 dark:bg-gray-900/40'
                }`}
              >
                <div className="font-medium text-gray-700 dark:text-gray-300">{row.feature}</div>
                <div className="text-center text-gray-400 dark:text-gray-500 text-xs flex items-center justify-center">{row.free}</div>
                <div className="flex items-center justify-center">
                  <span
                    className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: row.premium === '✕' ? '#9CA3AF' : 'linear-gradient(135deg,#EC4899,#8B5CF6)' }}
                  >
                    {row.premium}
                  </span>
                </div>
              </div>
            ))}
          </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/60">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
                Common <span className="gradient-text">Questions</span>
              </h2>
            </div>
          </FadeIn>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <FadeIn key={i} delay={i * 60}>
                <FaqItem q={item.q} a={item.a} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)' }}>
        <div className="absolute top-0 left-0 w-80 h-80 opacity-10 blob" style={{ background: '#EC4899', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 opacity-10 blob" style={{ background: '#8B5CF6', filter: 'blur(80px)', animationDelay: '4s' }} />

        <FadeIn>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-5 font-black" style={{ fontFamily: 'Noto Sans KR,sans-serif', background: 'linear-gradient(135deg,#EC4899,#8B5CF6,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            한국어
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight">
            Ready to Actually<br />
            <span style={{ background: 'linear-gradient(135deg,#EC4899,#F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Learn Korean?
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of K-culture fans, drama addicts, and aspiring expats who are learning the real way — starting today, for free.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button onClick={handleStart} className="btn-primary text-white font-bold text-lg px-10 py-4 rounded-2xl">
              Start for Free →
            </button>
            <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" className="gumroad-btn inline-block text-white font-bold text-lg px-10 py-4 rounded-2xl text-center">
              Get Lifetime Access — $39
            </a>
          </div>

          {/* Mini feature grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto mb-8">
            {['🎮 Interactive', '🧠 SRS Algorithm', '🤖 AI Tutor', '🇰🇷 Real Korean'].map(f => (
              <div key={f} className="bg-white/5 rounded-xl py-2 px-3 text-xs text-white/60 font-medium">{f}</div>
            ))}
          </div>

          <p className="text-gray-500 text-sm">No subscription · 30-day guarantee · Built with 🤍 for Korean learners</p>
        </div>
        </FadeIn>
      </section>
    </div>
  );
}
