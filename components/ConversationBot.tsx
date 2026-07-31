import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { translateText, getConversationResponse, AiError, ChatHistoryItem } from '../services/geminiService';
import { Keyboard } from 'lucide-react';
import { useToastContext } from '../contexts/ToastContext';
import { commonPhrases } from '../data/koreanData';
import { accentFor } from '../utils/moduleAccent';
import HangulKeyboard from './HangulKeyboard';
import { appendJamo, backspaceJamo } from '../utils/hangulCompose';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionAlternative { transcript: string; confidence: number; }
interface SpeechRecognitionErrorEvent extends Event { error: string; message: string; }
declare var SpeechRecognition: { prototype: SpeechRecognition; new(): SpeechRecognition; };

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  translation?: string;
  showTranslation?: boolean;
  isVoiceMessage?: boolean;
}

interface ConversationBotProps {
  onClose?: () => void;
  dailyLimit?: number;
  usedToday?: number;
  /** Called after each exchange with the server-confirmed used count. */
  onMessageSent?: (usedFromServer?: number) => void;
}

const TOPICS = [
  { id: 'general',    name: '일반 대화', nameEn: 'General Chat',  emoji: '💬' },
  { id: 'restaurant', name: '레스토랑',  nameEn: 'Restaurant',    emoji: '🍽️' },
  { id: 'shopping',   name: '쇼핑',     nameEn: 'Shopping',      emoji: '🛒' },
  { id: 'travel',     name: '여행',     nameEn: 'Travel',         emoji: '✈️' },
  { id: 'work',       name: '직장',     nameEn: 'Work',           emoji: '💼' },
  { id: 'hobby',      name: '취미',     nameEn: 'Hobby',          emoji: '🎨' },
];

const ACC = accentFor('conversation');

// Which phrase contexts belong to each chat topic. Lets the "you could say"
// suggestions come from the app's own phrase list rather than being invented —
// so a beginner staring at an empty box is offered real Korean they can send.
const TOPIC_CONTEXTS: Record<string, string[]> = {
  general:    ['General', 'Feelings', 'Communication'],
  restaurant: ['Restaurant'],
  shopping:   ['Shopping'],
  travel:     ['Directions', 'Emergency'],
  work:       ['Introductions'],
  hobby:      ['Feelings', 'General'],
};

