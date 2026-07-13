import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, X } from 'lucide-react';
import { translateText, getConversationResponse, AiError, ChatHistoryItem } from '../services/geminiService';
import { useToastContext } from '../contexts/ToastContext';

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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #2F5D8A, #3F8571)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 text-xl">🤖</div>
          <div className="min-w-0">
            <p className="font-black text-sm leading-tight truncate">{L('Korean Conversation Practice', '한국어 대화 연습')}</p>
            <p className="text-[11px] text-white/70 truncate">{L('Practice with AI Teacher', 'AI 선생님과 함께 연습해요')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {dailyLimit !== Infinity && (
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${usedToday >= dailyLimit ? 'bg-red-500/40' : 'bg-white/20'}`}>
              💬 {usedToday}/{dailyLimit}
            </span>
          )}
          <button
            onClick={() => setUiLang(uiLang === 'en' ? 'ko' : 'en')}
            className="text-[11px] font-bold px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            🌐 {uiLang === 'en' ? '한글' : 'EN'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close chat"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Settings bar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex-shrink-0">
        {/* Topic */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{L('Topic:', '주제:')}</span>
          <select
            value={selectedTopic}
            onChange={e => setSelectedTopic(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          >
            {TOPICS.map(t => (
              <option key={t.id} value={t.id}>{t.emoji} {uiLang === 'ko' ? t.name : t.nameEn}</option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{L('Level:', '난이도:')}</span>
          <div className="flex gap-1">
            {DIFFICULTIES.map(d => (
              <button
                key={d.id}
                onClick={() => setDifficultyLevel(d.id)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${difficultyLevel === d.id ? d.style : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
              >
                {uiLang === 'ko' ? d.name : d.nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* Voice mode */}
        {speechSupported && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">🎙️ {L('Voice:', '음성:')}</span>
            <select
              value={voiceMode}
              onChange={e => setVoiceMode(e.target.value as typeof voiceMode)}
              className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
            >
              <option value="off">{L('Off', '끄기')}</option>
              <option value="input">{L('Input Only', '입력만')}</option>
              <option value="output">{L('Output Only', '출력만')}</option>
              <option value="both">{L('Both', '입력+출력')}</option>
            </select>
          </div>
        )}

        {(isListening || isSpeaking) && (
          <span className={`text-[11px] font-bold ml-auto ${isListening ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
            {isListening ? '🎙️ ' + L('Listening…', '듣는 중…') : '🔊 ' + L('Speaking…', '말하는 중…')}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[82%]">
              <div
                className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.isUser
                    ? 'text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                }`}
                style={msg.isUser ? { background: 'var(--brand-gradient)' } : {}}
              >
                {msg.isVoiceMessage && <span className="text-[10px] opacity-70 mr-1">🎙️</span>}
                <span className="whitespace-pre-wrap">{msg.text}</span>
              </div>

              {msg.translation && msg.showTranslation && (
                <div className="mt-1.5 px-3 py-2 bg-[#EAF1F7] dark:bg-[#122840]/20 rounded-xl border-l-2 border-[#5C85B0]">
                  <p className="text-xs text-[#18344D] dark:text-[#B7CDE0]">{msg.translation}</p>
                </div>
              )}

              <div className={`flex items-center gap-2 mt-1 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <span className="text-[10px] text-gray-400">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {speechSupported && (
                  <button
                    onClick={() => speakText(msg.text)}
                    disabled={isSpeaking}
                    aria-label="Read message aloud"
                    className="p-1 text-[#3F8571] hover:text-[#2E6B59] dark:hover:text-[#6BA88F] disabled:opacity-40 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {msg.translation ? (
                  <button onClick={() => toggleTranslation(msg.id)} className="text-[10px] text-[#264D74] dark:text-[#5C85B0] hover:underline">
                    {msg.showTranslation ? L('Hide', '숨기기') : L('Show', '보기')}
                  </button>
                ) : (
                  <button onClick={() => handleTranslate(msg.id, msg.text)} disabled={translatingId === msg.id} className="text-[10px] text-[#264D74] dark:text-[#5C85B0] hover:underline disabled:opacity-50">
                    {translatingId === msg.id ? L('Translating…', '번역 중…') : L('Translate', '번역하기')}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              {[0, 0.1, 0.2].map((delay, i) => (
                <div key={i} className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={L('Type in Korean…', '한국어로 메시지를 입력하세요…')}
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-[#F07A55] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            rows={2}
            disabled={isLoading || isListening}
          />

          {speechSupported && (voiceMode === 'input' || voiceMode === 'both') && (
            isListening ? (
              <button
                onClick={stopListening}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500 text-white animate-pulse flex-shrink-0"
                title={L('Stop voice input', '음성 입력 중지')}
              >
                ⏹
              </button>
            ) : (
              <button
                onClick={startListening}
                disabled={isLoading}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#3F8571] text-white disabled:opacity-40 flex-shrink-0"
                title={L('Start voice input', '음성 입력 시작')}
              >
                🎙️
              </button>
            )
          )}

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-orange-500 text-white flex-shrink-0"
              title={L('Stop speaking', '음성 출력 중지')}
            >
              ⏹
            </button>
          )}

          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading || usedToday >= dailyLimit}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 transition-all hover:scale-105 active:scale-95"
            style={{ background: 'var(--brand-gradient)' }}
            title={L('Send', '전송')}
          >
            ➤
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500 truncate">
          {L('💡 Chat in Korean and click Translate when you need help', '💡 팁: 한국어로 대화하고 번역이 필요할 때 "번역하기"를 클릭하세요')}
        </p>
      </div>
    </div>
  );
};

export default ConversationBot;