const DIFFICULTIES = [
  { id: 'beginner',     name: '초급', nameEn: 'Beginner',     style: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  { id: 'intermediate', name: '중급', nameEn: 'Intermediate', style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
  { id: 'advanced',     name: '고급', nameEn: 'Advanced',     style: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
];

const ConversationBot: React.FC<ConversationBotProps> = ({ onClose, dailyLimit = Infinity, usedToday = 0, onMessageSent }) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: '안녕하세요! 한국어 연습을 시작해볼까요? 어떤 주제로 대화하고 싶으세요?\n\nHello! Let\'s start practicing Korean! What topic would you like to chat about?',
    isUser: false,
    timestamp: new Date(),
  }]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [difficultyLevel, setDifficultyLevel] = useState('beginner');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'off' | 'input' | 'output' | 'both'>('off');
  const [uiLang, setUiLang] = useState<'en' | 'ko'>('en');
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const { showToast } = useToastContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // recognition.onresult is bound once at mount; without a ref it would call a
  // stale sendVoiceMessage that ignores the selected topic/difficulty and checks
  // the daily limit against the mount-time usedToday (letting voice bypass it).
  const sendVoiceMessageRef = useRef<(text: string) => void>(() => {});

  const L = (en: string, ko: string) => uiLang === 'en' ? en : ko;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR && 'speechSynthesis' in window) {
      setSpeechSupported(true);
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ko-KR';
      recognitionRef.current = recognition;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        setTimeout(() => { if (transcript.trim()) sendVoiceMessageRef.current(transcript); }, 500);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    }
  }, []);

  const speakText = useCallback((text: string, lang = 'ko-KR') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = 0.8; u.pitch = 1; u.volume = 0.8;
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(u);
    }
  }, []);

  // Recent turns sent as conversation memory (the server caps/validates again).
  const buildHistory = (): ChatHistoryItem[] =>
    messages.slice(-8).map(m => ({ role: m.isUser ? 'user' as const : 'model' as const, text: m.text }));

  const handleAiFailure = (e: unknown) => {
    if (e instanceof AiError && e.code === 'DAILY_LIMIT_REACHED') {
      // Sync the parent so it switches to the daily-limit screen.
      onMessageSent?.(e.limit ?? dailyLimit);
      return;
    }
    setMessages(p => [...p, { id: (Date.now() + 1).toString(), text: '죄송합니다. 잠시 문제가 있습니다. 다시 시도해 주세요.', isUser: false, timestamp: new Date() }]);
  };

  const sendVoiceMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (usedToday >= dailyLimit) return;
    const history = buildHistory();
    const userMsg: Message = { id: Date.now().toString(), text: text.trim(), isUser: true, timestamp: new Date(), isVoiceMessage: true };
    setMessages(p => [...p, userMsg]);
    setInputText('');
    setIsLoading(true);
    try {
      const { reply, used } = await getConversationResponse(text, selectedTopic, difficultyLevel, history);
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: reply, isUser: false, timestamp: new Date() };
      setMessages(p => [...p, botMsg]);
      onMessageSent?.(used);
      if ((voiceMode === 'output' || voiceMode === 'both') && reply) setTimeout(() => speakText(reply), 500);
    } catch (e) {
      handleAiFailure(e);
    } finally {
      setIsLoading(false);
    }
  };
  // Keep the ref current so the mount-bound onresult handler always calls the
  // latest closure (current topic/difficulty/usedToday/voiceMode).
  sendVoiceMessageRef.current = sendVoiceMessage;

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) { setIsListening(true); recognitionRef.current.start(); }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) { recognitionRef.current.stop(); setIsListening(false); }
  }, [isListening]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    if (usedToday >= dailyLimit) return;
    const history = buildHistory();
    const text = inputText.trim();
    const userMsg: Message = { id: Date.now().toString(), text, isUser: true, timestamp: new Date() };
    setMessages(p => [...p, userMsg]);
    setInputText('');
    setIsLoading(true);
    try {
      const { reply, used } = await getConversationResponse(text, selectedTopic, difficultyLevel, history);
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: reply, isUser: false, timestamp: new Date() };
      setMessages(p => [...p, botMsg]);
      onMessageSent?.(used);
      if ((voiceMode === 'output' || voiceMode === 'both') && reply) setTimeout(() => speakText(reply), 500);
    } catch (e) {
      handleAiFailure(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async (id: string, text: string) => {
    setTranslatingId(id);
    try {
      const translation = await translateText(text);
      setMessages(p => p.map(m => m.id === id ? { ...m, translation, showTranslation: true } : m));
    } catch {
      showToast(L('Translation failed. Please try again.', '번역에 실패했습니다. 다시 시도해 주세요.'), 'error');
    } finally {
      setTranslatingId(null);
    }
  };

  const toggleTranslation = (id: string) => {
    setMessages(p => p.map(m => m.id === id ? { ...m, showTranslation: !m.showTranslation } : m));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  // Real phrases the learner could send right now, drawn from the app's own
  // phrase list and filtered to the chosen topic. Tapping one loads it into the
  // box rather than sending it — a stray tap should never spend a daily message.
  const suggestions = useMemo(() => {
    const contexts = TOPIC_CONTEXTS[selectedTopic] ?? [];
    return commonPhrases.filter(p => contexts.includes(p.context)).slice(0, 3);
  }, [selectedTopic]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const useSuggestion = (korean: string) => {
    setInputText(korean);
    inputRef.current?.focus();
  };

  const topicLabel = TOPICS.find(t => t.id === selectedTopic);
  const busy = isListening || isSpeaking || isLoading;
  const statusLabel = isListening ? L('Listening', '듣는 중')
    : isSpeaking ? L('Speaking', '말하는 중')
    : isLoading ? L('Tutor is thinking', '생각 중')
    : L('Tutor is ready', '준비됐어요');

  const railCard = 'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
          {L('AI Chat', 'AI 대화')}
          <span className="text-[#4A5566] dark:text-gray-500">
            {' · '}{uiLang === 'ko' ? topicLabel?.name : topicLabel?.nameEn}
          </span>
        </h1>
        <div className="flex flex-none items-center gap-3.5">
          <span className="flex items-center gap-2">
            <span className="relative flex h-[7px] w-[7px]">
              {busy && (
                <span className="kl-pulse absolute inset-0 rounded-full" style={{ background: `${ACC.light}80` }} />
              )}
              <span className="relative h-[7px] w-[7px] rounded-full" style={{ background: busy ? ACC.light : '#4A5566' }} />
            </span>
            <span className="text-[13.5px] font-semibold text-[#16202F] dark:text-gray-200">{statusLabel}</span>
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
            >
              {L('End session', '대화 끝내기')}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        {/* ── The conversation ── */}
        <div className="order-1 w-full min-w-0 flex-1">
          <div className="kl-card flex flex-col p-4 sm:p-6">
            <div className="flex max-h-[52vh] min-h-[340px] flex-col gap-3.5 overflow-y-auto">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] px-4 py-3.5 ${
                      msg.isUser
                        ? 'rounded-[14px_14px_4px_14px] text-white'
                        : 'kl-well rounded-[14px_14px_14px_4px]'
                    }`}
                    style={msg.isUser ? { background: ACC.light } : undefined}
                  >
                    {msg.isVoiceMessage && (
                      <span className="mr-1.5 text-[11px] opacity-70">🎙️</span>
                    )}
                    <span className={`whitespace-pre-wrap font-korean text-[16px] leading-[1.55] ${
                      msg.isUser ? 'font-semibold' : 'text-[#16202F] dark:text-white'
                    }`}>
                      {msg.text}
                    </span>

                    {msg.translation && msg.showTranslation && (
                      <div
                        className="mt-2.5 rounded-lg border-l-2 px-3 py-2 text-[13.5px]"
                        style={{
                          borderColor: msg.isUser ? 'rgba(255,255,255,0.5)' : ACC.light,
                          background: msg.isUser ? 'rgba(255,255,255,0.14)' : `${ACC.light}12`,
                          color: msg.isUser ? '#fff' : undefined,
                        }}
                      >
                        <span className={msg.isUser ? '' : 'text-[#3E4A5A] dark:text-gray-300'}>{msg.translation}</span>
                      </div>
                    )}
                  </div>

                  {/* Row actions — printed, not hover-only */}
                  <div className={`mt-1.5 flex items-center gap-2.5 ${msg.isUser ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[11.5px] text-[#4A5566] dark:text-gray-500">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {speechSupported && (
                      <button
                        onClick={() => speakText(msg.text)}
                        disabled={isSpeaking}
                        aria-label={L('Read message aloud', '메시지 읽어주기')}
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#4A5566] transition-colors hover:text-[#16202F] disabled:opacity-40 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <span className="flex h-2.5 items-end gap-[2px]" aria-hidden="true">
                          <span className="kl-bar w-[2.5px]" style={{ height: '100%', background: ACC.light }} />
                          <span className="kl-bar w-[2.5px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.15s' }} />
                          <span className="kl-bar w-[2.5px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.3s' }} />
                        </span>
                        {L('Hear it', '듣기')}
                      </button>
                    )}
                    {msg.translation ? (
                      <button
                        onClick={() => toggleTranslation(msg.id)}
                        className="text-[12px] font-medium text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {msg.showTranslation ? L('Hide translation', '번역 숨기기') : L('Show translation', '번역 보기')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTranslate(msg.id, msg.text)}
                        disabled={translatingId === msg.id}
                        className="text-[12px] font-medium text-[#4A5566] transition-colors hover:text-[#16202F] disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {translatingId === msg.id ? L('Translating…', '번역 중…') : L('Translate', '번역하기')}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="kl-well flex items-center gap-1.5 self-start rounded-[14px_14px_14px_4px] px-4 py-4">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-[#4A5566] dark:bg-gray-500"
                      style={{ animation: `klFade 1.4s ease-in-out ${d}s infinite` }}
                    />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Say something ── */}
            <div className="mt-5 border-t border-[rgba(20,32,47,0.12)] pt-4 dark:border-gray-800">
              {suggestions.length > 0 && (
                <>
                  <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
                    {L('You could say', '이렇게 말해보세요')}
                    <span className="ml-2 text-[12.5px] font-normal text-[#4A5566] dark:text-gray-500">
                      {L('tap to put it in the box', '눌러서 입력창에 넣기')}
                    </span>
                  </div>
                  <div className="mb-3.5 flex flex-wrap gap-2.5">
                    {suggestions.map(s => (
                      <button
                        key={s.korean}
                        onClick={() => useSuggestion(s.korean)}
                        className="flex h-11 items-center gap-2 rounded-full border-[1.5px] px-4 transition-transform hover:-translate-y-0.5"
                        style={{ borderColor: `${ACC.light}66`, background: `${ACC.light}0F` }}
                        title={s.english}
                      >
                        <span className="font-korean text-[15px] font-semibold text-[#16202F] dark:text-white">{s.korean}</span>
                        <span className="text-[12.5px] text-[#4A5566] dark:text-gray-400">{s.english}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="flex items-end gap-2.5">
                {/* The travelling glow marks where you type without a heavy border. */}
                <div className="kl-glow-ring min-w-0 flex-1 rounded-[10px]">
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={L('Type in Korean or English…', '한국어나 영어로 입력하세요…')}
                    className="min-h-[48px] w-full resize-none rounded-[10px] bg-[#FFFCF4] px-4 py-3 text-[14.5px] text-[#16202F] focus:outline-none dark:bg-gray-900 dark:text-white"
                    rows={1}
                    disabled={isLoading || isListening}
                  />
                </div>

                {/* Most learners have no Korean IME — this is how they type Korean
                    at all, so the button says what it is rather than relying on 한
                    being recognised. */}
                <div className="relative flex-none">
                  {/* A bobbing keyboard mark says "you can type Korean here" in the
                      space a word would have cost. The button keeps the words in its
                      tooltip and aria-label for anyone who needs them. */}
                  {!showKeyboard && (
                    <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2">
                      <span className="kl-bob block" style={{ color: ACC.light }}>
                        <Keyboard className="h-[17px] w-[17px]" />
                      </span>
                    </span>
                  )}
                  <button
                    onClick={() => setShowKeyboard(v => !v)}
                    className={`flex h-12 items-center justify-center rounded-[10px] border-[1.5px] px-3 font-korean text-[15px] font-bold transition-colors ${
                      showKeyboard
                        ? 'text-white'
                        : 'text-[#16202F] dark:text-gray-200'
                    }`}
                    style={showKeyboard
                      ? { background: ACC.light, borderColor: ACC.light }
                      : { borderColor: `${ACC.light}80`, background: `${ACC.light}0F` }}
                    title={L('Korean keyboard', '한글 자판')}
                    aria-pressed={showKeyboard}
                  >
                    한
                  </button>
                </div>

                {speechSupported && (voiceMode === 'input' || voiceMode === 'both') && (
                  isListening ? (
                    <button
                      onClick={stopListening}
                      className="flex h-12 w-12 flex-none items-center justify-center rounded-[10px] bg-[#C13F22] text-white"
                      title={L('Stop voice input', '음성 입력 중지')}
                    >
                      ⏹
                    </button>
                  ) : (
                    <button
                      onClick={startListening}
                      disabled={isLoading}
                      className="flex h-12 w-12 flex-none items-center justify-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] text-[#16202F] disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
                      title={L('Start voice input', '음성 입력 시작')}
                    >
                      🎙️
                    </button>
                  )
                )}

                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="flex h-12 w-12 flex-none items-center justify-center rounded-[10px] bg-[#A8761F] text-white"
                    title={L('Stop speaking', '음성 출력 중지')}
                  >
                    ⏹
                  </button>
                )}

                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading || usedToday >= dailyLimit}
                  className="flex h-12 w-12 flex-none items-center justify-center rounded-[10px] text-[16px] font-semibold text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                  style={{ background: ACC.light }}
                  title={L('Send', '전송')}
                >
                  →
                </button>
              </div>
              {showKeyboard && (
                <HangulKeyboard
                  value={inputText}
                  onJamo={j => { setInputText(t => appendJamo(t, j)); inputRef.current?.focus(); }}
                  onSpace={() => { setInputText(t => t + ' '); inputRef.current?.focus(); }}
                  onBackspace={() => { setInputText(t => backspaceJamo(t)); inputRef.current?.focus(); }}
                  onClose={() => setShowKeyboard(false)}
                />
              )}

              <p className="mt-2 text-[12px] text-[#4A5566] dark:text-gray-500">
                {L('Answer in Korean or English — both are fine. No Korean keyboard? Tap 한.',
                   '한국어나 영어로 답해도 괜찮아요. 한글 자판이 없으면 한 을 누르세요.')}
              </p>
            </div>
          </div>
        </div>

        {/* ── Rail: what this session is set to ── */}
        <div className="order-2 w-full flex-none lg:w-[290px]">
          <div className={`${railCard} mb-3.5`}>
            <div className="mb-3 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
              {L('Settings', '설정')}
            </div>

            <label className="mb-1.5 block text-[12.5px] text-[#4A5566] dark:text-gray-400">{L('Topic', '주제')}</label>
            <select
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
              className="mb-4 w-full rounded-lg border border-[rgba(20,32,47,0.18)] bg-[#FFFCF4] px-3 py-2 text-[13.5px] text-[#16202F] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {TOPICS.map(t => (
                <option key={t.id} value={t.id}>{uiLang === 'ko' ? t.name : t.nameEn}</option>
              ))}
            </select>

            <label className="mb-1.5 block text-[12.5px] text-[#4A5566] dark:text-gray-400">{L('Level', '난이도')}</label>
            <div className="mb-4 flex gap-1.5">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDifficultyLevel(d.id)}
                  className={`flex h-9 flex-1 items-center justify-center rounded-lg text-[12.5px] font-semibold transition-colors ${
                    difficultyLevel === d.id
                      ? 'text-white'
                      : 'border border-[rgba(20,32,47,0.14)] text-[#4A5566] dark:border-gray-700 dark:text-gray-400'
                  }`}
                  style={difficultyLevel === d.id ? { background: ACC.light } : undefined}
                >
                  {uiLang === 'ko' ? d.name : d.nameEn}
                </button>
              ))}
            </div>

            {speechSupported && (
              <>
                <label className="mb-1.5 block text-[12.5px] text-[#4A5566] dark:text-gray-400">{L('Voice', '음성')}</label>
                <select
                  value={voiceMode}
                  onChange={e => setVoiceMode(e.target.value as typeof voiceMode)}
                  className="mb-4 w-full rounded-lg border border-[rgba(20,32,47,0.18)] bg-[#FFFCF4] px-3 py-2 text-[13.5px] text-[#16202F] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="off">{L('Off', '끄기')}</option>
                  <option value="input">{L('Speak to it', '입력만')}</option>
                  <option value="output">{L('Hear replies', '출력만')}</option>
                  <option value="both">{L('Both', '입력+출력')}</option>
                </select>
              </>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[12.5px] text-[#4A5566] dark:text-gray-400">{L('Interface', '화면 언어')}</span>
              <button
                onClick={() => setUiLang(uiLang === 'en' ? 'ko' : 'en')}
                className="rounded-lg border border-[rgba(20,32,47,0.18)] px-3 py-1.5 text-[12.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
              >
                {uiLang === 'en' ? '한글' : 'English'}
              </button>
            </div>
          </div>

          {dailyLimit !== Infinity && (
            <div className={railCard}>
              <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">
                {L('Messages today', '오늘 대화')}
              </div>
              <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (usedToday / dailyLimit) * 100)}%`,
                    background: usedToday >= dailyLimit ? '#C13F22' : ACC.light,
                  }}
                />
              </div>
              <p className="text-[13.5px] text-[#4A5566] dark:text-gray-400">
                {Math.max(0, dailyLimit - usedToday)} {L('left of', '/')} {dailyLimit}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationBot;
